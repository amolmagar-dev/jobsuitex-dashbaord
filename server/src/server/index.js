// Main server entry point
import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyCors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyMongo from '@fastify/mongodb';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import config from '../../config/config.js';
import routes from './routes/routes.js';
import userRoutes from './routes/userRoutes.js';
import userModelPlugin from './plugins/userModelPlugin.js';
import jobConfigPlugin from './plugins/jobConfigPlugin.js';
import jobConfigRoutes from './routes/jobConfigRoutes.js';
import portalCredentialPlugin from './plugins/portalCredentialPlugin.js';
import portalCredentialRoutes from './routes/portalCredentialRoutes.js';
import jobRunnerPlugin from './plugins/jobRunnerPlugin.js';
import jobApplicationModelPlugin from './plugins/jobApplicationPlugin.js';
import jobApplicationRoutes from './routes/jobApplicationRoutes.js';

// Load environment variables
dotenv.config();

// Get current directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Fastify instance
const fastify = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
            target: 'pino-pretty'
        }
    }
});

// Initialize Socket.io directly
let io;

// Register cors
await fastify.register(fastifyCors, {
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    origin: true // Allow all origins for now
});

// Register WebSocket support
await fastify.register(fastifyWebsocket);

// Register MongoDB connector
await fastify.register(fastifyMongo, {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsuitex',
    forceClose: true,
});

// Register plugins 
fastify.register(userModelPlugin);
fastify.register(jobConfigPlugin);
fastify.register(portalCredentialPlugin);
fastify.register(jobApplicationModelPlugin);
await fastify.register(jobRunnerPlugin, {});



// Register JWT plugin for authentication
await fastify.register(import('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'supersecretkey',
    sign: {
        expiresIn: '7d'
    }
});

// JWT verification utility
fastify.decorate('authenticate', async (request, reply) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
});

// Serve static files for the frontend
await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../../client/dist'),
    prefix: '/' // Serve all files under the root
});

// Register API routes
await fastify.register(routes, { prefix: '/api/v1' });
// Register auth routes
await fastify.register(userRoutes, { prefix: '/api/v1' });
await fastify.register(jobConfigRoutes , { prefix: '/api/v1' });
await fastify.register(portalCredentialRoutes , { prefix: '/api/v1' });
await fastify.register(jobApplicationRoutes, { prefix: '/api/v1' });
// 


// Start the server
const start = async () => {
    try {
        // Get port from config or use default
        const port = process.env.PORT || config.server?.port || 3000;
        const host = process.env.HOST || config.server?.host || '0.0.0.0';

        await fastify.listen({ port, host });

        // Initialize Socket.io after the server is listening
        io = new SocketIOServer(fastify.server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        // Setup Socket.io handlers with the properly initialized io instance
        // setupSocketHandlers(io);

        fastify.log.info(`Server listening on ${host}:${port}`);
        fastify.log.info('Socket.io is ready');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

// Export start function and fastify instance
export { start, fastify };