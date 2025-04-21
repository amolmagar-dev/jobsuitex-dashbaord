// plugins/portalCredentialModel.js
import { registerPortalCredentialModel, PortalCredentialModel } from '../models/PortalCredential.js';
import fp from 'fastify-plugin';

/**
 * Fastify Plugin to expose PortalCredential model functionality
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 */
async function portalCredentialPlugin(fastify, options) {
    // Register the portal credential model with indexes
    registerPortalCredentialModel(fastify);

    // Decorate fastify instance with portal credential methods
    fastify.decorate('portalCredentialModel', {
        saveCredential: (userId, credentialData) =>
            PortalCredentialModel.saveCredential(fastify, userId, credentialData),

        getCredential: (userId, portal) =>
            PortalCredentialModel.getCredential(fastify, userId, portal),

        getAllCredentials: (userId) =>
            PortalCredentialModel.getAllCredentials(fastify, userId),

        deleteCredential: (credentialId, userId) =>
            PortalCredentialModel.deleteCredential(fastify, credentialId, userId),

        markInvalid: (userId, portal) =>
            PortalCredentialModel.markInvalid(fastify, userId, portal),

        getLoginCredentials: (userId, portal) =>
            PortalCredentialModel.getLoginCredentials(fastify, userId, portal),

        updateCookies: (userId, portal, cookies) =>
            PortalCredentialModel.updateCookies(fastify, userId, portal, cookies)
    });
}

export default fp(portalCredentialPlugin, {
    name: 'portal-credential-model',
    dependencies: ['@fastify/mongodb']
});