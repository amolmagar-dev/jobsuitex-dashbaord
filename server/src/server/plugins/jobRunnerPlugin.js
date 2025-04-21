import JobRunner from "../job/jobRunner.js";

/**
 * Create and register the job runner service with Fastify
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 */
export default async function jobRunnerPlugin(fastify, options) {
  // Create the job runner instance
  const jobRunner = JobRunner.getInstance(fastify);

  // Use the instance methods
  await jobRunner.initialize();
  // Decorate Fastify with the job runner
  fastify.decorate('jobRunner', jobRunner);

  // Initialize the job runner after server starts
  fastify.addHook('onReady', async () => {
    await jobRunner.initialize();
  });

  // Clean up on server close
  fastify.addHook('onClose', async (instance) => {
    instance.jobRunner.stop();
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
}