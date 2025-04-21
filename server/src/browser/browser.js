import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

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
        headless: JSON.parse(process.env.BROWSER_HEADLESS), // Set to true for production
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--start-maximized',
          '--incognito'
        ],
        defaultViewport: null,
      });
      console.log('🚀Browser Launched!');
    }
    return this.browser;
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