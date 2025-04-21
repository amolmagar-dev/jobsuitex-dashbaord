import browserInstance from '../../browser/browser.js';
const browser = await browserInstance.getBrowser();
import dotenv from 'dotenv';
import {
  loginToNaukri,
  applyForJobs,
  searchJobs,
  scrapePaginatedJobs,
  downloadResume
} from './action.js';
import { isBotTrained } from './helper.js';

dotenv.config();


// Dynamic keyword list
const searchConfigs = [
  { keyword: process.env.JOB_KEYWORDS, exp: process.env.JOB_EXPERIENCE, location: process.env.JOB_LOCATION },
];

export async function startNaukriAutomation() {
    try {
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await loginToNaukri(page);

      // Check if the bot is trained
      const isTrained = isBotTrained()
      if (!isTrained) {        // download the resume
        console.log('📥 Downloading resume...');
        await downloadResume(page);
      }

      // Pick dynamic config
      const { keyword, exp, location } = searchConfigs;
      console.log(`🔍 Searching for: ${keyword} in ${location} (Exp: ${exp} yrs)`);

      await searchJobs(page, keyword, exp, location);

      const currentUrl = page.url();

      const userPrefs = {
        location,
        minExp: Number(exp),
        maxExp: Number(exp) + 2,
        requiredSkills: keyword.split(',').map(skill => skill.trim()),
        minRating: 3.5
      };

      const jobs = await scrapePaginatedJobs(page, currentUrl, userPrefs);
      if (jobs.length === 0) {
        console.log('No jobs found for the given criteria');
      } else {
        console.log(`Found ${jobs.length} jobs matching criteria`);
        console.log('Applying for jobs...');
        await applyForJobs(browser, jobs);
      }

      await page.close();

      // Move to next config or loop back to start
    } catch (err) {
      console.error('Error during automation loop:', err);
    }
}

export const trainYourBot = async ({username , password}, fastify ) => { 
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  await loginToNaukri(page);

  await downloadResume(page);
}
