// routes/portalCredentialRoutes.js
import logger from '../../utils/logger.js';
import { verify } from '../../utils/verifyCredentials.js';


/**
 * Portal credential-related route definitions
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 * @param {Function} done - Callback to signal completion
 */
export default async function portalCredentialRoutes(fastify, options) {
    // Save portal credentials
    fastify.post('/portal-credentials', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const credentialData = request.body;

            // Validate required fields
            if (!credentialData.portal || !credentialData.username || !credentialData.password) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    message: 'Portal, username, and password are required'
                });
            }

            // Validate portal is supported
            const supportedPortals = ['naukri', 'linkedin', 'indeed', 'monster'];
            if (!supportedPortals.includes(credentialData.portal)) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    message: `Portal must be one of: ${supportedPortals.join(', ')}`
                });
            }

            // Save credentials
            await fastify.portalCredentialModel.saveCredential(userId, credentialData);

            // Get the saved credential (without password)
            const credential = await fastify.portalCredentialModel.getCredential(userId, credentialData.portal);

            logger.info(`Credentials saved for ${credentialData.portal} portal by user ${userId}`);

            return {
                success: true,
                message: `Credentials for ${credentialData.portal} saved successfully`,
                credential
            };
        } catch (error) {
            logger.error(`Error saving portal credentials: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Get credentials for a specific portal
    fastify.get('/portal-credentials/:portal', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const portal = request.params.portal;

            const credential = await fastify.portalCredentialModel.getCredential(userId, portal);

            if (!credential) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: `No credentials found for ${portal}`
                });
            }

            return {
                success: true,
                credential
            };
        } catch (error) {
            logger.error(`Error fetching portal credential: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Get all portal credentials for a user
    fastify.get('/portal-credentials', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;

            const credentials = await fastify.portalCredentialModel.getAllCredentials(userId);

            return {
                success: true,
                credentials
            };
        } catch (error) {
            logger.error(`Error fetching portal credentials: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Delete portal credentials
    fastify.delete('/portal-credentials/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const credentialId = request.params.id;

            const result = await fastify.portalCredentialModel.deleteCredential(credentialId, userId);

            if (result.deletedCount === 0) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'Credential not found or you do not have access'
                });
            }

            logger.info(`Credentials deleted by user ${userId}`);

            return {
                success: true,
                message: 'Credentials deleted successfully'
            };
        } catch (error) {
            logger.error(`Error deleting portal credential: ${error.message}`);
            return reply.code(500).send({
                error: 'Server Error',
                message: error.message
            });
        }
    });

    // Verify credentials (test login)
    fastify.post('/portal-credentials/:portal/verify', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const portal = request.params.portal;

            const credentials = request.body;

            if (!credentials) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: `No credentials found for ${portal}`
                });
            }

            if (!(portal in verify)) {
                return reply.code(400).send({
                    error: 'Unsupported Portal',
                    message: `Verification not implemented for ${portal}`
                });
            }

            const isValid = await verify[portal](credentials.username, credentials.password);

            if (!isValid) {
                throw new Error('Invalid credentials');
            }

            const mockCookies = `session=mock-session-${Date.now()}; domain=.${portal}.com; path=/;`;
            await fastify.portalCredentialModel.updateCookies(userId, portal, mockCookies);

            logger.info(`Credentials verified for ${portal} by user ${userId}`);

            return {
                success: true,
                message: `Credentials for ${portal} verified successfully`,
                verified: true
            };
        } catch (error) {
            logger.error(`Error verifying portal credentials: ${error.message}`);

            try {
                await fastify.portalCredentialModel.markInvalid(request.user.id, request.params.portal);
            } catch (markError) {
                logger.error(`Error marking credentials as invalid: ${markError.message}`);
            }

            return reply.code(500).send({
                error: 'Verification Failed',
                message: error.message,
                verified: false
            });
        }
    });
}