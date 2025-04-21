import dotenv from 'dotenv';
import { GeminiBot } from '../../ai/GeminiBot.js';
import { notifyAll } from '../../../notifier/index.js';

dotenv.config();

export class NaukriJobAutomation {
    constructor(browser, jobConfig, fastify, user, credentials) {
        this.browser = browser;
        this.fastify = fastify;
        this.user = user;
        this.jobConfig = jobConfig;
        this.bot = null;
        this.credentials = {
            email: credentials.username || process.env.NAUKRI_USERNAME,
            password: credentials.password || process.env.NAUKRI_PASSWORD
        };
        this.maxPagesToScrape = parseInt(process.env.SCRAPE_PAGES || "5");
        this.sortBy = process.env.JOB_SHORT_BY || "Date";
    }

    async trainBot() {
        this.bot = await GeminiBot.getInstance();
        GeminiBot.trainBotOnSelfDescription(this.jobConfig.aiTraining.selfDescription);
    }

    async loginToNaukri(page) {
        await page.goto('https://www.naukri.com/', { waitUntil: 'networkidle2' });
        await page.click("a[title='Jobseeker Login']");
        await page.waitForSelector("input[type='text']");

        await page.type("input[type='text']", this.credentials.email, { delay: 150 });
        await page.type("input[type='password']", this.credentials.password, { delay: 150 });
        await page.click("button[type='submit']");
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }

    async searchJobs(page, keyword, experience, location) {
        await page.waitForSelector('.nI-gNb-sb__main', { visible: true });

        const keywordInput = await page.$("input.suggestor-input[placeholder='Enter keyword / designation / companies']");
        if (keywordInput) {
            await keywordInput.click({ clickCount: 3 });
            await page.keyboard.press('Backspace');
            await page.type("input.suggestor-input[placeholder='Enter keyword / designation / companies']", keyword, { delay: 100 });
        }

        const experienceInput = await page.$('input#experienceDD');
        if (experienceInput) {
            await experienceInput.click();
            await page.waitForSelector('.dropdownContainer .dropdownPrimary', { visible: true });
            const experienceOptions = await page.$$('.dropdownPrimary li');
            for (const option of experienceOptions) {
                const text = await page.evaluate(el => el.innerText.trim(), option);
                if (text === `${experience} years`) {
                    await option.click();
                    break;
                }
            }
        }

        const locationInput = await page.$("input.suggestor-input[placeholder='Enter location']");
        if (locationInput) {
            await locationInput.click({ clickCount: 3 });
            await page.keyboard.press('Backspace');
            await page.type("input.suggestor-input[placeholder='Enter location']", location, { delay: 100 });
        }

        const searchButton = await page.$('button.nI-gNb-sb__icon-wrapper');
        if (searchButton) {
            await searchButton.click();
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        const sortByButton = await page.$('button#filter-sort');
        if (sortByButton) {
            await sortByButton.click();
            await page.waitForSelector("ul[data-filter-id='sort']", { visible: true });
            console.log(`🔄 Sorting jobs by ${process.env.JOB_SHORT_BY}`);
            await new Promise(resolve => setTimeout(resolve, 3000)); const dateOption = await page.$(`li[title=${process.env.JOB_SHORT_BY}] a[data-id='filter-sort-f']`);
            if (dateOption) {
                await dateOption.click();
            }
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    filterJobs(jobs, prefs) {
        return jobs.filter(job => {
            // Location match
            const locationMatch = job.location.toLowerCase().includes(prefs.location.toLowerCase());

            // Experience match
            const expMatch = (() => {
                const match = job.experience.match(/(\d+)-?(\d+)?/);
                if (!match) return false;
                const min = parseInt(match[1], 10);
                const max = match[2] ? parseInt(match[2], 10) : min;
                return prefs.minExp >= min && prefs.maxExp <= max;
            })();

            // Skills match
            const skills = job.skills.map(s => s.toLowerCase());
            const skillMatch = prefs.requiredSkills.every(skill =>
                skills.some(s => s.includes(skill.toLowerCase()))
            );

            // Rating match
            const ratingMatch = (() => {
                const rating = parseFloat(job.rating);
                return !isNaN(rating) && rating >= prefs.minRating;
            })();

            // Company exclusion
            const companyExcluded = prefs.excludeCompanies && prefs.excludeCompanies.length > 0
                ? prefs.excludeCompanies.some(company =>
                    job.company.toLowerCase().includes(company.toLowerCase())
                )
                : false;

            // return locationMatch && skillMatch && ratingMatch && !companyExcluded;
            return true
        });
    }

    async scrapePaginatedJobs(page, baseUrl, preferences) {
        let allJobs = [];
        let pageNum = 1;

        while (true) {
            console.log(`📄 Scraping Page ${pageNum}`);
            await page.waitForSelector('.cust-job-tuple', { timeout: 5000 });

            const jobs = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.cust-job-tuple')).map(job => {
                    const titleEl = job.querySelector('h2 > a.title');
                    const companyEl = job.querySelector('a.comp-name');
                    const ratingEl = job.querySelector('a.rating .main-2');
                    const reviewsEl = job.querySelector('a.review');
                    const expEl = job.querySelector('.exp span[title]');
                    const salEl = job.querySelector('.sal span[title]');
                    const locEl = job.querySelector('.loc span[title]');
                    const descEl = job.querySelector('.job-desc');
                    const skillEls = job.querySelectorAll('ul.tags-gt li');
                    const postedOnEl = job.querySelector('.job-post-day');

                    return {
                        title: titleEl?.innerText.trim() || "",
                        applyLink: titleEl?.href || "",
                        company: companyEl?.innerText.trim() || "",
                        rating: ratingEl?.innerText.trim() || "",
                        reviews: reviewsEl?.innerText.trim() || "",
                        experience: expEl?.title?.trim() || "",
                        salary: salEl?.title?.trim() || "",
                        location: locEl?.title?.trim() || "",
                        description: descEl?.innerText.trim() || "",
                        skills: Array.from(skillEls).map(li => li.innerText.trim()),
                        postedOn: postedOnEl?.innerText.trim() || ""
                    };
                });
            });

            allJobs.push(...jobs);

            const hasNext = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a.styles_btn-secondary__2AsIP'));
                const next = anchors.find(a => a.innerText.trim() === 'Next' && !a.hasAttribute('disabled'));
                if (next) {
                    next.click();
                    return true;
                }
                return false;
            });

            if (!hasNext || pageNum >= this.maxPagesToScrape) {
                console.log('✅ All pages scraped or limit reached.');
                console.log('🚫 No more pages.');
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 3000)); // allow DOM to update
            pageNum++;
        }

        console.log(`✅ Scraped total ${allJobs.length} jobs`);
        console.log(`🔍 Filtering jobs based on preferences... with skills: ${preferences.requiredSkills}`);
        return this.filterJobs(allJobs, preferences);
    }

    async applyForJobs(jobs) {
        console.log(`🔄 Starting to apply for ${jobs.length} jobs`);
        const appliedJobs = [];

        for (const job of jobs) {
            console.log(`\n==================================`);
            console.log(`💼 Applying to: ${job.title} | ${job.company} Skills: ${job?.skills}`);
            console.log(`🔗 Apply link: ${job.applyLink}`);

            const jobPage = await this.browser.newPage();
            console.log(`📄 New page created for job application`);

            try {
                console.log(`🌐 Navigating to application URL...`);
                await jobPage.goto(job.applyLink, { waitUntil: 'networkidle2' });
                console.log(`✅ Page loaded successfully`);

                console.log(`🔍 Looking for apply button...`);
                const applyButtonExists = await jobPage.$('.apply-button') !== null;
                console.log(`🔍 Apply button exists: ${applyButtonExists}`);

                await jobPage.waitForSelector('.apply-button', { timeout: 5000 });
                console.log(`✅ Apply button found`);

                await jobPage.click('.apply-button');
                console.log(`👆 Clicked on apply button`);

                console.log(`⏳ Waiting for 3 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                console.log(`✅ Finished waiting`);

                console.log(`🔍 Checking for chatbot drawer...`);
                const chatDrawer = await jobPage.$('.chatbot_DrawerContentWrapper');
                console.log(`🔍 Chatbot drawer exists: ${chatDrawer !== null}`);

                if (chatDrawer) {
                    console.log("💬 Chatbot detected, starting chat form handling...");
                    let appliedJobPage = await this.handleChatForm(jobPage);
                    console.log(`✅ Returned from handleChatForm function`);

                    console.log(`🔍 Checking for success message...`);
                    const success = await appliedJobPage.evaluate(() => {
                        const elements = Array.from(document.querySelectorAll('body *'));
                        console.log(`Found ${elements.length} elements to search through`);

                        const msg = elements.find(el => {
                            const text = el.innerText || '';
                            return text.includes('You have successfully applied to');
                        });

                        return msg?.innerText || null;
                    });

                    console.log(`🔍 Success message found: ${success !== null}`);

                    if (success) {
                        console.log(`📣 Creating notification for job: ${job.title}`);
                        notifyAll(this.createNotification(job));
                        console.log(`✅ ${success}`);

                        // Save successful application to MongoDB
                        await this.saveJobApplication(job);
                        appliedJobs.push(job);
                    } else {
                        console.log(`⚠️ No success message found after chatbot interaction`);
                    }
                } else {
                    console.log(`💬 No chatbot found, checking for direct success message...`);
                    console.log(`⏳ Waiting for 4 seconds for page to update...`);
                    await new Promise(resolve => setTimeout(resolve, 4000));
                    console.log(`✅ Finished waiting`);

                    console.log(`🔍 Checking for success message on regular page...`);
                    const success = await jobPage.evaluate(() => {
                        const elements = Array.from(document.querySelectorAll('body *'));
                        console.log(`Found ${elements.length} elements to search through`);

                        const msg = elements.find(el => {
                            const text = el.innerText || '';
                            return text.includes('You have successfully applied to');
                        });

                        return msg?.innerText || null;
                    });

                    console.log(`🔍 Success message found: ${success !== null}`);

                    if (success) {
                        console.log(`📣 Creating notification for job: ${job.title}`);
                        notifyAll(this.createNotification(job));
                        console.log(`✅ ${success}`);

                        // Save successful application to MongoDB
                        await this.saveJobApplication(job);
                        appliedJobs.push(job);
                    }
                    else console.log("🤷 Unknown apply result - no success message detected");
                }

            } catch (err) {
                console.log(`❌ Couldn't apply: ${err.message}`);
                console.log(`📚 Error stack: ${err.stack}`);
            }

            console.log(`🔒 Closing job page`);
            await jobPage.close();
            console.log(`✅ Job page closed`);
        }
        console.log(`🏁 Finished applying to all jobs. Successfully applied to ${appliedJobs.length} jobs.`);
        return appliedJobs;
    }

    async saveJobApplication(job) {
        try {
            console.log(`💾 Saving job application to database: ${job.title} at ${job.company}`);

            const jobData = {
                title: job.title,
                company: job.company,
                location: job.location || 'N/A',
                experience: job.experience || 'N/A',
                salary: job.salary || 'N/A',
                rating: job.rating || 'N/A',
                reviews: job.reviews || 'No',
                postedOn: job.postedOn || 'N/A',
                description: job.description || 'No description available',
                skills: job.skills || [],
                applyLink: job.applyLink || 'N/A',
                portal: 'Naukri', // Setting the portal as Naukri
                userId: this.user._id.toString(), // Using the user ID from the constructor
                status: 'Applied',
                notes: `Applied via automation on ${new Date().toLocaleString()}`,
                applicationId: `NK-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase()
            };

            // Check if the fastify instance has the jobApplicationModel decorator
            if (this.fastify && this.fastify.jobApplicationModel) {
                const result = await this.fastify.jobApplicationModel.create(jobData);
                console.log(`✅ Job application saved to database with ID: ${result.insertedId}`);
                return result.insertedId;
            } else {
                console.warn(`⚠️ No jobApplicationModel found on fastify instance, saving directly to collection`);
                // Fallback: save directly to the MongoDB collection if plugin is not registered
                const result = await this.fastify.mongo.db.collection('jobApplications').insertOne({
                    ...jobData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log(`✅ Job application saved to database with ID: ${result.insertedId}`);
                return result.insertedId;
            }
        } catch (error) {
            console.error(`❌ Error saving job application to database:`, error);
            throw error;
        }
    }

    async handleChatForm(page) {
        console.log(`🤖 Starting handleChatForm function`);
        try {
            console.log(`🔍 Waiting for chatbot drawer...`);
            await page.waitForSelector('.chatbot_DrawerContentWrapper', { timeout: 3000 });
            console.log(`✅ Chatbot drawer found`);

            let attempt = 0;
            const max = 10;
            console.log(`⚙️ Will attempt to handle up to ${max} chat interactions`);

            while (true) {
                console.log(`\n🔄 Chat attempt ${attempt + 1}/${max}`);

                // Check if chatbot is still present
                const chatbotExists = await page.$('.chatbot_DrawerContentWrapper') !== null;
                console.log(`🔍 Chatbot still exists: ${chatbotExists}`);

                if (!chatbotExists || attempt >= max) {
                    console.log(`⏹️ Breaking chat loop: chatbotExists=${chatbotExists}, attempt=${attempt}, max=${max}`);
                    break;
                }

                // Get the current question
                console.log(`🔍 Retrieving latest bot question...`);
                const question = await page.evaluate(() => {
                    const items = Array.from(document.querySelectorAll('.chatbot_ListItem'));
                    console.log(`Found ${items.length} chat items`);

                    if (items.length === 0) return null;

                    const last = items[items.length - 1];
                    const span = last?.querySelector('.botMsg span');
                    return span?.innerText?.trim() || null;
                });

                console.log(`🔍 Question found: ${question !== null}`);
                if (!question) {
                    console.log(`⚠️ No question found, breaking loop`);
                    break;
                }

                console.log(`🤖 Bot asks: ${question}`);

                // Check for radio buttons
                console.log(`🔍 Checking for radio buttons...`);
                const radioBtns = await page.$$('.ssrc__radio-btn-container');
                console.log(`🔍 Found ${radioBtns.length} radio buttons`);

                if (radioBtns.length > 0) {
                    console.log(`🔘 Processing radio button options...`);
                    const optionLabels = [];

                    for (let i = 0; i < radioBtns.length; i++) {
                        const btn = radioBtns[i];
                        const label = await btn.$('label');

                        if (!label) {
                            console.log(`⚠️ No label found for radio button ${i + 1}`);
                            continue;
                        }

                        const labelText = await page.evaluate(el => el.innerText.trim(), label);
                        optionLabels.push(labelText);
                        console.log(`🔘 Option ${i + 1}: "${labelText}"`);
                    }

                    console.log(`🧠 Asking bot for choice among ${optionLabels.length} options...`);
                    const answer = await this.bot.askOneLine(question, optionLabels);
                    console.log(`🎯 Bot chose: "${answer}"`);

                    let clicked = false;
                    for (let i = 0; i < optionLabels.length; i++) {
                        console.log(`🔍 Comparing "${optionLabels[i].toLowerCase()}" with "${answer.toLowerCase()}"`);

                        if (optionLabels[i].toLowerCase() === answer.toLowerCase()) {
                            console.log(`✅ Match found at option ${i + 1}`);
                            const label = await radioBtns[i].$('label');

                            if (label) {
                                console.log(`👆 Clicking on option: "${optionLabels[i]}"`);
                                await label.click();
                                clicked = true;
                                console.log(`✅ Clicked radio: ${optionLabels[i]}`);
                                break;
                            } else {
                                console.log(`⚠️ Label element not found for matched option`);
                            }
                        }
                    }

                    if (!clicked) {
                        console.log(`❌ No match found. Selecting first option instead.`);
                        const firstLabel = await radioBtns[0].$('label');

                        if (firstLabel) {
                            await firstLabel.click();
                            console.log(`✅ Clicked first radio option as fallback`);
                        } else {
                            console.log(`⚠️ Could not find first label element`);
                        }
                    }

                    // Check for Save button
                    console.log(`🔍 Looking for save button...`);
                    const saveBtn = await page.$('.sendMsg');
                    console.log(`🔍 Save button exists: ${saveBtn !== null}`);

                    if (saveBtn) {
                        console.log(`👆 Clicking save button...`);
                        await saveBtn.click();
                        console.log('📩 Clicked Save after selecting radio');
                    } else {
                        console.log(`⚠️ No save button found after radio selection`);
                    }
                }
                // Check for checkboxes
                else if (await page.$('input[type="checkbox"]')) {
                    console.log(`✓ Checkbox detected`);
                    const checkbox = await page.$('input[type="checkbox"]');

                    if (checkbox) {
                        console.log(`👆 Clicking checkbox...`);
                        await checkbox.click();
                        console.log('✅ Checkbox selected');
                    } else {
                        console.log(`⚠️ Checkbox disappeared before clicking`);
                    }
                }
                // Handle text input
                else {
                    console.log(`📝 Text input required, asking bot for response...`);
                    const answer = await this.bot.ask(question);
                    console.log(`💬 Bot (text): ${answer}`);

                    console.log(`🔍 Looking for contenteditable div...`);
                    const inputExists = await page.$('div[contenteditable="true"]') !== null;
                    console.log(`🔍 Contenteditable div exists: ${inputExists}`);

                    if (!inputExists) {
                        console.log(`⚠️ No contenteditable div found for text input`);
                    }

                    console.log(`📝 Setting text value...`);
                    await page.evaluate((val) => {
                        const input = document.querySelector('div[contenteditable="true"]');
                        if (input) {
                            console.log(`✅ Found contenteditable element, setting text`);
                            input.innerText = val;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            return true;
                        } else {
                            console.log(`❌ Could not find contenteditable element`);
                            return false;
                        }
                    }, answer);

                    console.log(`⌨️ Pressing Enter key...`);
                    await page.keyboard.press('Enter');
                    console.log(`✅ Enter key pressed`);
                }

                attempt++;
                console.log(`⏳ Waiting 3 seconds for chatbot to process...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                console.log(`✅ Finished waiting`);
            }

            console.log("✅ Chatbot interaction completed");
            console.log(`⏳ Waiting 10 seconds for final page load...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            console.log(`✅ Finished waiting`);

            return page;
        } catch (e) {
            console.log("⚠️ Chatbot handling failed:", e.message);
            console.log(`📚 Error stack: ${e.stack}`);
            return page; // Return the page even if an error occurred
        }
    }

    createNotification(job) {
        return `📢 *Job Applied Successfully!*

🔹 *Position:* ${job.title}
🏢 *Company:* ${job.company}
📍 *Location:* ${job.location || 'N/A'}
🧠 *Experience:* ${job.experience || 'N/A'}
💰 *Salary:* ${job.salary || 'N/A'}
⭐ *Rating:* ${job.rating || 'N/A'} (${job.reviews || 'No'} reviews)
📅 *Posted On:* ${job.postedOn || 'N/A'}
🌐 *Portal:* Naukri
👤 *User:* ${this.user.firstName} ${this.user.lastName}

📝 *Description:* ${job.description || 'No description available'}

🛠️ *Skills:* ${job.skills && job.skills.length ? job.skills.join(', ') : 'N/A'}

🔗 *Apply Link:* ${job.applyLink || 'N/A'}

🟢 Please wait while we track the application status.`;
    }

    async start() {
        try {
            this.trainBot();
            const page = await this.browser.newPage();

            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );

            console.log(`🔑 Logging in to Naukri.com with account: ${this.credentials.email}`);
            await this.loginToNaukri(page);
            console.log(`🔑 Logged in successfully`);
            // Extract search parameters from job config
            const { keywords, experience, location } = this.jobConfig.searchConfig;
            console.log(`🔍 Searching for: ${keywords} in ${location} (Exp: ${experience} yrs)`);

            await this.searchJobs(page, keywords, experience, location);

            const currentUrl = page.url();

            // Create user preferences from job config
            const userPrefs = {
                location,
                minExp: Number(experience),
                maxExp: Number(experience) + 2,
                requiredSkills: Array.isArray(this.jobConfig.filterConfig.requiredSkills)
                    ? this.jobConfig.filterConfig.requiredSkills
                    : keywords.split(',').map(skill => skill.trim()),
                excludeCompanies: this.jobConfig.filterConfig.excludeCompanies || [],
                minRating: this.jobConfig.filterConfig.minRating || 3.5
            };

            const jobs = await this.scrapePaginatedJobs(page, currentUrl, userPrefs);

            let appliedJobs = [];
            if (jobs.length === 0) {
                console.log('No jobs found for the given criteria');
            } else {
                console.log(`Found ${jobs.length} jobs matching criteria`);
                console.log('Applying for jobs...');
                appliedJobs = await this.applyForJobs(jobs);
            }

            // Update job config with last run details
            if (this.jobConfig.schedule) {
                this.jobConfig.schedule.lastRun = new Date();

                // Calculate next run based on frequency
                if (this.jobConfig.schedule.frequency === 'daily') {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    this.jobConfig.schedule.nextRun = tomorrow;
                } else if (this.jobConfig.schedule.frequency === 'weekly') {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    this.jobConfig.schedule.nextRun = nextWeek;
                }

                // Save updated job config to database
                if (this.fastify && this.fastify.mongo) {
                    try {
                        const result = await this.fastify.mongo.db.collection('jobConfigs').updateOne(
                            { _id: this.jobConfig._id },
                            {
                                $set: {
                                    'schedule.lastRun': this.jobConfig.schedule.lastRun,
                                    'schedule.nextRun': this.jobConfig.schedule.nextRun,
                                    'lastRunStats': {
                                        jobsFound: jobs.length,
                                        jobsApplied: appliedJobs.length,
                                        timestamp: new Date()
                                    }
                                }
                            }
                        );
                        console.log(`✅ Job config updated in database: ${result.modifiedCount} document modified`);
                    } catch (dbError) {
                        console.error(`❌ Error updating job config:`, dbError);
                    }
                }

                console.log(`✅ Job automation completed. Next run scheduled for: ${this.jobConfig.schedule.nextRun}`);
            }

            await page.close();
            await this.browser.closeBrowser();

            return {
                success: true,
                message: `Job search completed. Found ${jobs.length} matching jobs, applied to ${appliedJobs.length}.`,
                jobsFound: jobs.length,
                jobsApplied: appliedJobs.length
            };
        } catch (err) {
            console.error('Error during automation:', err);
            return {
                success: false,
                message: `Error during automation: ${err.message}`,
                error: err
            };
        }
    }
}