/**
 * Configuration for the server component
 */
const serverConfig = {
  // Server settings
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',

  // Socket.io settings
  socket: {
    pingInterval: 10000,
    pingTimeout: 5000,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  },

  // Browser streaming settings
  streaming: {
    frameRate: 25,    // Target frames per second
    quality: 80,      // JPEG quality (0-100)
    maxWidth: 1280,   // Max screenshot width
    maxHeight: 720    // Max screenshot height
  }
};

export default serverConfig;