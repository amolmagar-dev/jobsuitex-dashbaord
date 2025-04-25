/**
 * Job Runner Service for Automatic Job Search (Singleton Pattern)
 * 
 * This module provides a service that manages and executes scheduled job searches
 * based on user configurations in MongoDB.
 */
import cron from 'node-cron';
import browserInstance from '../../browser/browser.js';
import { JobConfigModel } from '../models/JobConfigModel.js';
import { NaukriJobAutomation } from '../services/NaukriJobAutomationService.js';

class JobRunner {
    // Private instance variable
    static #instance = null;
    static #isInitialized = false;
    
    /**
     * Get the singleton instance of JobRunner
     * @param {Object} app - The application instance
     * @returns {JobRunner} The singleton JobRunner instance
     */
    static getInstance(app) {
        if (!JobRunner.#instance) {
            JobRunner.#instance = new JobRunner(app);
        }
        
        // Update app reference if needed
        if (app && JobRunner.#instance.app !== app) {
            JobRunner.#instance.app = app;
        }
        
        return JobRunner.#instance;
    }
    
    /**
     * Private constructor to prevent direct instantiation
     * @param {Object} app - The application instance
     */
    constructor(app) {
        // Prevent new instantiations if instance already exists
        if (JobRunner.#instance) {
            return JobRunner.#instance;
        }
        
        this.app = app;
        this.isRunning = false;
        this.scheduledJobs = new Map(); // Map to keep track of scheduled jobs
        this.mainScheduler = null;
        this.jobQueue = []; // Queue to store jobs that need to be executed
        this.isProcessingQueue = false; // Flag to track if we're currently processing the queue
        
        // Set the instance
        JobRunner.#instance = this;
    }

    /**
     * Initialize the job runner
     * Only allows initialization once
     */
    async initialize() {
        // If already initialized, don't initialize again
        if (JobRunner.#isInitialized) {
            this.app.log.info('Job Runner already initialized, skipping re-initialization');
            return;
        }

        try {
            this.app.log.info('Initializing Job Runner service...');

            // Schedule the main job checker to run every minute
            this.mainScheduler = cron.schedule('* * * * *', async () => {
                await this.checkAndQueueScheduledJobs();
            });

            // Load all active jobs on startup
            await this.loadActiveJobs();

            // Mark as initialized
            JobRunner.#isInitialized = true;
            this.app.log.info('Job Runner service initialized successfully');
        } catch (error) {
            this.app.log.error({ err: error }, 'Failed to initialize Job Runner');
        }
    }

    /**
     * Load all active jobs from the database
     */
    async loadActiveJobs() {
        try {
            // Get all active job configs
            const activeJobs = await this.app.mongo.db.collection('jobConfigs')
                .find({ isActive: true })
                .toArray();

            this.app.log.info(`Found ${activeJobs.length} active jobs`);

            // Schedule each active job without immediately executing them
            for (const job of activeJobs) {
                // Only schedule, don't queue for immediate execution
                this.scheduleJob(job);
                
                // Check if the job is already past its scheduled time
                const now = new Date();
                if (job.schedule && job.schedule.nextRun && new Date(job.schedule.nextRun) <= now) {
                    this.app.log.info(`Job ${job._id} is past its scheduled run time, updating nextRun without executing`);
                    
                    // Update the nextRun time to the future without executing now
                    await JobConfigModel.updateNextRunTime(this.app, job._id.toString());
                }
            }
        } catch (error) {
            this.app.log.error({ err: error }, 'Error loading active jobs');
        }
    }

    /**
     * Schedule a job based on its configuration
     * @param {Object} job - The job configuration
     */
    scheduleJob(job) {
        if (!job.schedule || !job.schedule.frequency) {
            this.app.log.warn(`Job ${job._id} has invalid schedule configuration`);
            return;
        }

        // Calculate cron expression based on schedule configuration
        const cronExpression = this.calculateCronExpression(job.schedule);

        if (!cronExpression) {
            this.app.log.warn(`Invalid schedule for job ${job._id}`);
            return;
        }

        this.app.log.info(`Scheduling job ${job._id} with cron: ${cronExpression}`);

        // Schedule the job with node-cron
        // Instead of executing directly, add to queue
        const scheduledJob = cron.schedule(cronExpression, async () => {
            this.addToQueue(job._id.toString());
        });

        // Store the scheduled job reference
        this.scheduledJobs.set(job._id.toString(), scheduledJob);
    }

    /**
     * Calculate cron expression based on schedule configuration
     * @param {Object} schedule - The schedule configuration
     * @returns {String|null} - The cron expression or null if invalid
     */
    calculateCronExpression(schedule) {
        try {
            const { frequency, days, time, hourlyInterval } = schedule;

            // Extract hours and minutes from time (format: HH:mm)
            const [hours, minutes] = (time || '00:00').split(':').map(Number);

            switch (frequency) {
                case 'hourly':
                    // For hourly, run every N hours (where N is hourlyInterval)
                    // If hourlyInterval is 1, run every hour
                    // If hourlyInterval is 2, run every 2 hours, etc.
                    const interval = hourlyInterval || 1;
                    if (interval <= 0) return null;
                    
                    // Pattern: minutes, every N hours, every day, every month, any day of week
                    return `${minutes} */${interval} * * *`;
                    
                case 'daily':
                    return `${minutes} ${hours} * * *`;

                case 'weekly':
                    if (!days || !Array.isArray(days) || days.length === 0) {
                        return null;
                    }
                    // Convert days array to cron day expression (0-6, where 0 is Sunday)
                    const weekDays = days.join(',');
                    return `${minutes} ${hours} * * ${weekDays}`;

                case 'custom':
                    if (!days || !Array.isArray(days) || days.length === 0) {
                        return null;
                    }
                    // For custom schedule, treat days as days of week
                    const customDays = days.join(',');
                    return `${minutes} ${hours} * * ${customDays}`;

                default:
                    return null;
            }
        } catch (error) {
            this.app.log.error({ err: error }, 'Error calculating cron expression');
            return null;
        }
    }

    /**
     * Check for jobs that need to be run and add them to the queue
     */
    async checkAndQueueScheduledJobs() {
        if (this.isRunning) {
            return; // Prevent concurrent runs of the checker
        }

        this.isRunning = true;

        try {
            // Find jobs due for execution (jobs where nextRun is in the past)
            const now = new Date();
            const jobsToRun = await JobConfigModel.findDueForExecution(this.app);

            if (jobsToRun.length > 0) {
                this.app.log.info(`Found ${jobsToRun.length} jobs to queue`);

                // Add each job to the queue
                for (const job of jobsToRun) {
                    // Add job to queue
                    this.addToQueue(job._id.toString());
                    
                    // Update the next run time for this job
                    await JobConfigModel.updateNextRunTime(this.app, job._id.toString());
                }
            }
        } catch (error) {
            this.app.log.error({ err: error }, 'Error checking scheduled jobs');
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Add a job to the execution queue
     * @param {String} jobId - The job ID
     */
    addToQueue(jobId) {
        // Check if job is already in queue to prevent duplicates
        if (!this.jobQueue.includes(jobId)) {
            this.app.log.info(`Adding job ${jobId} to execution queue`);
            this.jobQueue.push(jobId);

            // Start processing the queue if not already processing
            if (!this.isProcessingQueue) {
                this.processQueue();
            }
        } else {
            this.app.log.debug(`Job ${jobId} is already in the queue`);
        }
    }

    /**
     * Process the job queue sequentially
     */
    async processQueue() {
        if (this.isProcessingQueue) {
            return;
        }

        this.isProcessingQueue = true;

        try {
            while (this.jobQueue.length > 0) {
                const jobId = this.jobQueue[0]; // Get the first job in the queue

                this.app.log.info(`Processing queued job ${jobId}`);

                try {
                    // Execute the job
                    await this.executeJob(jobId);
                } catch (error) {
                    this.app.log.error({ err: error }, `Error executing queued job ${jobId}`);
                }

                // Remove the job from the queue whether it succeeded or failed
                this.jobQueue.shift();
            }
        } finally {
            this.isProcessingQueue = false;
            this.app.log.info('Job queue processing completed');
        }
    }

    /**
     * Execute a job by its ID
     * @param {String} jobId - The job ID
     */
    async executeJob(jobId) {
        try {
            this.app.log.info(`Executing job ${jobId}...`);

            // Get job config
            const job = await this.app.mongo.db.collection('jobConfigs').findOne({
                _id: new this.app.mongo.ObjectId(jobId)
            });

            if (!job) {
                this.app.log.warn(`Job ${jobId} not found`);
                return;
            }

            if (!job.isActive) {
                this.app.log.warn(`Job ${jobId} is inactive`);
                return;
            }

            // Check for self-description before proceeding
            if (!job.aiTraining?.selfDescription) {
                this.app.log.error(`Job ${jobId} has no AI self-description, aborting execution`);

                // Record the aborted job run
                await this.app.mongo.db.collection('jobRuns').insertOne({
                    jobConfig: job._id,
                    user: job.user,
                    startTime: new Date(),
                    endTime: new Date(),
                    jobsFound: 0,
                    jobsApplied: 0,
                    success: false,
                    message: 'Job aborted: No AI self-description available',
                    createdAt: new Date()
                });

                return;
            }

            // Get user
            const user = await this.app.mongo.db.collection('users').findOne({
                _id: new this.app.mongo.ObjectId(job.user)
            });

            if (!user) {
                this.app.log.warn(`User for job ${jobId} is inactive or not found`);
                return;
            }

            // Process each active portal in the job config
            if (!job.portals || job.portals.length === 0) {
                this.app.log.warn(`Job ${jobId} has no portals configured`);
                return;
            }

            // Initialize browser once for all portals
            const browser = await browserInstance.getBrowser();

            try {
                // Process each active portal
                for (const portal of job.portals) {
                    if (!portal.isActive) {
                        this.app.log.info(`Skipping inactive portal: ${portal.type}`);
                        continue;
                    }

                    this.app.log.info(`Processing portal: ${portal.type}`);

                    // Get portal credentials
                    let credentials = await this.app.portalCredentialModel.getLoginCredentials(job.user, portal.type);

                    if (!credentials) {
                        this.app.log.warn(`No valid credentials found for job ${jobId}, portal: ${portal.type}`);
                        continue;
                    }

                    try {
                        // Create a portal-specific job config by combining the base job config with the portal config
                        const portalJob = {
                            ...job,
                            portal: portal.type,
                            searchConfig: portal.searchConfig,
                            filterConfig: portal.filterConfig,
                            credentials
                        };

                        switch (portal.type) {
                            case 'naukri':
                                const naukriAutomation = new NaukriJobAutomation(browser, portalJob, this.app, user, credentials);
                                await naukriAutomation.start();
                                break;
                            case 'linkedin':
                                // LinkedIn automation when implemented
                                this.app.log.info('LinkedIn automation not yet implemented');
                                break;
                            case 'indeed':
                                // Indeed automation when implemented
                                this.app.log.info('Indeed automation not yet implemented');
                                break;
                            case 'monster':
                                // Monster automation when implemented
                                this.app.log.info('Monster automation not yet implemented');
                                break;
                            default:
                                this.app.log.warn(`Unsupported portal type: ${portal.type}`);
                        }
                    } catch (error) {
                        this.app.log.error({ err: error }, `Error in portal automation for portal ${portal.type}, job ${jobId}`);
                        // Continue with the next portal
                    }
                }
            } finally {
                // Close the browser after all portals are processed
                try {
                    await browser.closeBrowser();
                } catch (error) {
                    this.app.log.error({ err: error }, `Error closing browser for job ${jobId}`);
                }
            }

            this.app.log.info(`Job ${jobId} execution completed`);
        } catch (error) {
            this.app.log.error({ err: error }, `Error executing job ${jobId}`);
        }
    }

    /**
     * Store job results in the database
     * @param {Object} job - The job configuration
     * @param {Object} result - The job execution result
     */
    async storeJobResults(job, result) {
        try {
            const now = new Date();

            // Create a job run record
            await this.app.mongo.db.collection('jobRuns').insertOne({
                jobConfig: job._id,
                user: job.user,
                portal: job.portal,
                startTime: result.startTime || now,
                endTime: result.endTime || now,
                jobsFound: result.jobsFound || 0,
                jobsApplied: result.jobsApplied || 0,
                success: result.success || false,
                message: result.message || '',
                error: result.error ? result.error.toString() : null,
                createdAt: now
            });

            this.app.log.info(`Stored results for job ${job._id}, applied to ${result.jobsApplied || 0} jobs`);
        } catch (error) {
            this.app.log.error({ err: error }, 'Error storing job results');
        }
    }

    /**
     * Stop the job runner and clear all scheduled jobs
     */
    stop() {
        this.app.log.info('Stopping Job Runner service...');

        // Stop the main scheduler
        if (this.mainScheduler) {
            this.mainScheduler.stop();
        }

        // Stop all scheduled jobs
        for (const [jobId, scheduledJob] of this.scheduledJobs.entries()) {
            scheduledJob.stop();
            this.app.log.debug(`Stopped scheduled job ${jobId}`);
        }

        // Clear the map and queue
        this.scheduledJobs.clear();
        this.jobQueue = [];
        this.isProcessingQueue = false;
        
        // Reset initialization flag to allow reinitializing if needed
        JobRunner.#isInitialized = false;

        this.app.log.info('Job Runner service stopped');
    }

    /**
     * Add a new job to the scheduler
     * @param {String} jobId - The job ID
     */
    async addJob(jobId) {
        try {
            const job = await this.app.mongo.db.collection('jobConfigs').findOne({
                _id: new this.app.mongo.ObjectId(jobId)
            });

            if (!job || !job.isActive) {
                this.app.log.warn(`Job ${jobId} not found or inactive`);
                return;
            }

            // Remove existing scheduled job if it exists
            this.removeJob(jobId);

            // Schedule the new job
            this.scheduleJob(job);

            this.app.log.info(`Added job ${jobId} to scheduler`);
        } catch (error) {
            this.app.log.error({ err: error }, `Error adding job ${jobId}`);
        }
    }

    /**
     * Remove a job from the scheduler
     * @param {String} jobId - The job ID
     */
    removeJob(jobId) {
        if (this.scheduledJobs.has(jobId)) {
            const scheduledJob = this.scheduledJobs.get(jobId);
            scheduledJob.stop();
            this.scheduledJobs.delete(jobId);

            // Also remove from queue if present
            const queueIndex = this.jobQueue.indexOf(jobId);
            if (queueIndex !== -1) {
                this.jobQueue.splice(queueIndex, 1);
            }

            this.app.log.info(`Removed job ${jobId} from scheduler and queue`);
        }
    }

    /**
     * Update a job in the scheduler
     * @param {String} jobId - The job ID
     */
    async updateJob(jobId) {
        // Simply re-add the job (which will handle removing the old one)
        await this.addJob(jobId);
    }

    /**
     * Force execution of a job immediately
     * @param {String} jobId - The job ID
     */
    async runJobNow(jobId) {
        try {
            // Add to front of queue for immediate execution
            if (!this.jobQueue.includes(jobId)) {
                this.jobQueue.unshift(jobId);
                this.app.log.info(`Added job ${jobId} to front of queue for immediate execution`);

                // Start processing if not already
                if (!this.isProcessingQueue) {
                    this.processQueue();
                }
                return { success: true, message: 'Job queued for immediate execution' };
            } else {
                return { success: false, message: 'Job is already in the queue' };
            }
        } catch (error) {
            this.app.log.error({ err: error }, `Error queuing job ${jobId} for immediate execution`);
            return { success: false, message: 'Failed to queue job', error: error.message };
        }
    }
}

// Export the class - consumers will use getInstance() to access the singleton
export default JobRunner;