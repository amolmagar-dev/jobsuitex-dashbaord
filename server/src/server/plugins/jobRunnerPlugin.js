// plugins/jobRunnerPlugin.js
import JobRunner from "../job/jobRunner.js";
import fp from 'fastify-plugin';

/**
 * Create and register the job runner service with Fastify
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 */
const jobRunnerPlugin = async function(fastify, options) {
  try {
    // Create the job runner instance
    const jobRunner = JobRunner.getInstance(fastify);

    // Decorate Fastify with the job runner
    fastify.decorate('jobRunner', jobRunner);

    // Initialize the job runner after server starts
    fastify.addHook('onReady', async () => {
      try {
        await jobRunner.initialize();
        fastify.log.info('Job Runner initialized successfully from onReady hook');
      } catch (error) {
        fastify.log.error({ err: error }, 'Failed to initialize JobRunner from onReady hook');
      }
    });

    // Clean up on server close
    fastify.addHook('onClose', async (instance) => {
      try {
        instance.jobRunner.stop();
        fastify.log.info('Job Runner stopped successfully');
      } catch (error) {
        fastify.log.error({ err: error }, 'Error stopping JobRunner');
      }
    });

    // Register routes to manage jobs
    fastify.put('/api/jobs/:id/schedule', async (request, reply) => {
      const { id } = request.params;

      try {
        await jobRunner.updateJob(id);
        return { success: true, message: 'Job scheduled successfully' };
      } catch (error) {
        request.log.error({ err: error }, 'Error scheduling job');
        return reply.code(500).send({ success: false, message: 'Failed to schedule job' });
      }
    });

    fastify.delete('/api/jobs/:id/schedule', async (request, reply) => {
      const { id } = request.params;

      try {
        jobRunner.removeJob(id);
        return { success: true, message: 'Job removed from scheduler' };
      } catch (error) {
        request.log.error({ err: error }, 'Error removing job from scheduler');
        return reply.code(500).send({ success: false, message: 'Failed to remove job from scheduler' });
      }
    });

    fastify.post('/api/jobs/:id/run', async (request, reply) => {
      const { id } = request.params;

      try {
        const result = await jobRunner.runJobNow(id);
        return result;
      } catch (error) {
        request.log.error({ err: error }, 'Error running job now');
        return reply.code(500).send({ success: false, message: 'Failed to run job' });
      }
    });
    
    // Log successful registration
    fastify.log.info('Job Runner plugin registered successfully');
  } catch (error) {
    fastify.log.error({ err: error }, 'Error registering Job Runner plugin');
    throw error;
  }
};

// Export the plugin with fastify-plugin for proper dependency handling
export default fp(jobRunnerPlugin, {
  name: 'job-runner',
  dependencies: ['@fastify/mongodb', 'job-config-model']
});