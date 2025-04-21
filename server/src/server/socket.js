/**
 * Socket.io event handlers for browser streaming
 */
import logger from '../utils/logger.js';
import browserInstance from '../browser/browser.js';
import { startNaukriAutomation, getActivePage, getActiveJobId } from '../scraper/naukri/index.js';

/**
 * Setup Socket.io event handlers
 * @param {SocketIO.Server} io - Socket.io server instance
 */
export default function setupSocketHandlers(io) {
    // Namespace for browser streaming
    const streamNamespace = io.of('/browser-stream');

    // Track active automation jobs
    const activeJobs = new Map();

    streamNamespace.on('connection', (socket) => {
        const sessionId = socket.id;
        logger.info(`New streaming client connected: ${sessionId}`);

        // Handle client requesting to start streaming
        socket.on('start-stream', async (data) => {
            try {
                const { jobId = `job_${Date.now()}`, platform = 'naukri' } = data || {};
                logger.info(`Client ${sessionId} requested to start streaming job ${jobId || 'unknown'}`);

                // Update client with status
                socket.emit('status', {
                    status: 'initializing',
                    message: `Starting ${platform} automation`,
                    jobId,
                    platform
                });

                // Store job references for cleanup
                socket.data.jobId = jobId;
                socket.data.platform = platform;

                // Check if we need to start a new automation or connect to existing one
                let activePage = getActivePage();

                if (!activePage) {
                    // No active automation, start a new one in a separate process
                    logger.info(`Starting new ${platform} automation for job ${jobId}`);

                    // Start the automation in a non-blocking way
                    startNaukriAutomation(jobId).catch(err => {
                        logger.error(`Error in automation job ${jobId}:`, err);
                        socket.emit('status', {
                            status: 'error',
                            message: `Automation error: ${err.message}`,
                            jobId
                        });
                    });

                    // Wait for the automation to create a page
                    for (let i = 0; i < 10; i++) {
                        activePage = getActivePage();
                        if (activePage) break;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    if (!activePage) {
                        throw new Error('Timed out waiting for automation to start');
                    }

                    // Track this job
                    activeJobs.set(jobId, {
                        startTime: Date.now(),
                        platform,
                        sessionIds: new Set([sessionId])
                    });
                } else {
                    // Connect to existing automation
                    const existingJobId = getActiveJobId();
                    logger.info(`Connecting to existing ${platform} automation job ${existingJobId}`);

                    // Update the client with the existing job ID
                    socket.emit('status', {
                        status: 'connecting',
                        message: `Connecting to existing ${platform} automation`,
                        jobId: existingJobId,
                        platform
                    });

                    socket.data.jobId = existingJobId;

                    // Add this session to the existing job
                    if (activeJobs.has(existingJobId)) {
                        activeJobs.get(existingJobId).sessionIds.add(sessionId);
                    } else {
                        activeJobs.set(existingJobId, {
                            startTime: Date.now(),
                            platform,
                            sessionIds: new Set([sessionId])
                        });
                    }
                }

                // Start streaming the page
                await browserInstance.startStreaming(
                    sessionId,
                    activePage,
                    (frameData) => {
                        // Emit frame data to the client
                        socket.emit('stream-frame', {
                            ...frameData,
                            jobId: socket.data.jobId
                        });
                    },
                    {
                        frameRate: 25,
                        quality: 80,
                        maxWidth: 1280,
                        maxHeight: 720
                    }
                );

                // Emit status update
                socket.emit('status', {
                    status: 'streaming',
                    message: `Started streaming ${platform} automation`,
                    jobId: socket.data.jobId,
                    platform
                });
            } catch (error) {
                logger.error(`Error starting stream for ${sessionId}:`, error);
                socket.emit('status', {
                    status: 'error',
                    message: `Failed to start streaming: ${error.message}`
                });
            }
        });

        // Handle client requesting to stop streaming
        socket.on('stop-stream', async () => {
            const jobId = socket.data?.jobId || 'unknown';
            logger.info(`Client ${sessionId} requested to stop streaming job ${jobId}`);

            // Stop the streaming session
            browserInstance.stopStreaming(sessionId);

            // Remove this session from the job
            if (activeJobs.has(jobId)) {
                const job = activeJobs.get(jobId);
                job.sessionIds.delete(sessionId);

                // If no more sessions are watching this job, we could potentially
                // stop the automation, but for now we'll let it continue running
                if (job.sessionIds.size === 0) {
                    logger.info(`No more viewers for job ${jobId}, but keeping automation running`);
                }
            }

            socket.emit('status', {
                status: 'stopped',
                message: 'Streaming stopped (automation continues in background)',
                jobId
            });
        });

        // Handle client disconnection
        socket.on('disconnect', () => {
            logger.info(`Streaming client disconnected: ${sessionId}`);

            // Stop any active streaming
            browserInstance.stopStreaming(sessionId);

            // Remove this session from any jobs it was watching
            const jobId = socket.data?.jobId;
            if (jobId && activeJobs.has(jobId)) {
                const job = activeJobs.get(jobId);
                job.sessionIds.delete(sessionId);

                if (job.sessionIds.size === 0) {
                    logger.info(`No more viewers for job ${jobId}, but keeping automation running`);
                }
            }
        });
    });

    // Return the io instance
    return io;
}