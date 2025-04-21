import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const COOKIE_PATH = './cache/glassdoor_cookies.json';

export async function loginToGlassdoor(page) {
  if (fs.existsSync(COOKIE_PATH)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIE_PATH, 'utf8'));
    await page.setCookie(...cookies);
    await page.goto('https://www.glassdoor.co.in/index.htm', { waitUntil: 'networkidle2' });

    if (page.url().includes('Community/index.htm')) {
      console.log('🎉 Already logged in!');
      return;
    }

    console.log('⚠️ Session expired. Re-logging in...');
    fs.unlinkSync(COOKIE_PATH);
  }
  await new Promise(resolve => setTimeout(resolve, 3000));

  await page.goto('https://www.glassdoor.co.in/index.htm', { waitUntil: 'networkidle2' });

  // Step 2: Wait for email input
  await page.waitForSelector('#inlineUserEmail');
  await page.type('#inlineUserEmail', process.env.NAUKRI_EMAIL, { delay: 100 });

  // Step 3: Continue with email
  await page.click('button[data-test="email-form-button"]');

  // Step 4: Wait for password field and enter it
  await page.waitForSelector('input#inlineUserPassword', { timeout: 8000 });
  await page.type('input#inlineUserPassword', process.env.NAUKRI_PASSWORD, { delay: 100 });

  // Step 5: Final Sign In
  await Promise.all([
    page.click("button[type='submit']"),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  // Save cookies
  const cookies = await page.cookies();
  fs.mkdirSync(path.dirname(COOKIE_PATH), { recursive: true });
  fs.writeFileSync(COOKIE_PATH, JSON.stringify(cookies));
  console.log('✅ Logged in & cookies saved for Glassdoor.');
}


export async function searchGlassdoorJobs(page, keyword, location) {
  try {
    console.log(`[INFO] Navigating to Glassdoor job search page`);
    await page.goto('https://www.glassdoor.co.in/Job/index.htm', { waitUntil: 'networkidle2' });

    console.log(`[INFO] Waiting for job search inputs to load`);
    await page.waitForSelector('#searchBar-jobTitle', { visible: true });
    await page.waitForSelector('#searchBar-location', { visible: true });

    console.log(`[INFO] Typing keyword: ${keyword}`);
    const keywordInput = await page.$('#searchBar-jobTitle');
    await keywordInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await keywordInput.type(keyword, { delay: 100 });

    console.log(`[INFO] Typing location: ${location}`);
    const locationInput = await page.$('#searchBar-location');
    await locationInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await locationInput.type(location, { delay: 100 });

    console.log(`[INFO] Pressing Enter to search`);
    await page.keyboard.press('Enter');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log(`[INFO] Checking for job alert modal close button`);
    const closeButton = await page.$('button[data-test="job-alert-modal-close"]');
    if (closeButton) {
      console.log(`[INFO] Job alert modal found. Closing it.`);
      await closeButton.click();
    }


    console.log(`[INFO] Sorting jobs by 'Most recent'`);
    await page.waitForSelector('button[data-test="sortBy"]', { visible: true });
    await page.click('button[data-test="sortBy"]');

    await page.waitForSelector('ul.ChoiceList_choiceList__6GYUz', { visible: true });

    const buttons = await page.$$('ul.ChoiceList_choiceList__6GYUz > li > button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.innerText.trim().toLowerCase(), btn);
      if (text.includes('most recent')) {
        await btn.focus(); // ensure it's in focus
        await btn.click({ delay: 100 });
        console.log(`[SUCCESS] 'Most recent' selected`);
        break;
      }
    }

    console.log(`[INFO] Scraping job listings`);
    await page.waitForSelector('ul.JobsList_jobsList__lqjTr > li[data-test="jobListing"]', { visible: true });

    const jobs = (await page.$$eval('ul.JobsList_jobsList__lqjTr > li[data-test="jobListing"]', jobCards => {
      return jobCards.map(card => {
        const title = card.querySelector('[data-test="job-title"]')?.innerText?.trim() || '';
        const company = card.querySelector('.EmployerProfile_compactEmployerName__9MGcV')?.innerText?.trim() || '';
        const location = card.querySelector('[data-test="emp-location"]')?.innerText?.trim() || '';
        const salary = card.querySelector('[data-test="detailSalary"]')?.innerText?.trim() || '';
        const posted = card.querySelector('[data-test="job-age"]')?.innerText?.trim() || '';
        const link = card.querySelector('[data-test="job-title"]')?.href || '';
        const easyApply = card.innerText.toLowerCase().includes('easy apply');

        return easyApply
          ? { title, company, location, salary, posted, link, easyApply }
          : null;
      });
    })).filter(Boolean); // 🚀 Removes null/undefined

    console.log(`[SUCCESS] Scraped ${jobs.length} job(s)`);
    return jobs;
  } catch (error) {
    console.error(`[ERROR] searchGlassdoorJobs: ${error.message}`);
  }
}

export async function applyForJobs(browser, jobs) {
  const page = await browser.newPage();

  for (const job of jobs) {
    console.log(`\n[INFO] Navigating to job: ${job.title} → ${job.link}`);

    try {
      await page.goto(job.link, { waitUntil: 'networkidle2' });
      await handleEasyApply(browser, page);
      console.log(`[SUCCESS] Applied to: ${job.title}`);
    } catch (err) {
      console.error(`[ERROR] Failed to apply to ${job.title}: ${err.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  await page.close();
}

async function handleEasyApply(browser, page) {
  console.log(`[INFO] Waiting for Easy Apply button`);
  await page.waitForSelector('button[data-test="easyApply"]', { visible: true, timeout: 5000 });

  const [newPagePromise] = await Promise.all([
    new Promise(resolve => browser.once('targetcreated', target => resolve(target.page()))),
    page.click('button[data-test="easyApply"]'),
  ]);

  const applyPage = await newPagePromise;
  await applyPage.bringToFront();

  await new Promise(resolve => setTimeout(resolve, 3000));
  await fillContactForm(applyPage);
  await new Promise(resolve => setTimeout(resolve, 5000));
  await clickFirstVisibleContinue(applyPage);
  await new Promise(resolve => setTimeout(resolve, 3000));
  await handleResumeStep(applyPage);
  await new Promise(resolve => setTimeout(resolve, 3000));
  await applyPage.close();
}

async function fillContactForm(applyPage) {
  console.log(`[INFO] Filling Easy Apply form`);

  await fillIfEmpty(applyPage, 'input[name="firstName"]', 'Amol');
  await fillIfEmpty(applyPage, 'input[name="lastName"]', 'Magar');
  await fillIfEmpty(applyPage, 'input[name="email"]', 'amolmagar.connect@gmail.com');
  await fillIfEmpty(applyPage, 'input[name="phoneNumber"]', '9730989996');
  await fillIfEmpty(applyPage, 'input[name="location.city"]', 'Pune');

  await clickFirstVisibleContinue(applyPage);

}

async function fillIfEmpty(page, selector, value) {
  const input = await page.$(selector);
  if (input) {
    const val = await page.evaluate(el => el.value, input);
    if (!val.trim()) {
      await input.click({ clickCount: 3 });
      await input.press('Backspace');
      await input.type(value, { delay: 100 });
    }
  }
}

async function clickFirstVisibleContinue(page) {
  console.log(`[INFO] Clicking first visible 'Continue' button`);
  const buttons = await page.$$('[data-testid="continue-button"]');

  for (const btn of buttons) {
    const isVisible = await page.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
    }, btn);

    if (isVisible) {
      await btn.click();
      console.log(`[CLICKED] First visible 'Continue' button`);
      return;
    }
  }

  console.warn(`[WARN] No visible 'Continue' button found`);
}

async function handleResumeStep(page) {
  console.log(`[INFO] Handling resume selection step`);

  const cardSelector = '[data-testid="FileResumeCard"]';
  await page.waitForSelector(cardSelector, { timeout: 10000 });
  await page.screenshot({ path: 'resume_step_debug.png' });

  const cards = await page.$$(cardSelector);
  console.log(`[DEBUG] Found ${cards.length} resume card(s)`);

  for (const [index, card] of cards.entries()) {
    const box = await card.boundingBox();
    const isVisible = box !== null && box.width > 0 && box.height > 0;

    console.log(`[DEBUG] Card ${index + 1}: bounding box = ${JSON.stringify(box)}, visible = ${isVisible}`);

    if (isVisible) {
      await card.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await new Promise(resolve => setTimeout(resolve, 3000));
      await card.click({ delay: 100 });
      console.log(`[CLICKED] Selected resume card #${index + 1}`);
      break;
    }
  }

  await page.screenshot({ path: 'resume_step_post_click.png' });
  console.log(`[DEBUG] Screenshot taken after click attempt: resume_step_post_click.png`);

  await clickFirstVisibleContinue(page);
  // we have to skip the optional part so wait for new form completion
  await new Promise(resolve => setTimeout(resolve, 3000));
  await clickFirstVisibleContinue(page);

  await new Promise(resolve => setTimeout(resolve, 3000));
  await clickFirstVisibleContinue(page);

  // here will be next stape
  await new Promise(resolve => setTimeout(resolve, 3000));
  await handleFinalSubmit(page)
  await new Promise(resolve => setTimeout(resolve, 3000));

}

async function handleFinalSubmit(page) {
  const submitSelector = 'button.ia-continueButton span:text("Submit your application")';

  console.log('[INFO] Waiting for final submit button');
  await page.waitForSelector('button.ia-continueButton', { timeout: 10000 });

  const buttons = await page.$$('button.ia-continueButton');
  for (const [i, btn] of buttons.entries()) {
    const text = await btn.evaluate(el => el.textContent?.trim());
    if (text === 'Submit your application') {
      const box = await btn.boundingBox();
      const isVisible = box !== null && box.width > 0 && box.height > 0;

      console.log(`[DEBUG] Submit Button #${i + 1}: bounding box = ${JSON.stringify(box)}, visible = ${isVisible}`);

      if (isVisible) {
        await btn.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        await page.waitForTimeout(300);
        await btn.click({ delay: 100 });
        console.log('[CLICKED] Final Submit button');
        return;
      }
    }
  }

  console.error('[ERROR] Final Submit button not found or not visible');
}