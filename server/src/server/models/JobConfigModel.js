// models/JobConfig.js
import fastify from 'fastify';

/**
 * JobConfig Schema Definition for MongoDB
 * 
 * This model stores job search configurations used for automating
 * job searches and applications.
 */
export const jobConfigSchema = {
    name: { type: 'string', required: true },
    user: { type: 'string', required: true }, // Reference to user ID
    isActive: { type: 'boolean', default: true },
    portal: {
        type: 'string',
        enum: ['naukri', 'linkedin', 'indeed', 'monster'],
        default: 'naukri'
    },
    searchConfig: {
        keywords: { type: 'string', required: true },
        experience: { type: 'string', required: true },
        location: { type: 'string', required: true }
    },
    filterConfig: {
        minRating: { type: 'number', default: 3.5 },
        requiredSkills: { type: 'array', items: { type: 'string' } },
        excludeCompanies: { type: 'array', items: { type: 'string' } }
    },
    schedule: {
        frequency: {
            type: 'string',
            enum: ['daily', 'weekly', 'custom'],
            default: 'daily'
        },
        days: { type: 'array', items: { type: 'number' } }, // 0-6 for Sunday-Saturday
        time: { type: 'string' }, // HH:MM format
        lastRun: { type: 'date' },
        nextRun: { type: 'date' }
    },
    aiTraining: {
        selfDescription: { type: 'string' },
        updatedAt: { type: 'date', default: Date.now }
    },
    createdAt: { type: 'date', default: Date.now },
    updatedAt: { type: 'date', default: Date.now }
};

/**
 * Register JobConfig collection in Fastify
 * @param {FastifyInstance} app - Fastify instance
 */
export function registerJobConfigModel(app) {
    // Create indexes
    app.ready().then(() => {
        // Index for faster lookups by user
        app.mongo.db.collection('jobConfigs').createIndex({ user: 1 });

        // Index for finding configs due for execution
        app.mongo.db.collection('jobConfigs').createIndex({
            isActive: 1,
            'schedule.nextRun': 1
        });
    });
}

/**
 * JobConfig helper functions that work with Fastify's MongoDB plugin
 */
export const JobConfigModel = {
    /**
     * Create a new job config
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} userId - User ID
     * @param {Object} configData - Job config data
     * @returns {Promise<Object>} Insert result
     */
    async create(app, userId, configData) {
        const now = new Date();

        // Calculate initial nextRun date based on schedule
        const nextRun = calculateNextRun(
            configData.schedule?.frequency || 'daily',
            configData.schedule?.days || [1, 3, 5], // Mon, Wed, Fri by default
            configData.schedule?.time || '09:00'
        );

        return await app.mongo.db.collection('jobConfigs').insertOne({
            user: userId,
            name: configData.name,
            isActive: configData.isActive !== undefined ? configData.isActive : true,
            portal: configData.portal || 'naukri',
            searchConfig: {
                keywords: configData.keywords,
                experience: configData.experience,
                location: configData.location
            },
            filterConfig: {
                minRating: configData.minRating || 3.5,
                requiredSkills: configData.requiredSkills || [],
                excludeCompanies: configData.excludeCompanies || []
            },
            schedule: {
                frequency: configData.frequency || 'daily',
                days: configData.days || [1, 3, 5], // Mon, Wed, Fri by default
                time: configData.time || '09:00',
                nextRun: nextRun
            },
            createdAt: now,
            updatedAt: now
        });
    },

    /**
     * Get all job configs for a user
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of job configs
     */
    async findByUser(app, userId) {
        return await app.mongo.db.collection('jobConfigs')
            .find({ user: userId })
            .sort({ createdAt: -1 })
            .toArray();
    },

    /**
     * Find a job config by ID
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} configId - Job config ID
     * @param {string} userId - User ID (for authorization)
     * @returns {Promise<Object>} Job config
     */
    async findById(app, configId, userId) {
        return await app.mongo.db.collection('jobConfigs').findOne({
            _id: new app.mongo.ObjectId(configId),
            user: userId
        });
    },

    /**
     * Update a job config
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} configId - Job config ID
     * @param {string} userId - User ID (for authorization)
     * @param {Object} updateData - Fields to update
     * @returns {Promise<Object>} Update result
     */
    async update(app, configId, userId, updateData) {
        const config = await this.findById(app, configId, userId);
        if (!config) {
            throw new Error('Job config not found or not authorized');
        }

        const updates = { updatedAt: new Date() };

        // Update basic fields if provided
        if (updateData.name !== undefined) updates.name = updateData.name;
        if (updateData.isActive !== undefined) updates.isActive = updateData.isActive;
        if (updateData.portal !== undefined) updates.portal = updateData.portal;

        // Update search config if provided
        if (updateData.keywords !== undefined) updates['searchConfig.keywords'] = updateData.keywords;
        if (updateData.experience !== undefined) updates['searchConfig.experience'] = updateData.experience;
        if (updateData.location !== undefined) updates['searchConfig.location'] = updateData.location;

        // Update filter config if provided
        if (updateData.minRating !== undefined) updates['filterConfig.minRating'] = updateData.minRating;
        if (updateData.requiredSkills !== undefined) updates['filterConfig.requiredSkills'] = updateData.requiredSkills;
        if (updateData.excludeCompanies !== undefined) updates['filterConfig.excludeCompanies'] = updateData.excludeCompanies;

        // Update schedule if provided
        if (updateData.frequency !== undefined) updates['schedule.frequency'] = updateData.frequency;
        if (updateData.days !== undefined) updates['schedule.days'] = updateData.days;
        if (updateData.time !== undefined) updates['schedule.time'] = updateData.time;

        // If schedule was updated, recalculate next run
        if (updateData.frequency !== undefined || updateData.days !== undefined || updateData.time !== undefined) {
            updates['schedule.nextRun'] = calculateNextRun(
                updateData.frequency || config.schedule.frequency,
                updateData.days || config.schedule.days,
                updateData.time || config.schedule.time
            );
        }

        if (updateData.aiTraining.selfDescription !== undefined) {
            updates['aiTraining.selfDescription'] = updateData.aiTraining.selfDescription;
            updates['aiTraining.updatedAt'] = new Date();
        }

        return await app.mongo.db.collection('jobConfigs').updateOne(
            { _id: new app.mongo.ObjectId(configId), user: userId },
            { $set: updates }
        );
    },

    /**
     * Delete a job config
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} configId - Job config ID
     * @param {string} userId - User ID (for authorization)
     * @returns {Promise<Object>} Delete result
     */
    async delete(app, configId, userId) {
        return await app.mongo.db.collection('jobConfigs').deleteOne({
            _id: new app.mongo.ObjectId(configId),
            user: userId
        });
    },

    /**
     * Find configs due for execution
     * @param {FastifyInstance} app - Fastify instance
     * @returns {Promise<Array>} Configs due for execution
     */
    async findDueForExecution(app) {
        const now = new Date();

        return await app.mongo.db.collection('jobConfigs')
            .find({
                isActive: true,
                'schedule.nextRun': { $lte: now }
            })
            .toArray();
    },

    /**
     * Update next run time for a config
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} configId - Job config ID
     * @returns {Promise<Object>} Update result
     */
    async updateNextRunTime(app, configId) {
        const config = await app.mongo.db.collection('jobConfigs').findOne({
            _id: new app.mongo.ObjectId(configId)
        });

        if (!config) {
            throw new Error('Job config not found');
        }

        // Calculate next run based on current schedule
        const nextRun = calculateNextRun(
            config.schedule.frequency,
            config.schedule.days,
            config.schedule.time
        );

        return await app.mongo.db.collection('jobConfigs').updateOne(
            { _id: new app.mongo.ObjectId(configId) },
            {
                $set: {
                    'schedule.lastRun': new Date(),
                    'schedule.nextRun': nextRun,
                    updatedAt: new Date()
                }
            }
        );
    }
};

/**
 * Helper function to calculate next run time based on schedule
 * @param {string} frequency - Schedule frequency (daily, weekly, custom)
 * @param {Array<number>} days - Days of week (0-6 for Sunday-Saturday)
 * @param {string} time - Time in 24-hour format (HH:MM)
 * @returns {Date} Next run date
 */
function calculateNextRun(frequency, days, time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    // Start with tomorrow at the specified time
    let nextRun = new Date(now);
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(hours, minutes, 0, 0);

    if (frequency === 'daily') {
        // For daily, we already set it to tomorrow
        return nextRun;
    }

    if (frequency === 'weekly' && days && days.length > 0) {
        // For weekly, find the next day that matches our schedule
        const currentDay = now.getDay(); // 0-6, Sunday-Saturday

        // Sort days to ensure proper order
        const sortedDays = [...days].sort((a, b) => a - b);

        // Find the next scheduled day
        let found = false;
        for (let i = 1; i <= 7; i++) {
            const checkDay = (currentDay + i) % 7;
            if (sortedDays.includes(checkDay)) {
                // Set the date to this next day
                nextRun = new Date(now);
                nextRun.setDate(now.getDate() + i);
                nextRun.setHours(hours, minutes, 0, 0);
                found = true;
                break;
            }
        }

        // If no day was found (shouldn't happen with valid config)
        if (!found) {
            // Default to 1 week from now
            nextRun.setDate(now.getDate() + 7);
        }
    }

    return nextRun;
}

export default JobConfigModel;