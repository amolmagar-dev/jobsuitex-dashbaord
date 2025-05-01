// routes/portalCredentialRoutes.js
import logger from '../../utils/logger.js';
import { verify } from '../../utils/verifyCredentials.js';

/**
 * Portal credential-related route definitions
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 * @param {Function} done - Callback to signal completion
 */
export default function portalCredentialRoutes(fastify, options, done) {
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

            // Verify credentials if verification is available
            if (credentialData.portal in verify) {
                try {
                    const isValid = await verify[credentialData.portal](credentialData.username, credentialData.password);

                    if (!isValid) {
                        return reply.code(400).send({
                            error: 'Verification Failed',
                            message: 'Invalid credentials for ' + credentialData.portal,
                            verified: false
                        });
                    }

                    // Generate mock cookies for the session
                    const mockCookies = `session=mock-session-${Date.now()}; domain=.${credentialData.portal}.com; path=/;`;
                    // Will create this if it doesn't exist during the save operation
                } catch (verifyError) {
                    logger.error(`Error verifying credentials: ${verifyError.message}`);
                    return reply.code(400).send({
                        error: 'Verification Failed',
                        message: verifyError.message || `Failed to verify ${credentialData.portal} credentials`,
                        verified: false
                    });
                }
            }

            // Save credentials
            // Add mock cookies to credential data if verification was successful
            if (credentialData.portal in verify) {
                const mockCookies = `session=mock-session-${Date.now()}; domain=.${credentialData.portal}.com; path=/;`;
                credentialData.cookies = mockCookies;
            }

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
                message: error.message || 'An error occurred while saving credentials',
                success: false
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

            if (!credentials || !credentials.username || !credentials.password) {
                return reply.code(400).send({
                    error: 'Bad Request',
                    message: 'Username and password are required'
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

            // Generate mock cookies for the session
            const mockCookies = `session=mock-session-${Date.now()}; domain=.${portal}.com; path=/;`;
            // Use request.user.id to ensure userId is defined
            await fastify.portalCredentialModel.updateCookies(request.user.id, portal, mockCookies);

            logger.info(`Credentials verified for ${portal} by user ${userId}`);

            return {
                success: true,
                message: `Credentials for ${portal} verified successfully`,
                verified: true
            };
        } catch (error) {
            logger.error(`Error verifying portal credentials: ${error.message}`);

            try {
                // Using request.user.id consistently to avoid undefined userId
                await fastify.portalCredentialModel.markInvalid(request.user.id, request.params.portal);
            } catch (markError) {
                logger.error(`Error marking credentials as invalid: ${markError.message}`);
            }

            return reply.code(500).send({
                error: 'Verification Failed',
                message: error.message || `Failed to verify ${request.params.portal} credentials`,
                verified: false,
                success: false
            });
        }
    });

    // Call done to signal completion
    done();
}