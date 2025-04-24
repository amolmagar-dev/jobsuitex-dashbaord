// routes/jobConfigRoutes.js
import logger from '../../utils/logger.js';

/**
 * Job config-related route definitions
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 * @param {Function} done - Callback to signal completion
 */
export default async function jobConfigRoutes(fastify, options) {
    // Get user's job config
    fastify.get('/job-config', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const config = await fastify.jobConfigModel.findByUser(userId);

            if (!config) {
                return {
                    success: true,
                    config: null
                };
            }

            // Transform _id to id for frontend consistency
            const transformedConfig = {
                id: config._id,
                isActive: config.isActive,
                portals: config.portals,
                schedule: config.schedule,
                aiTraining: config.aiTraining,
                notifications: config.notifications,
                createdAt: config.createdAt,
                updatedAt: config.updatedAt
            };

            return {
                success: true,
                config: transformedConfig
            };
        } catch (error) {
            logger.error(`Error fetching job config: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Create or update user's job config
    fastify.post('/job-config', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const configData = request.body;

            // Create or update job config
            const result = await fastify.jobConfigModel.createOrUpdate(userId, configData);

            return {
                success: true,
                message: 'Job configuration saved successfully',
                config: {
                    id: result.upsertedId || configData.id,
                    ...configData
                }
            };
        } catch (error) {
            logger.error(`Error saving job config: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Update a specific portal in the job config
    fastify.put('/job-config/portals/:portalType', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { portalType } = request.params;
            const portalData = request.body;

            // Get existing config or create new
            let config = await fastify.jobConfigModel.findByUser(userId);
            let configId;

            if (!config) {
                // Create empty config if it doesn't exist
                const result = await fastify.jobConfigModel.createOrUpdate(userId, {
                    isActive: true,
                    portals: [],
                    schedule: {
                        frequency: 'daily',
                        days: [1, 2, 3, 4, 5],
                        time: '09:00'
                    }
                });
                configId = result.insertedId;
            } else {
                configId = config._id;
            }

            // Update portal config
            await fastify.jobConfigModel.updatePortalConfig(configId, userId, portalType, portalData);

            // Get updated config
            config = await fastify.jobConfigModel.findByUser(userId);

            return {
                success: true,
                message: `Portal configuration for ${portalType} updated successfully`,
                config: {
                    id: config._id,
                    isActive: config.isActive,
                    portals: config.portals,
                    schedule: config.schedule,
                    aiTraining: config.aiTraining,
                    notifications: config.notifications
                }
            };
        } catch (error) {
            logger.error(`Error updating portal config: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Delete a portal from job config
    fastify.delete('/job-config/portals/:portalType', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { portalType } = request.params;

            // Get existing config
            const config = await fastify.jobConfigModel.findByUser(userId);

            if (!config) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found'
                });
            }

            // Delete portal
            await fastify.jobConfigModel.deletePortal(config._id, userId, portalType);

            return {
                success: true,
                message: `Portal ${portalType} removed from job configuration`
            };
        } catch (error) {
            logger.error(`Error deleting portal: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Toggle job config active status
    fastify.patch('/job-config/toggle', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;

            // Get existing config
            const config = await fastify.jobConfigModel.findByUser(userId);

            if (!config) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found'
                });
            }

            // Toggle the active status
            await fastify.jobConfigModel.update(config._id, userId, {
                isActive: !config.isActive
            });

            return {
                success: true,
                message: `Job configuration ${!config.isActive ? 'activated' : 'deactivated'} successfully`,
                isActive: !config.isActive
            };
        } catch (error) {
            logger.error(`Error toggling job config: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Update schedule
    fastify.put('/job-config/schedule', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const scheduleData = request.body;

            // Get existing config
            const config = await fastify.jobConfigModel.findByUser(userId);

            if (!config) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found'
                });
            }

            // Update schedule
            await fastify.jobConfigModel.update(config._id, userId, scheduleData);

            return {
                success: true,
                message: 'Schedule updated successfully'
            };
        } catch (error) {
            logger.error(`Error updating schedule: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Update AI training data
    fastify.put('/job-config/ai-training', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const trainingData = request.body;

            // Validate required fields
            if (!trainingData.selfDescription) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    message: 'Self description is required for AI training'
                });
            }

            // Get existing config
            const config = await fastify.jobConfigModel.findByUser(userId);

            if (!config) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found'
                });
            }

            // Update the AI training data
            await fastify.jobConfigModel.update(config._id, userId, {
                selfDescription: trainingData.selfDescription
            });

            return {
                success: true,
                message: 'AI training data updated successfully'
            };
        } catch (error) {
            logger.error(`Error updating AI training data: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Update notifications settings
    fastify.put('/job-config/notifications', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const notificationsData = request.body;

            // Get existing config
            const config = await fastify.jobConfigModel.findByUser(userId);

            if (!config) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found'
                });
            }

            // Build updates object
            const updates = {};
            if (notificationsData.email !== undefined) updates['notifications.email'] = notificationsData.email;
            if (notificationsData.whatsapp !== undefined) updates['notifications.whatsapp'] = notificationsData.whatsapp;
            
            if (notificationsData.notifyAbout) {
                if (notificationsData.notifyAbout.applications !== undefined) {
                    updates['notifications.notifyAbout.applications'] = notificationsData.notifyAbout.applications;
                }
                if (notificationsData.notifyAbout.interviews !== undefined) {
                    updates['notifications.notifyAbout.interviews'] = notificationsData.notifyAbout.interviews;
                }
                if (notificationsData.notifyAbout.errors !== undefined) {
                    updates['notifications.notifyAbout.errors'] = notificationsData.notifyAbout.errors;
                }
            }

            // Apply updates
            await fastify.mongo.db.collection('jobConfigs').updateOne(
                { _id: config._id },
                { $set: { ...updates, updatedAt: new Date() } }
            );

            return {
                success: true,
                message: 'Notification settings updated successfully'
            };
        } catch (error) {
            logger.error(`Error updating notification settings: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Run job config immediately
    fastify.post('/job-config/run', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { portalType } = request.body; // Optional - specific portal to run

            // Get existing config
            const config = await fastify.jobConfigModel.findByUser(userId);

            if (!config) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found'
                });
            }

            // Here you would trigger the job to run immediately
            // This would connect to your job scheduler or queue
            
            let message = 'Job execution triggered successfully';
            if (portalType) {
                // Check if portal exists in config
                const portalExists = config.portals.some(p => p.type === portalType);
                if (!portalExists) {
                    return reply.code(400).send({
                        error: 'Invalid Portal',
                        message: `Portal ${portalType} is not configured`
                    });
                }
                message = `Job execution for ${portalType} triggered successfully`;
            }

            logger.info(`Manual execution triggered for job config ${config._id} ${portalType ? `(portal: ${portalType})` : ''}`);

            return {
                success: true,
                message,
                scheduledTime: new Date()
            };
        } catch (error) {
            logger.error(`Error running job config: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Analyze user profile from portal
    fastify.post('/job-config/analyze-profile', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { portal } = request.body;

            if (!portal) {
                return reply.code(400).send({
                    error: 'Missing Parameter',
                    message: 'Portal type is required'
                });
            }

            // Get existing config
            const config = await fastify.jobConfigModel.findByUser(userId);

            // Get portal credentials
            const credential = await fastify.portalCredentialModel.getLoginCredentials(userId, portal);

            if (!credential) {
                return reply.code(400).send({
                    error: 'Missing Credentials',
                    message: 'Portal credentials are required to analyze your profile'
                });
            }

            // Generate profile from resume
            const { generateProfileFromNaukriResume } = await import('../services/analyzeProfileService.js');
            const generatedDescription = await generateProfileFromNaukriResume(credential);

            // Update the AI training data with the generated description
            const aiTrainingData = {
                selfDescription: generatedDescription,
            };

            // Update config if it exists, or create new one
            if (config) {
                await fastify.jobConfigModel.update(config._id, userId, aiTrainingData);
            } else {
                await fastify.jobConfigModel.createOrUpdate(userId, {
                    ...aiTrainingData,
                    isActive: true
                });
            }

            return {
                success: true,
                message: 'Profile analyzed successfully',
                profileDescription: generatedDescription
            };
        } catch (error) {
            logger.error(`Error analyzing profile: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });
  }