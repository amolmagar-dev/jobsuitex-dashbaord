// plugins/jobApplicationModel.js
import { registerJobApplicationModel, JobApplicationModel, createNotification } from '../models/JobApplicationModel.js';
import fp from 'fastify-plugin';

/**
 * Fastify Plugin to expose Job Application model functionality
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 */
async function jobApplicationModelPlugin(fastify, options) {
    // Register the job application model with indexes
    registerJobApplicationModel(fastify);

    // Decorate fastify instance with job application methods
    fastify.decorate('jobApplicationModel', {
        findById: (id) => JobApplicationModel.findById(fastify, id),
        create: (jobData) => JobApplicationModel.create(fastify, jobData),
        update: (id, updateData) => JobApplicationModel.update(fastify, id, updateData),
        delete: (id) => JobApplicationModel.delete(fastify, id),
        getAllForUser: (userId, options) => JobApplicationModel.getAllForUser(fastify, userId, options),
        getStatistics: (userId) => JobApplicationModel.getStatistics(fastify, userId),
        createNotification: (job) => createNotification(job)
    });
}

export default fp(jobApplicationModelPlugin, {
    name: 'job-application-model',
    dependencies: ['@fastify/mongodb']
});