/**
 * Main entry point for the browser automation monitoring system
 */
import { config } from 'dotenv';
import { start } from './src/server/index.js';

// Load environment variables
config();

// Start the server
start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});