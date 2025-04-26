import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'user-agents';

puppeteer.use(StealthPlugin());

const userAgent = new UserAgent();

class BrowserSingleton {
  constructor() {
    this.browser = null;
  }

  async getBrowser() {
    this.browser = await puppeteer.launch({
      headless: JSON.parse(process.env.BROWSER_HEADLESS),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--start-maximized',
      ],
      defaultViewport: null,
    });
    console.log('🚀 New isolated browser launched!');
    return this.browser;
  }

  async newPage() {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(userAgent.toString());
    await page.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 1080 + Math.floor(Math.random() * 100),
    });
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