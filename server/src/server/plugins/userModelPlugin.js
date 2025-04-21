// plugins/userModel.js
import { registerUserModel, UserModel } from '../models/UserModel.js';
import fp from 'fastify-plugin';
/**
 * Fastify Plugin to expose User model functionality
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 */
async function userModelPlugin(fastify, options) {
    // Register the user model with indexes
    registerUserModel(fastify);

    // Decorate fastify instance with user methods
    fastify.decorate('userModel', {
        findByEmail: (email) => UserModel.findByEmail(fastify, email),
        findById: (id) => UserModel.findById(fastify, id),
        create: (userData) => UserModel.create(fastify, userData),
        update: (id, updateData) => UserModel.update(fastify, id, updateData),
        delete: (id) => UserModel.delete(fastify, id),
        getAll: (options) => UserModel.getAll(fastify, options)
    });
}

export default fp(userModelPlugin, {
    name: 'user-model',
    dependencies: ['@fastify/mongodb'] 
});