import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'user-agents'; // For rotating user agents

puppeteer.use(StealthPlugin());

const userAgent = new UserAgent();

class BrowserSingleton {
  constructor() {
    if (!BrowserSingleton.instance) {
      this.browser = null;
      BrowserSingleton.instance = this;
    }
    return BrowserSingleton.instance;
  }

  async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: JSON.parse(process.env.BROWSER_HEADLESS),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--start-maximized',
          '--incognito',
        ],
        defaultViewport: null,
      });
      console.log('🚀Browser Launched!');
    }
    return this.browser;
  }

  async newPage() {
    const page = await this.browser.newPage();
    await page.setUserAgent(userAgent.toString()); // Set a realistic user agent
    await page.setViewport({ width: 1920 + Math.floor(Math.random() * 100), height: 1080 + Math.floor(Math.random() * 100) }); // Slightly randomized viewport
    return page;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser Closed!');
      this.browser = null;
    }
  }
}

const browserInstance = new BrowserSingleton();
export default browserInstance;

// Example usage in your automation logic:
// const browser = await browserInstance.getBrowser();
// const page = await browserInstance.newPage();
// await page.goto('https://www.example-job-portal.com');
// await page.waitForTimeout(Math.random() * 1000 + 500); // Simulate thinking time
// await page.type('#job-title', 'Software Engineer', { delay: Math.random() * 100 + 50 });
// // ... more interactions with random delays and potentially mouse movements/scrolling
// await page.close(); // Close the page when done