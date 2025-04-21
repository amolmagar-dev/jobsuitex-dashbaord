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

    // Get a specific job application
    fastify.get('/job-applications/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const applicationId = request.params.id;

            const application = await fastify.mongo.db.collection('jobApplications').findOne({
                _id: fastify.mongo.ObjectId(applicationId),
                userId
            });

            if (!application) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job application not found or you do not have access'
                });
            }

            // Transform _id to id for frontend consistency
            const transformedApp = {
                id: application._id,
                title: application.title,
                company: application.company,
                location: application.location,
                experience: application.experience,
                salary: application.salary,
                rating: application.rating,
                reviews: application.reviews,
                postedOn: application.postedOn,
                description: application.description,
                skills: application.skills,
                applyLink: application.applyLink,
                portal: application.portal,
                status: application.status,
                appliedOn: application.appliedOn,
                applicationId: application.applicationId,
                notes: application.notes,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt
            };

            return {
                success: true,
                application: transformedApp
            };
        } catch (error) {
            logger.error(`Error fetching job application: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Create a new job application manually
    fastify.post('/job-applications', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const applicationData = request.body;

            // Validate required fields
            if (!applicationData.title || !applicationData.company || !applicationData.portal) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    message: 'Required fields missing: title, company, portal'
                });
            }

            // Add user ID and timestamps
            const now = new Date();
            const newApplication = {
                ...applicationData,
                userId,
                appliedOn: applicationData.appliedOn || now,
                status: applicationData.status || 'Applied',
                applicationId: applicationData.applicationId || `APP-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
                createdAt: now,
                updatedAt: now
            };

            const result = await fastify.jobApplicationModel.create(newApplication);

            return {
                success: true,
                message: 'Job application created successfully',
                application: {
                    id: result.insertedId,
                    ...newApplication
                }
            };
        } catch (error) {
            logger.error(`Error creating job application: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Update a job application
    fastify.put('/job-applications/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const applicationId = request.params.id;
            const updateData = request.body;

            // Check if the job application exists and belongs to the user
            const existingApplication = await fastify.mongo.db.collection('jobApplications').findOne({
                _id: fastify.mongo.ObjectId(applicationId),
                userId
            });

            if (!existingApplication) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job application not found or you do not have access'
                });
            }

            // Update the application
            await fastify.jobApplicationModel.update(applicationId, {
                ...updateData,
                updatedAt: new Date()
            });

            // Get the updated application
            const updatedApplication = await fastify.mongo.db.collection('jobApplications').findOne({
                _id: fastify.mongo.ObjectId(applicationId)
            });

            // Transform _id to id for frontend consistency
            const transformedApp = {
                id: updatedApplication._id,
                title: updatedApplication.title,
                company: updatedApplication.company,
                location: updatedApplication.location,
                experience: updatedApplication.experience,
                salary: updatedApplication.salary,
                rating: updatedApplication.rating,
                reviews: updatedApplication.reviews,
                postedOn: updatedApplication.postedOn,
                description: updatedApplication.description,
                skills: updatedApplication.skills,
                applyLink: updatedApplication.applyLink,
                portal: updatedApplication.portal,
                status: updatedApplication.status,
                appliedOn: updatedApplication.appliedOn,
                applicationId: updatedApplication.applicationId,
                notes: updatedApplication.notes,
                createdAt: updatedApplication.createdAt,
                updatedAt: updatedApplication.updatedAt
            };

            return {
                success: true,
                message: 'Job application updated successfully',
                application: transformedApp
            };
        } catch (error) {
            logger.error(`Error updating job application: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Update job application status
    fastify.patch('/job-applications/:id/status', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const applicationId = request.params.id;
            const { status, notes } = request.body;

            // Validate the status
            const validStatuses = ['Applied', 'Interviewing', 'Rejected', 'Offered', 'Accepted', 'Withdrawn'];
            if (!status || !validStatuses.includes(status)) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    message: `Status must be one of: ${validStatuses.join(', ')}`
                });
            }

            // Check if the job application exists and belongs to the user
            const existingApplication = await fastify.mongo.db.collection('jobApplications').findOne({
                _id: fastify.mongo.ObjectId(applicationId),
                userId
            });

            if (!existingApplication) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job application not found or you do not have access'
                });
            }

            // Update the status and optional notes
            const updateData = {
                status,
                updatedAt: new Date()
            };

            if (notes) {
                updateData.notes = notes;
            }

            await fastify.jobApplicationModel.update(applicationId, updateData);

            // Log status change for tracking
            await fastify.mongo.db.collection('applicationStatusHistory').insertOne({
                applicationId,
                userId,
                previousStatus: existingApplication.status,
                newStatus: status,
                notes: notes || `Status changed from ${existingApplication.status} to ${status}`,
                createdAt: new Date()
            });

            return {
                success: true,
                message: `Job application status updated to ${status}`,
                status
            };
        } catch (error) {
            logger.error(`Error updating job application status: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Delete a job application
    fastify.delete('/job-applications/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const applicationId = request.params.id;

            // Check if the job application exists and belongs to the user
            const existingApplication = await fastify.mongo.db.collection('jobApplications').findOne({
                _id: fastify.mongo.ObjectId(applicationId),
                userId
            });

            if (!existingApplication) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job application not found or you do not have access'
                });
            }

            const result = await fastify.jobApplicationModel.delete(applicationId);

            if (result.deletedCount === 0) {
                return reply.code(404).send({
                    error: 'Delete Failed',
                    message: 'Job application could not be deleted'
                });
            }

            return {
                success: true,
                message: 'Job application deleted successfully'
            };
        } catch (error) {
            logger.error(`Error deleting job application: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Get job application statistics
    fastify.get('/job-applications/stats', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;

            const stats = await fastify.jobApplicationModel.getStatistics(userId);

            return {
                success: true,
                statistics: {
                    byStatus: stats.byStatus.map(item => ({
                        status: item._id,
                        count: item.count
                    })),
                    byPortal: stats.byPortal.map(item => ({
                        portal: item._id,
                        count: item.count
                    })),
                    byMonth: stats.byMonth.map(item => ({
                        year: item._id.year,
                        month: item._id.month,
                        count: item.count
                    })),
                    total: stats.total[0]?.count || 0
                }
            };
        } catch (error) {
            logger.error(`Error fetching job application statistics: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Get job application history (for a specific application)
    fastify.get('/job-applications/:id/history', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const applicationId = request.params.id;

            // Check if the job application exists and belongs to the user
            const existingApplication = await fastify.mongo.db.collection('jobApplications').findOne({
                _id: fastify.mongo.ObjectId(applicationId),
                userId
            });

            if (!existingApplication) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Job application not found or you do not have access'
                });
            }

            // Get status history
            const history = await fastify.mongo.db.collection('applicationStatusHistory')
                .find({ applicationId: applicationId.toString() })
                .sort({ createdAt: -1 })
                .toArray();

            return {
                success: true,
                application: {
                    id: existingApplication._id,
                    title: existingApplication.title,
                    company: existingApplication.company
                },
                history: history.map(item => ({
                    id: item._id,
                    previousStatus: item.previousStatus,
                    newStatus: item.newStatus,
                    notes: item.notes,
                    createdAt: item.createdAt
                }))
            };
        } catch (error) {
            logger.error(`Error fetching job application history: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Bulk update job applications status (for multiple applications)
    fastify.post('/job-applications/bulk-update', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { applicationIds, status, notes } = request.body;

            // Validate required fields
            if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    message: 'Application IDs are required and must be an array'
                });
            }

            // Validate the status
            const validStatuses = ['Applied', 'Interviewing', 'Rejected', 'Offered', 'Accepted', 'Withdrawn'];
            if (!status || !validStatuses.includes(status)) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    message: `Status must be one of: ${validStatuses.join(', ')}`
                });
            }

            // Convert string IDs to ObjectIds
            const objectIds = applicationIds.map(id => fastify.mongo.ObjectId(id));

            // Find applications that belong to the user
            const applications = await fastify.mongo.db.collection('jobApplications')
                .find({ _id: { $in: objectIds }, userId })
                .toArray();

            if (applications.length === 0) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'No matching job applications found'
                });
            }

            // Update all applications
            const updatePromises = applications.map(app => {
                // Log status change for tracking
                const historyPromise = fastify.mongo.db.collection('applicationStatusHistory').insertOne({
                    applicationId: app._id.toString(),
                    userId,
                    previousStatus: app.status,
                    newStatus: status,
                    notes: notes || `Status changed from ${app.status} to ${status} (bulk update)`,
                    createdAt: new Date()
                });

                // Update the application
                const updatePromise = fastify.mongo.db.collection('jobApplications').updateOne(
                    { _id: app._id },
                    {
                        $set: {
                            status,
                            ...(notes ? { notes } : {}),
                            updatedAt: new Date()
                        }
                    }
                );

                return Promise.all([historyPromise, updatePromise]);
            });

            await Promise.all(updatePromises.flat());

            return {
                success: true,
                message: `Updated status to ${status} for ${applications.length} applications`,
                updatedCount: applications.length
            };
        } catch (error) {
            logger.error(`Error bulk updating job applications: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });
}