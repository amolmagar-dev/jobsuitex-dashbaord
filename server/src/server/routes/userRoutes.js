// routes/authRoutes.js
import { hash, compare } from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import logger from '../../utils/logger.js';

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Auth-related route definitions
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Plugin options
 * @param {Function} done - Callback to signal completion
 */
export default async function authRoutes(fastify, options) {

    // User signup endpoint
    fastify.post('/auth/signup', async (request, reply) => {
        try {
            const { firstName, lastName, email, password } = request.body;

            // Validate required fields
            if (!firstName || !lastName || !email || !password) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    message: 'All fields are required'
                });
            }

            // Check if user already exists using our user model
            const existingUser = await fastify.userModel.findByEmail(email);
            if (existingUser) {
                return reply.code(409).send({
                    error: 'Conflict',
                    message: 'User with this email already exists'
                });
            }

            // Hash password
            const saltRounds = 10;
            const hashedPassword = await hash(password, saltRounds);

            // Create user record with our user model
            const userData = {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                authProvider: 'local'
            };

            const result = await fastify.userModel.create(userData);

            // Generate token
            const tokenData = {
                id: result.insertedId.toString(),
                firstName,
                lastName,
                email
            };

            const token = fastify.jwt.sign(tokenData);

            logger.info(`New user registered: ${email}`);

            return {
                success: true,
                message: 'User registered successfully',
                user: tokenData,
                token
            };
        } catch (error) {
            logger.error('Error during user registration:', error);
            return reply.code(500).send({
                error: 'Server Error',
                message: 'Failed to register user'
            });
        }
    });

    // User login endpoint
    fastify.post('/auth/login', async (request, reply) => {
        try {
            const { email, password } = request.body;

            // Validate required fields
            if (!email || !password) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    message: 'Email and password are required'
                });
            }

            // Find user with our user model
            const user = await fastify.userModel.findByEmail(email);
            if (!user) {
                return reply.code(401).send({
                    error: 'Authentication Error',
                    message: 'Invalid email or password'
                });
            }

            // For users who signed up with Google
            if (user.authProvider === 'google' && !user.password) {
                return reply.code(400).send({
                    error: 'Authentication Error',
                    message: 'This account uses Google authentication. Please sign in with Google.'
                });
            }

            // Verify password
            const passwordMatch = await compare(password, user.password);
            if (!passwordMatch) {
                return reply.code(401).send({
                    error: 'Authentication Error',
                    message: 'Invalid email or password'
                });
            }

            // Update last login timestamp
            await fastify.userModel.update(user._id.toString(), {
                lastLogin: new Date()
            });

            // Generate token
            const userData = {
                id: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            };

            const token = fastify.jwt.sign(userData);

            logger.info(`User logged in: ${email}`);

            return {
                success: true,
                message: 'Login successful',
                user: userData,
                token
            };
        } catch (error) {
            logger.error('Error during user login:', error);
            return reply.code(500).send({
                error: 'Server Error',
                message: 'Failed to login'
            });
        }
    });

    // Google authentication endpoint
    fastify.post('/auth/google', async (request, reply) => {
        try {
            const { token } = request.body;

            if (!token) {
                return reply.code(400).send({
                    error: 'Validation Error',
                    message: 'Google token is required'
                });
            }

            // Verify Google token
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            const { email, given_name, family_name, picture, sub } = payload;

            // Find if user already exists
            let user = await fastify.userModel.findByEmail(email);
            let userData;

            if (!user) {
                // Create new user if doesn't exist
                const newUser = {
                    firstName: given_name,
                    lastName: family_name,
                    email,
                    googleId: sub,
                    profilePicture: picture,
                    authProvider: 'google',
                    lastLogin: new Date()
                };

                const result = await fastify.userModel.create(newUser);
                userData = {
                    id: result.insertedId.toString(),
                    firstName: given_name,
                    lastName: family_name,
                    email,
                    picture
                };

                logger.info(`New user registered via Google: ${email}`);
            } else {
                // Update existing user with Google info if needed
                await fastify.userModel.update(
                    user._id.toString(),
                    {
                        googleId: sub,
                        firstName: given_name || user.firstName,
                        lastName: family_name || user.lastName,
                        profilePicture: picture || user.profilePicture,
                        authProvider: 'google',
                        lastLogin: new Date()
                    }
                );

                userData = {
                    id: user._id.toString(),
                    firstName: given_name || user.firstName,
                    lastName: family_name || user.lastName,
                    email,
                    picture: picture || user.profilePicture
                };

                logger.info(`Existing user logged in via Google: ${email}`);
            }

            // Generate token
            const jwtToken = fastify.jwt.sign(userData);

            return {
                success: true,
                message: 'Google authentication successful',
                user: userData,
                token: jwtToken
            };
        } catch (error) {
            logger.error('Error during Google authentication:', error);
            return reply.code(500).send({
                error: 'Server Error',
                message: 'Failed to authenticate with Google'
            });
        }
    });

    // Get current user profile
    fastify.get('/auth/me', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.id;

            const user = await fastify.userModel.findById(userId);

            if (!user) {
                return reply.code(404).send({
                    error: 'Not Found',
                    message: 'User not found'
                });
            }

            return {
                success: true,
                user: {
                    id: user._id.toString(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    profilePicture: user.profilePicture,
                    authProvider: user.authProvider,
                    createdAt: user.createdAt,
                    role: user.role || 'user'
                }
            };
        } catch (error) {
            logger.error('Error fetching user profile:', error);
            return reply.code(500).send({
                error: 'Server Error',
                message: 'Failed to fetch user profile'
            });
        }
    });

    // Logout endpoint (client-side only in JWT, but we can blacklist tokens if needed)
    fastify.post('/auth/logout', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        // For complete logout, we would add the token to a blacklist or invalidate it
        // Here we're just acknowledging the logout action
        return {
            success: true,
            message: 'Logged out successfully'
        };
    });
}