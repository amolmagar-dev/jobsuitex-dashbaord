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
            
            // Get the job ID (either the upserted ID or the existing ID)
            const jobId = result.upsertedId || (configData.id ? configData.id : null);
            
            if (jobId) {
                // Notify the job runner to update the job schedule
                if (configData.isActive) {
                    await fastify.jobRunner.updateJob(jobId.toString());
                } else {
                    // If job is not active, remove it from the scheduler
                    fastify.jobRunner.removeJob(jobId.toString());
                }
            }

            return {
                success: true,
                message: 'Job configuration saved successfully',
                config: {
                    id: jobId,
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
                
                // Schedule the new job if it's active
                if (configId) {
                    await fastify.jobRunner.updateJob(configId.toString());
                }
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

      // Get the job ID as string
      const jobId = config._id.toString();
      
      // Toggle the active status
      const newActiveStatus = !config.isActive;
      
      // Update database first
      await fastify.jobConfigModel.update(config._id, userId, {
          isActive: newActiveStatus
      });
      
      // Log what we're about to do
      fastify.log.info(`Job ${jobId} toggled to ${newActiveStatus ? 'active' : 'inactive'}`);
      
      // Update job runner based on new status
      if (fastify.jobRunner) {
          try {
              if (newActiveStatus) {
                  // If activating, add the job to the scheduler
                  fastify.log.info(`Adding job ${jobId} to scheduler`);
                  await fastify.jobRunner.addJob(jobId);
              } else {
                  // If deactivating, remove the job from the scheduler
                  fastify.log.info(`Removing job ${jobId} from scheduler`);
                  fastify.jobRunner.removeJob(jobId);
              }
          } catch (runnerError) {
              // Log but don't fail the entire operation
              fastify.log.error({ err: runnerError }, `Job runner error while toggling job ${jobId}`);
          }
      } else {
          fastify.log.warn(`JobRunner not available, can't update scheduler for job ${jobId}`);
      }

      return {
          success: true,
          message: `Job configuration ${newActiveStatus ? 'activated' : 'deactivated'} successfully`,
          isActive: newActiveStatus
      };
  } catch (error) {
      fastify.log.error({ err: error }, 'Error toggling job config');
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
            
            // Update the job runner with the new schedule if the config is active
            if (config.isActive) {
                await fastify.jobRunner.updateJob(config._id.toString());
            }

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

            if (!config.isActive) {
                return reply.code(400).send({
                    error: 'Inactive Configuration',
                    message: 'Job configuration is inactive. Please activate it first.'
                });
            }

            // Check if portal exists in config if specified
            if (portalType) {
                const portalExists = config.portals.some(p => p.type === portalType && p.isActive);
                if (!portalExists) {
                    return reply.code(400).send({
                        error: 'Invalid Portal',
                        message: `Portal ${portalType} is not configured or inactive`
                    });
                }
            }

            // Trigger immediate execution using jobRunner
            const result = await fastify.jobRunner.runJobNow(config._id.toString());
            
            if (!result.success) {
                return reply.code(500).send({
                    error: 'Execution Error',
                    message: result.message
                });
            }

            logger.info(`Manual execution triggered for job config ${config._id} ${portalType ? `(portal: ${portalType})` : ''}`);

            return {
                success: true,
                message: portalType 
                    ? `Job execution for ${portalType} triggered successfully`
                    : 'Job execution triggered successfully',
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