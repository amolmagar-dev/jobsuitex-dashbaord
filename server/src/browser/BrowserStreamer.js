import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import logger from '../utils/logger.js';

puppeteer.use(StealthPlugin());

class BrowserSingleton {
    constructor() {
        if (!BrowserSingleton.instance) {
            this.browser = null;
            this.streamingSessions = new Map(); // Track active streaming sessions by sessionId
            this.streamingIntervals = new Map(); // Track interval timers for streaming
            BrowserSingleton.instance = this;
        }
        return BrowserSingleton.instance;
    }

    async getBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: JSON.parse(process.env.BROWSER_HEADLESS), // Set to true for production
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--start-maximized',
                ],
                defaultViewport: null,
            });
            logger.info('🚀Browser Launched!');

            // Handle browser disconnection
            this.browser.on('disconnected', () => {
                logger.warn('Browser disconnected unexpectedly');
                this.browser = null;
                this.stopAllStreaming();
            });
        }
        return this.browser;
    }

    async closeBrowser() {
        // Stop all streaming sessions first
        this.stopAllStreaming();

        if (this.browser) {
            await this.browser.close();
            logger.info('✅ Browser Closed!');
            this.browser = null;
        }
    }

    /**
     * Start streaming a page to a Socket.io client
     * @param {string} sessionId - Unique ID for this streaming session (usually socket.id)
     * @param {Page} page - Puppeteer page to stream
     * @param {Function} emitFrame - Function to emit frame data (emitFrame(frameData))
     * @param {Object} options - Streaming options
     * @returns {Promise<boolean>} Success status
     */
    async startStreaming(sessionId, page, emitFrame, options = {}) {
        if (this.streamingSessions.has(sessionId)) {
            logger.warn(`Streaming session ${sessionId} already exists`);
            return false;
        }

        if (!page) {
            logger.error('Cannot start streaming: No page provided');
            return false;
        }

        // Default options
        const streamingOptions = {
            frameRate: options.frameRate || 25,
            quality: options.quality || 80,
            maxWidth: options.maxWidth || 1280,
            maxHeight: options.maxHeight || 720,
        };

        // Store session info
        this.streamingSessions.set(sessionId, {
            page,
            options: streamingOptions,
            startTime: Date.now(),
            frameCount: 0
        });

        logger.info(`Starting streaming session ${sessionId} at ${streamingOptions.frameRate}fps`);

        // Calculate interval based on frame rate
        const interval = Math.floor(1000 / streamingOptions.frameRate);

        // Set up interval to capture and send frames
        const intervalId = setInterval(async () => {
            try {
                if (!this.streamingSessions.has(sessionId)) {
                    this.stopStreaming(sessionId);
                    return;
                }

                const sessionInfo = this.streamingSessions.get(sessionId);

                // Take screenshot
                const screenshot = await sessionInfo.page.screenshot({
                    type: 'jpeg',
                    quality: sessionInfo.options.quality,
                    encoding: 'base64',
                    clip: {
                        x: 0,
                        y: 0,
                        width: sessionInfo.options.maxWidth,
                        height: sessionInfo.options.maxHeight
                    }
                });

                // Update frame count
                sessionInfo.frameCount++;

                // Calculate actual FPS
                const elapsedTime = (Date.now() - sessionInfo.startTime) / 1000;
                const actualFps = sessionInfo.frameCount / elapsedTime;

                // Emit the frame with metadata
                emitFrame({
                    image: `data:image/jpeg;base64,${screenshot}`,
                    timestamp: Date.now(),
                    sessionId,
                    frameNumber: sessionInfo.frameCount,
                    fps: actualFps.toFixed(1)
                });
            } catch (error) {
                logger.error(`Error in streaming session ${sessionId}:`, error);
                this.stopStreaming(sessionId);
            }
        }, interval);

        // Store interval ID for cleanup
        this.streamingIntervals.set(sessionId, intervalId);

        return true;
    }

    /**
     * Stop a specific streaming session
     * @param {string} sessionId - ID of the session to stop
     */
    stopStreaming(sessionId) {
        // Clear the interval
        if (this.streamingIntervals.has(sessionId)) {
            clearInterval(this.streamingIntervals.get(sessionId));
            this.streamingIntervals.delete(sessionId);
        }

        // Remove session data
        if (this.streamingSessions.has(sessionId)) {
            const sessionInfo = this.streamingSessions.get(sessionId);
            logger.info(`Stopped streaming session ${sessionId} after ${sessionInfo.frameCount} frames`);
            this.streamingSessions.delete(sessionId);
        }
    }

    /**
     * Stop all active streaming sessions
     */
    stopAllStreaming() {
        // Stop all intervals
        for (const [sessionId, intervalId] of this.streamingIntervals.entries()) {
            clearInterval(intervalId);
            logger.info(`Stopped streaming session ${sessionId}`);
        }

        // Clear all tracking maps
        this.streamingIntervals.clear();
        this.streamingSessions.clear();
        logger.info('All streaming sessions stopped');
    }

    /**
     * Get information about active streaming sessions
     * @returns {Array} Array of session info objects
     */
    getStreamingStats() {
        const stats = [];

        for (const [sessionId, sessionInfo] of this.streamingSessions.entries()) {
            const elapsedTime = (Date.now() - sessionInfo.startTime) / 1000;
            const actualFps = sessionInfo.frameCount / elapsedTime;

            stats.push({
                sessionId,
                frameCount: sessionInfo.frameCount,
                duration: elapsedTime.toFixed(1),
                fps: actualFps.toFixed(1),
                targetFps: sessionInfo.options.frameRate,
                quality: sessionInfo.options.quality,
                resolution: `${sessionInfo.options.maxWidth}x${sessionInfo.options.maxHeight}`
            });
        }

        return stats;
    }
}

const browserInstance = new BrowserSingleton();
export default browserInstance;