
/**
 * JobConfig Schema Definition for MongoDB
 * 
 * This model stores job search configurations used for automating
 * job searches and applications across multiple portals for a user.
 */
export const jobConfigSchema = {
    user: { type: 'string', required: true }, 
    isActive: { type: 'boolean', default: true },
    portals: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                type: { 
                    type: 'string',
                    enum: ['naukri', 'linkedin', 'indeed', 'monster'],
                    default: 'naukri'
                },
                isActive: { type: 'boolean', default: true },
                searchConfig: {
                    keywords: { type: 'string', required: true },
                    experience: { type: 'string', required: true },
                    location: { type: 'string', required: true }
                },
                filterConfig: {
                    minRating: { type: 'number', default: 3.5 },
                    requiredSkills: { type: 'array', items: { type: 'string' } },
                    excludeCompanies: { type: 'array', items: { type: 'string' } },
                    maxApplications: { type: 'number', default: 10 }
                }
            }
        }
    },
    schedule: {
        frequency: {
            type: 'string',
            enum: ['hourly', 'daily', 'weekly', 'custom'],
            default: 'daily'
        },
        hourlyInterval: { type: 'number', default: 1 }, // For hourly frequency
        days: { type: 'array', items: { type: 'number' } }, // 0-6 for Sunday-Saturday
        time: { type: 'string' }, // HH:MM format
        lastRun: { type: 'date' },
        nextRun: { type: 'date' }
    },
    aiTraining: {
        selfDescription: { type: 'string' },
        updatedAt: { type: 'date', default: Date.now }
    },
    notifications: {
        email: { type: 'boolean', default: true },
        whatsapp: { type: 'boolean', default: false },
        notifyAbout: {
            applications: { type: 'boolean', default: true },
            interviews: { type: 'boolean', default: true },
            errors: { type: 'boolean', default: true }
        }
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
     * Create a new job config or update if exists
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} userId - User ID
     * @param {Object} configData - Job config data
     * @returns {Promise<Object>} Insert or update result
     */
    async createOrUpdate(app, userId, configData) {
        const now = new Date();

        // Calculate initial nextRun date based on schedule
        const nextRun = calculateNextRun(
            configData.frequency || 'daily',
            configData.days || [1, 3, 5], // Mon, Wed, Fri by default
            configData.time || '09:00',
            configData.hourlyInterval || 1
        );

        // Check if user already has a job config
        const existingConfig = await app.mongo.db.collection('jobConfigs').findOne({ user: userId });

        if (existingConfig) {
            // Update existing config
            return await this.update(app, existingConfig._id, userId, configData);
        } else {
            // Create new config
            const portalConfig = {
                type: configData.portal || 'naukri',
                isActive: true,
                searchConfig: {
                    keywords: configData.keywords || '',
                    experience: configData.experience || '',
                    location: configData.location || ''
                },
                filterConfig: {
                    minRating: configData.minRating || 3.5,
                    requiredSkills: configData.requiredSkills || [],
                    excludeCompanies: configData.excludeCompanies || [],
                    maxApplications: configData.maxApplications || 10
                }
            };

            return await app.mongo.db.collection('jobConfigs').insertOne({
                user: userId,
                isActive: configData.isActive !== undefined ? configData.isActive : true,
                portals: [portalConfig],
                schedule: {
                    frequency: configData.frequency || 'daily',
                    hourlyInterval: configData.hourlyInterval || 1,
                    days: configData.days || [1, 3, 5], // Mon, Wed, Fri by default
                    time: configData.time || '09:00',
                    nextRun: nextRun
                },
                aiTraining: {
                    selfDescription: configData.selfDescription || '',
                    updatedAt: now
                },
                notifications: {
                    email: configData.emailNotifications !== undefined ? configData.emailNotifications : true,
                    whatsapp: configData.whatsappNotifications || false,
                    notifyAbout: {
                        applications: true,
                        interviews: true,
                        errors: true
                    }
                },
                createdAt: now,
                updatedAt: now
            });
        }
    },

    /**
     * Get job config for a user
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Job config if exists
     */
    async findByUser(app, userId) {
        return await app.mongo.db.collection('jobConfigs').findOne({ user: userId });
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
        if (updateData.isActive !== undefined) updates.isActive = updateData.isActive;

        // Process portal updates
        if (updateData.portal) {
            // Find if portal already exists in config
            const portalIndex = config.portals.findIndex(p => p.type === updateData.portal);
            
            if (portalIndex >= 0) {
                // Update existing portal
                if (updateData.keywords) updates[`portals.${portalIndex}.searchConfig.keywords`] = updateData.keywords;
                if (updateData.experience) updates[`portals.${portalIndex}.searchConfig.experience`] = updateData.experience;
                if (updateData.location) updates[`portals.${portalIndex}.searchConfig.location`] = updateData.location;
                if (updateData.minRating) updates[`portals.${portalIndex}.filterConfig.minRating`] = updateData.minRating;
                if (updateData.maxApplications) updates[`portals.${portalIndex}.filterConfig.maxApplications`] = updateData.maxApplications;
            } else {
                // Add new portal
                const newPortal = {
                    type: updateData.portal,
                    isActive: true,
                    searchConfig: {
                        keywords: updateData.keywords || '',
                        experience: updateData.experience || '',
                        location: updateData.location || ''
                    },
                    filterConfig: {
                        minRating: updateData.minRating || 3.5,
                        requiredSkills: updateData.requiredSkills || [],
                        excludeCompanies: updateData.excludeCompanies || [],
                        maxApplications: updateData.maxApplications || 10
                    }
                };
                
                // Use $push to add new portal to array
                await app.mongo.db.collection('jobConfigs').updateOne(
                    { _id: new app.mongo.ObjectId(configId) },
                    { $push: { portals: newPortal } }
                );
            }
        }

        // Update schedule if provided
        if (updateData.frequency) updates['schedule.frequency'] = updateData.frequency;
        if (updateData.hourlyInterval) updates['schedule.hourlyInterval'] = updateData.hourlyInterval;
        if (updateData.days) updates['schedule.days'] = updateData.days;
        if (updateData.time) updates['schedule.time'] = updateData.time;

        // Update notification settings if provided
        if (updateData.emailNotifications !== undefined) updates['notifications.email'] = updateData.emailNotifications;
        if (updateData.whatsappNotifications !== undefined) updates['notifications.whatsapp'] = updateData.whatsappNotifications;

        // Update AI training if provided
        if (updateData.selfDescription) {
            updates['aiTraining.selfDescription'] = updateData.selfDescription;
            updates['aiTraining.updatedAt'] = new Date();
        }

        // If schedule was updated, recalculate next run
        if (updateData.frequency || updateData.days || updateData.time || updateData.hourlyInterval) {
            updates['schedule.nextRun'] = calculateNextRun(
                updateData.frequency || config.schedule.frequency,
                updateData.days || config.schedule.days,
                updateData.time || config.schedule.time,
                updateData.hourlyInterval || config.schedule.hourlyInterval
            );
        }

        // Apply updates if there are any fields to update
        if (Object.keys(updates).length > 1) { // More than just updatedAt
            return await app.mongo.db.collection('jobConfigs').updateOne(
                { _id: new app.mongo.ObjectId(configId), user: userId },
                { $set: updates }
            );
        }
        
        return { modifiedCount: 0 };
    },

    /**
     * Add or update portal config within a job config
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} configId - Job config ID
     * @param {string} userId - User ID
     * @param {string} portalType - Portal type
     * @param {Object} portalData - Portal config data
     * @returns {Promise<Object>} Update result
     */
    async updatePortalConfig(app, configId, userId, portalType, portalData) {
        const config = await this.findById(app, configId, userId);
        if (!config) {
            throw new Error('Job config not found or not authorized');
        }

        // Find if portal already exists
        const portalIndex = config.portals.findIndex(p => p.type === portalType);
        
        if (portalIndex >= 0) {
            // Update existing portal
            const updates = {};
            
            // Build dynamic field updates
            Object.entries(portalData).forEach(([key, value]) => {
                if (key === 'searchConfig' || key === 'filterConfig') {
                    Object.entries(value).forEach(([subKey, subValue]) => {
                        updates[`portals.${portalIndex}.${key}.${subKey}`] = subValue;
                    });
                } else if (key !== 'type') { // Don't change the portal type
                    updates[`portals.${portalIndex}.${key}`] = value;
                }
            });
            
            if (Object.keys(updates).length > 0) {
                updates.updatedAt = new Date();
                
                return await app.mongo.db.collection('jobConfigs').updateOne(
                    { _id: new app.mongo.ObjectId(configId), user: userId },
                    { $set: updates }
                );
            }
            
            return { modifiedCount: 0 };
        } else {
            // Add new portal
            const newPortal = {
                type: portalType,
                isActive: portalData.isActive !== undefined ? portalData.isActive : true,
                searchConfig: portalData.searchConfig || {
                    keywords: '',
                    experience: '',
                    location: ''
                },
                filterConfig: portalData.filterConfig || {
                    minRating: 3.5,
                    requiredSkills: [],
                    excludeCompanies: [],
                    maxApplications: 10
                }
            };
            
            return await app.mongo.db.collection('jobConfigs').updateOne(
                { _id: new app.mongo.ObjectId(configId), user: userId },
                { 
                    $push: { portals: newPortal },
                    $set: { updatedAt: new Date() }
                }
            );
        }
    },

    /**
     * Delete a portal from a job config
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} configId - Job config ID
     * @param {string} userId - User ID
     * @param {string} portalType - Portal type to remove
     * @returns {Promise<Object>} Update result
     */
    async deletePortal(app, configId, userId, portalType) {
        return await app.mongo.db.collection('jobConfigs').updateOne(
            { _id: new app.mongo.ObjectId(configId), user: userId },
            { 
                $pull: { portals: { type: portalType } },
                $set: { updatedAt: new Date() }
            }
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
            config.schedule.time,
            config.schedule.hourlyInterval
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
 * @param {string} frequency - Schedule frequency (hourly, daily, weekly, custom)
 * @param {Array<number>} days - Days of week (0-6 for Sunday-Saturday)
 * @param {string} time - Time in 24-hour format (HH:MM)
 * @param {number} hourlyInterval - Hours between runs for hourly frequency
 * @returns {Date} Next run date
 */
function calculateNextRun(frequency, days, time, hourlyInterval) {
    const now = new Date();
    
    if (frequency === 'hourly') {
        // For hourly, add the interval to the current time
        const nextRun = new Date(now);
        nextRun.setHours(now.getHours() + (hourlyInterval || 1));
        return nextRun;
    }
    
    // For other frequencies, parse the time
    const [hours, minutes] = time.split(':').map(Number);

    // Start with today at the specified time
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    // If that time is already past, start with tomorrow
    if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
    }

    if (frequency === 'daily') {
        // For daily, we're already set
        return nextRun;
    }

    if ((frequency === 'weekly' || frequency === 'custom') && days && days.length > 0) {
        // For weekly or custom, find the next day that matches our schedule
        const currentDay = now.getDay(); // 0-6, Sunday-Saturday

        // Find the next scheduled day
        let daysUntilNext = 7; // Maximum days to look ahead
        
        for (const day of days) {
            const daysUntil = (day - currentDay + 7) % 7;
            // Only consider future days or today if the time hasn't passed
            if (daysUntil < daysUntilNext && (daysUntil > 0 || (daysUntil === 0 && nextRun > now))) {
                daysUntilNext = daysUntil;
            }
        }
        
        // If we found a valid next day
        if (daysUntilNext < 7) {
            nextRun = new Date(now);
            nextRun.setDate(now.getDate() + daysUntilNext);
            nextRun.setHours(hours, minutes, 0, 0);
        }
    }

    return nextRun;
}

export default JobConfigModel;