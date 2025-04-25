// routes/jobApplicationRoutes.js
import logger from '../../utils/logger.js';

/**
 * Job application-related route definitions
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 * @param {Function} done - Callback to signal completion
 */
export default async function jobApplicationRoutes(fastify, options) {
    // Get all job applications for a user with pagination and filtering
    fastify.get('/job-applications', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const {
                page = 1,
                limit = 20,
                status,
                portal,
                company,
                sortBy = 'appliedOn',
                sortOrder = 'desc'
            } = request.query;

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                status,
                portal,
                company,
                sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
            };

            const applications = await fastify.jobApplicationModel.getAllForUser(userId, options);

            // Get total count for pagination
            const countOptions = { status, portal, company };
            const totalCount = await fastify.mongo.db.collection('jobApplications').countDocuments({
                userId,
                ...(status ? { status } : {}),
                ...(portal ? { portal } : {}),
                ...(company ? { company: { $regex: company, $options: 'i' } } : {})
            });

            // Transform _id to id for frontend consistency
            const transformedApps = applications.map(app => ({
                id: app._id,
                title: app.title,
                company: app.company,
                location: app.location,
                experience: app.experience,
                salary: app.salary,
                rating: app.rating,
                reviews: app.reviews,
                postedOn: app.postedOn,
                description: app.description,
                skills: app.skills,
                applyLink: app.applyLink,
                portal: app.portal,
                status: app.status,
                appliedOn: app.appliedOn,
                applicationId: app.applicationId,
                notes: app.notes,
                createdAt: app.createdAt,
                updatedAt: app.updatedAt
            }));

            return {
                success: true,
                applications: transformedApps,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalItems: totalCount,
                    totalPages: Math.ceil(totalCount / parseInt(limit))
                }
            };
        } catch (error) {
            logger.error(`Error fetching job applications: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });
}