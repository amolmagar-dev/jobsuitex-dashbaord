// models/User.js
import fastify from 'fastify';

/**
 * User Schema Definition for MongoDB
 * 
 * This model aligns with the authentication routes that use
 * fastify.mongo.db.collection('users')
 */
export const userSchema = {
    firstName: { type: 'string', required: true },
    lastName: { type: 'string', required: true },
    email: { type: 'string', required: true, unique: true },
    password: { type: 'string' }, // Required for local auth only
    googleId: { type: 'string' }, // For Google OAuth users
    profilePicture: { type: 'string' }, // URL to profile image
    authProvider: {
        type: 'string',
        enum: ['local', 'google'],
        default: 'local'
    },
    role: {
        type: 'string',
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: { type: 'boolean', default: true },
    lastLogin: { type: 'date' },
    createdAt: { type: 'date', default: Date.now },
    updatedAt: { type: 'date', default: Date.now }
};

/**
 * Register User collection in Fastify
 * @param {FastifyInstance} app - Fastify instance
 */
export function registerUserModel(app) {
    // Create an index on the email field to ensure uniqueness
    app.ready().then(() => {
        app.mongo.db.collection('users').createIndex(
            { email: 1 },
            { unique: true }
        );
    });
}

/**
 * User helper functions that work with Fastify's MongoDB plugin
 */
export const UserModel = {
    /**
     * Find a user by email
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} email - User email
     * @returns {Promise<Object>} User document
     */
    async findByEmail(app, email) {
        return await app.mongo.db.collection('users').findOne({ email });
    },

    /**
     * Find a user by ID
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} id - User ID
     * @returns {Promise<Object>} User document
     */
    async findById(app, id) {
        return await app.mongo.db.collection('users').findOne({
            _id: new app.mongo.ObjectId(id)
        });
    },

    /**
     * Create a new user
     * @param {FastifyInstance} app - Fastify instance
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Insert result
     */
    async create(app, userData) {
        const now = new Date();
        return await app.mongo.db.collection('users').insertOne({
            ...userData,
            createdAt: now,
            updatedAt: now
        });
    },

    /**
     * Update a user
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} id - User ID
     * @param {Object} updateData - Fields to update
     * @returns {Promise<Object>} Update result
     */
    async update(app, id, updateData) {
        return await app.mongo.db.collection('users').updateOne(
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
     * Delete a user
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} id - User ID
     * @returns {Promise<Object>} Delete result
     */
    async delete(app, id) {
        return await app.mongo.db.collection('users').deleteOne({
            _id: new app.mongo.ObjectId(id)
        });
    },

    /**
     * Get all users (with optional pagination)
     * @param {FastifyInstance} app - Fastify instance
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Users array
     */
    async getAll(app, options = {}) {
        const { page = 1, limit = 20, role } = options;
        const skip = (page - 1) * limit;

        const query = {};
        if (role) query.role = role;

        return await app.mongo.db.collection('users')
            .find(query, { projection: { password: 0 } })
            .skip(skip)
            .limit(limit)
            .toArray();
    }
};

export default UserModel;