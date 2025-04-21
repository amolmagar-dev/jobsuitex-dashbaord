// routes/jobConfigRoutes.js
import logger from '../../utils/logger.js';

/**
 * Job config-related route definitions
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 * @param {Function} done - Callback to signal completion
 */
export default async function jobConfigRoutes(fastify, options) {
    // Create a new job config
    fastify.post('/job-config', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const configData = request.body;

            // Validate required fields
            if (!configData.name || !configData.keywords || !configData.experience || !configData.location) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    message: 'Required fields missing: name, keywords, experience, location'
                });
            }

            const result = await fastify.jobConfigModel.create(userId, configData);

            return {
                success: true,
                message: 'Job configuration created successfully',
                config: {
                    id: result.insertedId,
                    ...configData
                }
            };
        } catch (error) {
            logger.error(`Error creating job config: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Get all job configs for a user
    fastify.get('/job-config', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;

            const configs = await fastify.jobConfigModel.findByUser(userId);

            // Transform _id to id for frontend consistency
            const transformedConfigs = configs.map(config => ({
                id: config._id,
                name: config.name,
                isActive: config.isActive,
                portal: config.portal,
                searchConfig: config.searchConfig,
                filterConfig: config.filterConfig,
                schedule: config.schedule,
                aiTraining: config.aiTraining,
                createdAt: config.createdAt,
                updatedAt: config.updatedAt
            }));

            return {
                success: true,
                configs: transformedConfigs
            };
        } catch (error) {
            logger.error(`Error fetching job configs: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Get a specific job config
    fastify.get('/job-config/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const configId = request.params.id;

            const config = await fastify.jobConfigModel.findById(configId, userId);

            if (!config) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found or you do not have access'
                });
            }

            // Transform _id to id for frontend consistency
            const transformedConfig = {
                id: config._id,
                name: config.name,
                isActive: config.isActive,
                portal: config.portal,
                searchConfig: config.searchConfig,
                filterConfig: config.filterConfig,
                schedule: config.schedule,
                aiTraining: config.aiTraining,
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

    // Update a job config
    fastify.put('/job-config/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const configId = request.params.id;
            const updateData = request.body;

            // Check if the job config exists and belongs to the user
            const existingConfig = await fastify.jobConfigModel.findById(configId, userId);

            if (!existingConfig) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found or you do not have access'
                });
            }

            await fastify.jobConfigModel.update(configId, userId, updateData);

            // Get the updated config
            const updatedConfig = await fastify.jobConfigModel.findById(configId, userId);

            // Transform _id to id for frontend consistency
            const transformedConfig = {
                id: updatedConfig._id,
                name: updatedConfig.name,
                isActive: updatedConfig.isActive,
                portal: updatedConfig.portal,
                searchConfig: updatedConfig.searchConfig,
                filterConfig: updatedConfig.filterConfig,
                schedule: updatedConfig.schedule,
                aiTraining: updatedConfig.aiTraining,
                createdAt: updatedConfig.createdAt,
                updatedAt: updatedConfig.updatedAt
            };

            return {
                success: true,
                message: 'Job configuration updated successfully',
                config: transformedConfig
            };
        } catch (error) {
            logger.error(`Error updating job config: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Toggle job config active status
    fastify.patch('/job-config/:id/toggle', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const configId = request.params.id;

            // Check if the job config exists and belongs to the user
            const existingConfig = await fastify.jobConfigModel.findById(configId, userId);

            if (!existingConfig) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found or you do not have access'
                });
            }

            // Toggle the active status
            await fastify.jobConfigModel.update(configId, userId, {
                isActive: !existingConfig.isActive
            });

            return {
                success: true,
                message: `Job configuration ${!existingConfig.isActive ? 'activated' : 'deactivated'} successfully`,
                isActive: !existingConfig.isActive
            };
        } catch (error) {
            logger.error(`Error toggling job config: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Delete a job config
    fastify.delete('/job-config/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const configId = request.params.id;

            // Check if the job config exists and belongs to the user
            const existingConfig = await fastify.jobConfigModel.findById(configId, userId);

            if (!existingConfig) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found or you do not have access'
                });
            }

            const result = await fastify.jobConfigModel.delete(configId, userId);

            if (result.deletedCount === 0) {
                return reply.code(404).send({
                    error: 'Delete Failed',
                    message: 'Job configuration could not be deleted'
                });
            }

            return {
                success: true,
                message: 'Job configuration deleted successfully'
            };
        } catch (error) {
            logger.error(`Error deleting job config: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Run a job config immediately
    fastify.post('/job-config/:id/run', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const configId = request.params.id;

            // Check if the job config exists and belongs to the user
            const existingConfig = await fastify.jobConfigModel.findById(configId, userId);

            if (!existingConfig) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found or you do not have access'
                });
            }

            // Here you would trigger the job to run immediately
            // This would connect to your job scheduler or queue
            // For now we'll just return a success message

            logger.info(`Manual execution triggered for job config ${configId}`);

            return {
                success: true,
                message: 'Job execution triggered successfully',
                jobId: configId,
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

    // Update AI training data for a job config
    fastify.post('/job-config/:id/ai-training', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const configId = request.params.id;
            const trainingData = request.body;

            // Validate required fields
            if (!trainingData.selfDescription) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    message: 'Self description is required for AI training'
                });
            }

            // Check if the job config exists and belongs to the user
            const existingConfig = await fastify.jobConfigModel.findById(configId, userId);

            if (!existingConfig) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found or you do not have access'
                });
            }

            // Update the AI training data
            const aiTrainingData = {
                aiTraining: {
                    selfDescription: trainingData.selfDescription,
                    updatedAt: new Date()
                }
            };

            await fastify.jobConfigModel.update(configId, userId, aiTrainingData);

            return {
                success: true,
                message: 'AI training data updated successfully',
                aiTraining: aiTrainingData.aiTraining
            };
        } catch (error) {
            logger.error(`Error updating AI training data: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Analyze user profile from portal
    fastify.post('/job-config/:id/analyze-profile', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const configId = request.params.id;
            const { portal } = request.body;

            // Check if the job config exists and belongs to the user
            const existingConfig = await fastify.jobConfigModel.findById(configId, userId);

            if (!existingConfig) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job configuration not found or you do not have access'
                });
            }

            // Get portal credentials
            const credential = await fastify.portalCredentialModel.getLoginCredentials(userId, portal || 'naukri');

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
                aiTraining: {
                    selfDescription: generatedDescription,
                    source: portal || 'naukri',
                    updatedAt: new Date()
                }
            };

            await fastify.jobConfigModel.update(configId, userId, aiTrainingData);

            return {
                success: true,
                message: 'Profile analyzed successfully',
                aiTraining: aiTrainingData.aiTraining
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