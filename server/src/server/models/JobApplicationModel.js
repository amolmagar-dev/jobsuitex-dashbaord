// models/JobApplicationModel.js
/**
 * Job Application Schema Definition for MongoDB
 * 
 * This model aligns with the job application routes that use
 * fastify.mongo.db.collection('jobApplications')
 */
export const jobApplicationSchema = {
    title: { type: 'string', required: true },
    company: { type: 'string', required: true },
    location: { type: 'string', default: 'N/A' },
    experience: { type: 'string', default: 'N/A' },
    salary: { type: 'string', default: 'N/A' },
    rating: { type: 'string', default: 'N/A' },
    reviews: { type: 'string', default: 'No' },
    postedOn: { type: 'string', default: 'N/A' },
    description: { type: 'string', default: 'No description available' },
    skills: { type: 'array', items: { type: 'string' }, default: [] },
    applyLink: { type: 'string', default: 'N/A' },
    portal: {
        type: 'string',
        required: true,
        enum: ['LinkedIn', 'Indeed', 'Glassdoor', 'Monster', 'ZipRecruiter', 'Dice', 'Other']
    },
    userId: { type: 'string', required: true },
    appliedOn: { type: 'date', default: Date.now },
    status: {
        type: 'string',
        enum: ['Applied', 'Interviewing', 'Rejected', 'Offered', 'Accepted', 'Withdrawn'],
        default: 'Applied'
    },
    applicationId: { type: 'string' },
    notes: { type: 'string' },
    createdAt: { type: 'date', default: Date.now },
    updatedAt: { type: 'date', default: Date.now }
};

/**
 * Register Job Application collection in Fastify
 * @param {FastifyInstance} app - Fastify instance
 */
export function registerJobApplicationModel(app) {
    // Create compound index on userId and company+title for faster queries
    app.ready().then(() => {
        app.mongo.db.collection('jobApplications').createIndex(
            { userId: 1, company: 1, title: 1 },
            { unique: true }
        );

        // Create index for status-based queries
        app.mongo.db.collection('jobApplications').createIndex(
            { status: 1, userId: 1 }
        );

        // Create index for portal-based queries
        app.mongo.db.collection('jobApplications').createIndex(
            { portal: 1, userId: 1 }
        );
    });
}

/**
 * Create notification message from job application data
 * @param {Object} job - Job application data
 * @returns {string} Formatted notification message
 */
export function createNotification(job) {
    return `📢 *Job Applied Successfully!*

🔹 *Position:* ${job.title}
🏢 *Company:* ${job.company}
📍 *Location:* ${job.location || 'N/A'}
🧠 *Experience:* ${job.experience || 'N/A'}
💰 *Salary:* ${job.salary || 'N/A'}
⭐ *Rating:* ${job.rating || 'N/A'} (${job.reviews || 'No'} reviews)
📅 *Posted On:* ${job.postedOn || 'N/A'}
🌐 *Portal:* ${job.portal || 'N/A'}
👤 *User:* ${job.userName || 'N/A'}

📝 *Description:* ${job.description || 'No description available'}

🛠️ *Skills:* ${job.skills && job.skills.length ? job.skills.join(', ') : 'N/A'}

🔗 *Apply Link:* ${job.applyLink || 'N/A'}

🟢 Please wait while we track the application status.`;
}

/**
 * Job Application helper functions that work with Fastify's MongoDB plugin
 */
export const JobApplicationModel = {
    /**
     * Find a job application by ID
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} id - Application ID
     * @returns {Promise<Object>} Job application document
     */
    async findById(app, id) {
        return await app.mongo.db.collection('jobApplications').findOne({
            _id: new app.mongo.ObjectId(id)
        });
    },

    /**
     * Create a new job application
     * @param {FastifyInstance} app - Fastify instance
     * @param {Object} jobData - Job application data
     * @returns {Promise<Object>} Insert result
     */
    async create(app, jobData) {
        const now = new Date();
        return await app.mongo.db.collection('jobApplications').insertOne({
            ...jobData,
            appliedOn: now,
            createdAt: now,
            updatedAt: now
        });
    },

    /**
     * Update a job application
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} id - Application ID
     * @param {Object} updateData - Fields to update
     * @returns {Promise<Object>} Update result
     */
    async update(app, id, updateData) {
        return await app.mongo.db.collection('jobApplications').updateOne(
            { _id: new app.mongo.ObjectId(id) },
            {
                $set: {
                    ...updateData,
                    updatedAt: new Date()
                }
            }
        );
    },

    /**
     * Delete a job application
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} id - Application ID
     * @returns {Promise<Object>} Delete result
     */
    async delete(app, id) {
        return await app.mongo.db.collection('jobApplications').deleteOne({
            _id: new app.mongo.ObjectId(id)
        });
    },

    /**
     * Get all job applications for a user (with optional filtering and pagination)
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Job applications array
     */
    async getAllForUser(app, userId, options = {}) {
        const { page = 1, limit = 20, status, portal, company } = options;
        const skip = (page - 1) * limit;

        const query = { userId };
        if (status) query.status = status;
        if (portal) query.portal = portal;
        if (company) query.company = { $regex: company, $options: 'i' };

        return await app.mongo.db.collection('jobApplications')
            .find(query)
            .sort({ appliedOn: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
    },

    /**
     * Get application statistics for a user
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Statistics object
     */
    async getStatistics(app, userId) {
        const pipeline = [
            { $match: { userId: userId } },
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ],
                    byPortal: [
                        { $group: { _id: "$portal", count: { $sum: 1 } } }
                    ],
                    byMonth: [
                        {
                            $group: {
                                _id: {
                                    year: { $year: "$appliedOn" },
                                    month: { $month: "$appliedOn" }
                                },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { "_id.year": 1, "_id.month": 1 } }
                    ],
                    total: [
                        { $count: "count" }
                    ]
                }
            }
        ];

        const results = await app.mongo.db.collection('jobApplications').aggregate(pipeline).toArray();
        return results[0];
    }
};

export default JobApplicationModel;