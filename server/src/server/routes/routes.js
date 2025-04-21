/**
 * API routes for the browser automation system
 */
import logger from '../../utils/logger.js';

/**
 * Route definitions
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 * @param {Function} done - Callback to signal completion
 */
export default async function routes(fastify, options) {
    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Start a new automation job with streaming
    fastify.post('/jobs', async (request, reply) => {
        try {
            const { platform, jobSearchParams } = request.body || {};

            if (!platform) {
                return reply.code(400).send({ error: 'Platform is required' });
            }

            logger.info(`Starting new job for platform: ${platform}`);

            // Here you'll integrate with your existing automation code
            // This is just a placeholder response
            const jobId = `job_${Date.now()}`;

            return {
                jobId,
                status: 'created',
                streamUrl: `/browser-stream?jobId=${jobId}`,
                message: `Job created for ${platform}`
            };
        } catch (error) {
            logger.error('Error creating job:', error);
            return reply.code(500).send({ error: 'Failed to create job' });
        }
    });

    // Get status of a specific job
    fastify.get('/jobs/:jobId', async (request, reply) => {
        const { jobId } = request.params;

        // Here you'll retrieve the actual job status from your system
        // This is just a placeholder
        return {
            jobId,
            status: 'running',
            platform: 'example',
            startedAt: new Date().toISOString()
        };
    });
}