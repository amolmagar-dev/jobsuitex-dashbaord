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

    // Get dashboard statistics for cards display
    fastify.get('/job-applications/dashboard-statistics', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            
            // 1. Get total applications count
            const totalApplications = await fastify.mongo.db.collection('jobApplications').countDocuments({
                userId
            });
            
            // 2. Get early applications (posted as "Just Now" or "Today")
            const earlyApplications = await fastify.mongo.db.collection('jobApplications').countDocuments({
                userId,
                $or: [
                    { postedOn: "Just Now" },
                    { postedOn: "Today" }
                ]
            });
            
            // 3. Get rejection statistics
            const totalRejected = await fastify.mongo.db.collection('jobApplications').countDocuments({
                userId,
                status: "Rejected"
            });
            
            const rejectionRate = totalApplications > 0 
                ? Math.round((totalRejected / totalApplications) * 100) 
                : 0;
            
            // Get statistics from last month for trend comparison
            const lastMonthStart = new Date();
            lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
            lastMonthStart.setDate(1);
            lastMonthStart.setHours(0, 0, 0, 0);
            
            const lastMonthEnd = new Date();
            lastMonthEnd.setDate(0); // Last day of previous month
            lastMonthEnd.setHours(23, 59, 59, 999);
            
            const lastMonthTotal = await fastify.mongo.db.collection('jobApplications').countDocuments({
                userId,
                appliedOn: { $gte: lastMonthStart, $lte: lastMonthEnd }
            });
            
            const lastMonthRejected = await fastify.mongo.db.collection('jobApplications').countDocuments({
                userId,
                status: "Rejected",
                appliedOn: { $gte: lastMonthStart, $lte: lastMonthEnd }
            });
            
            const lastMonthRejectionRate = lastMonthTotal > 0 
                ? Math.round((lastMonthRejected / lastMonthTotal) * 100) 
                : 0;
            
            // Calculate rejection rate trend
            const rejectionRateTrend = lastMonthRejectionRate > 0 
                ? rejectionRate - lastMonthRejectionRate 
                : 0;
            
            // Get recent applications (last 7 days) for trending
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            
            const recentApplications = await fastify.mongo.db.collection('jobApplications').countDocuments({
                userId,
                appliedOn: { $gte: sevenDaysAgo }
            });
            
            // Calculate application count from previous 7 day period
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            fourteenDaysAgo.setHours(0, 0, 0, 0);
            
            const previousPeriodApplications = await fastify.mongo.db.collection('jobApplications').countDocuments({
                userId,
                appliedOn: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
            });
            
            // Calculate application trend
            const applicationTrend = previousPeriodApplications > 0 
                ? Math.round(((recentApplications - previousPeriodApplications) / previousPeriodApplications) * 100)
                : (recentApplications > 0 ? 100 : 0);
            
            // Format response for frontend
            return {
                success: true,
                statistics: {
                    totalApplications: {
                        value: totalApplications,
                        trend: applicationTrend,
                        recentCount: recentApplications
                    },
                    earlyApplications: {
                        value: earlyApplications,
                        percentage: totalApplications > 0 ? Math.round((earlyApplications / totalApplications) * 100) : 0
                    },
                    rejectionRate: {
                        value: rejectionRate,
                        trend: rejectionRateTrend,
                        improving: rejectionRateTrend < 0, // Negative trend is good for rejections
                        count: totalRejected
                    }
                }
            };
        } catch (error) {
            logger.error(`Error fetching dashboard statistics: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });


    // Get application activity timeline for chart
    fastify.get('/job-applications/activity-timeline', { onRequest: [fastify.authenticate] }, async (request, reply) => {
      try {
          const userId = request.user.id;
          const { timeRange = '90d' } = request.query;
          
          // Determine the start date based on the time range
          const endDate = new Date();
          const startDate = new Date();
          
          switch(timeRange) {
              case '7d':
                  startDate.setDate(startDate.getDate() - 7);
                  break;
              case '30d':
                  startDate.setDate(startDate.getDate() - 30);
                  break;
              case '90d':
              default:
                  startDate.setDate(startDate.getDate() - 90);
                  break;
          }
          
          // Set start date to beginning of day and end date to end of day
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          
          // Get all applications within the date range
          const applications = await fastify.mongo.db.collection('jobApplications')
              .find({
                  userId,
                  appliedOn: { $gte: startDate, $lte: endDate }
              })
              .sort({ appliedOn: 1 })
              .toArray();
          
          // Process applications into timeline data
          // Group by application date
          const timelineMap = new Map();
          
          // Helper function to get date string (YYYY-MM-DD)
          const getDateString = (date) => {
              const d = new Date(date);
              return d.toISOString().split('T')[0]; // YYYY-MM-DD
          };
          
          // Initialize all dates in the range
          let currentDate = new Date(startDate);
          while (currentDate <= endDate) {
              const dateKey = getDateString(currentDate);
              
              if (!timelineMap.has(dateKey)) {
                  timelineMap.set(dateKey, {
                      date: dateKey,
                      count: 0,
                      portals: {}
                  });
              }
              
              // Move to next day
              currentDate.setDate(currentDate.getDate() + 1);
          }
          
          // Count applications by date and portal
          applications.forEach(app => {
              const dateKey = getDateString(app.appliedOn);
              
              if (!timelineMap.has(dateKey)) {
                  // This should not happen with our initialization, but just in case
                  timelineMap.set(dateKey, {
                      date: dateKey,
                      count: 0,
                      portals: {}
                  });
              }
              
              const entry = timelineMap.get(dateKey);
              
              // Increment total count
              entry.count += 1;
              
              // Count by portal
              const portal = app.portal || 'Other';
              if (!entry.portals[portal]) {
                  entry.portals[portal] = 0;
              }
              entry.portals[portal] += 1;
          });
          
          // Convert map to sorted array
          const timelineData = Array.from(timelineMap.values())
              .sort((a, b) => new Date(a.date) - new Date(b.date));
          
          return {
              success: true,
              timeline: timelineData
          };
      } catch (error) {
          logger.error(`Error fetching activity timeline: ${error.message}`);
          return reply.code(500).send({
              error: 'Server Error',
              message: error.message
          });
      }
  });
    
}