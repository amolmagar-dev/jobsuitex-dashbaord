// plugins/jobConfigModel.js
import { registerJobConfigModel, JobConfigModel } from '../models/JobConfigModel.js';
import fp from 'fastify-plugin';

/**
 * Fastify Plugin to expose JobConfig model functionality
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 */
async function jobConfigPlugin(fastify, options) {
    // Register the job config model with indexes
    registerJobConfigModel(fastify);

    // Decorate fastify instance with job config methods
    fastify.decorate('jobConfigModel', {
        create: (userId, configData) => JobConfigModel.create(fastify, userId, configData),
        findByUser: (userId) => JobConfigModel.findByUser(fastify, userId),
        findById: (configId, userId) => JobConfigModel.findById(fastify, configId, userId),
        update: (configId, userId, updateData) => JobConfigModel.update(fastify, configId, userId, updateData),
        delete: (configId, userId) => JobConfigModel.delete(fastify, configId, userId),
        findDueForExecution: () => JobConfigModel.findDueForExecution(fastify),
        updateNextRunTime: (configId) => JobConfigModel.updateNextRunTime(fastify, configId)
    });
}

export default fp(jobConfigPlugin, {
    name: 'job-config-model',
    dependencies: ['@fastify/mongodb']
});