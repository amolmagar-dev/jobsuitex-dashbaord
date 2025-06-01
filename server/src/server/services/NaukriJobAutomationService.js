import dotenv from "dotenv";
import { GeminiBot } from "../../ai/GeminiBot.js";
import { notifyAll } from "../../../notifier/index.js";
import logger from "../../utils/logger.js";

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
      password: credentials.password || process.env.NAUKRI_PASSWORD,
    };
    this.maxPagesToScrape = parseInt(process.env.SCRAPE_PAGES || "5");
    this.sortBy = process.env.JOB_SHORT_BY || "Date";
  }

  async loginToNaukri(page) {
    await page.goto("https://www.naukri.com/", { waitUntil: "networkidle2" });
    await page.click("a[title='Jobseeker Login']");
    await page.waitForSelector("input[type='text']");

    await page.type("input[type='text']", this.credentials.email, { delay: 150 });
    await page.type("input[type='password']", this.credentials.password, { delay: 150 });
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle2" });
  }

  async searchJobs(page, keyword, experience, location) {
    await page.waitForSelector(".nI-gNb-sb__main", { visible: true });

    const keywordInput = await page.$("input.suggestor-input[placeholder='Enter keyword / designation / companies']");
    if (keywordInput) {
      await keywordInput.click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.type("input.suggestor-input[placeholder='Enter keyword / designation / companies']", keyword, {
        delay: 100,
      });
    }

    const experienceInput = await page.$("input#experienceDD");
    if (experienceInput) {
      await experienceInput.click();
      await page.waitForSelector(".dropdownContainer .dropdownPrimary", { visible: true });
      const experienceOptions = await page.$$(".dropdownPrimary li");
      for (const option of experienceOptions) {
        const text = await page.evaluate((el) => el.innerText.trim(), option);
        if (text === `${experience} years`) {
          await option.click();
          break;
        }
      }
    }

    const locationInput = await page.$("input.suggestor-input[placeholder='Enter location']");
    if (locationInput) {
      await locationInput.click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.type("input.suggestor-input[placeholder='Enter location']", location, { delay: 100 });
    }

    const searchButton = await page.$("button.nI-gNb-sb__icon-wrapper");
    if (searchButton) {
      await searchButton.click();
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
    const sortByButton = await page.$("button#filter-sort");
    if (sortByButton) {
      await sortByButton.click();
      await page.waitForSelector("ul[data-filter-id='sort']", { visible: true });
      logger.info(`🔄 Sorting jobs by ${process.env.JOB_SHORT_BY}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const dateOption = await page.$(`li[title=${process.env.JOB_SHORT_BY}] a[data-id='filter-sort-f']`);
      if (dateOption) {
        await dateOption.click();
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  filterJobs(jobs, prefs) {
    return jobs.filter((job) => {
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
      const skills = job.skills.map((s) => s.toLowerCase());

      const skillMatch = prefs.requiredSkills.some((skill) => skills.some((s) => s.includes(skill.toLowerCase())));

      // Rating match
      const ratingMatch = (() => {
        const rating = parseFloat(job.rating);
        return !isNaN(rating) && rating >= prefs.minRating;
      })();

      // Company exclusion
      const companyExcluded =
        prefs.excludeCompanies && prefs.excludeCompanies.length > 0
          ? prefs.excludeCompanies.some((company) => job.company.toLowerCase().includes(company.toLowerCase()))
          : false;

      return skillMatch;
    });
  }

  async scrapePaginatedJobs(page, baseUrl, preferences) {
    let allJobs = [];
    let pageNum = 1;

    while (true) {
      logger.info(`📄 Scraping Page ${pageNum}`);
      await page.waitForSelector(".cust-job-tuple", { timeout: 5000 });

      const jobs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".cust-job-tuple")).map((job) => {
          const titleEl = job.querySelector("h2 > a.title");
          const companyEl = job.querySelector("a.comp-name");
          const ratingEl = job.querySelector("a.rating .main-2");
          const reviewsEl = job.querySelector("a.review");
          const expEl = job.querySelector(".exp span[title]");
          const salEl = job.querySelector(".sal span[title]");
          const locEl = job.querySelector(".loc span[title]");
          const descEl = job.querySelector(".job-desc");
          const skillEls = job.querySelectorAll("ul.tags-gt li");
          const postedOnEl = job.querySelector(".job-post-day");

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
            skills: Array.from(skillEls).map((li) => li.innerText.trim()),
            postedOn: postedOnEl?.innerText.trim() || "",
          };
        });
      });

      allJobs.push(...jobs);

      const hasNext = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll("a.styles_btn-secondary__2AsIP"));
        const next = anchors.find((a) => a.innerText.trim() === "Next" && !a.hasAttribute("disabled"));
        if (next) {
          next.click();
          return true;
        }
        return false;
      });

      if (!hasNext || pageNum >= this.maxPagesToScrape) {
        logger.info("✅ All pages scraped or limit reached.");
        logger.info("🚫 No more pages.");
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000)); // allow DOM to update
      pageNum++;
    }

    logger.info(`✅ Scraped total ${allJobs.length} jobs`);
    logger.info(`🔍 Filtering jobs based on preferences... with skills: ${preferences.requiredSkills}`);
    return this.filterJobs(allJobs, preferences);
  }

  // Fix for applyForJobs method - remove logger from page.evaluate()
  async applyForJobs(jobs) {
    logger.info(`🔄 Starting to apply for ${jobs.length} jobs`);
    const appliedJobs = [];

    for (const job of jobs) {
      logger.info(`\n==================================`);
      logger.info(`💼 Applying to: ${job.title} | ${job.company} Skills: ${job?.skills}`);
      logger.info(`🔗 Apply link: ${job.applyLink}`);

      const jobPage = await this.browser.newPage();
      logger.info(`📄 New page created for job application`);

      try {
        logger.info(`🌐 Navigating to application URL...`);
        await jobPage.goto(job.applyLink, { waitUntil: "networkidle2" });
        logger.info(`✅ Page loaded successfully`);

        logger.info(`🔍 Looking for apply button...`);
        const applyButtonExists = (await jobPage.$(".apply-button")) !== null;
        logger.info(`🔍 Apply button exists: ${applyButtonExists}`);

        await jobPage.waitForSelector(".apply-button", { timeout: 5000 });
        logger.info(`✅ Apply button found`);

        await jobPage.click(".apply-button");
        logger.info(`👆 Clicked on apply button`);

        logger.info(`⏳ Waiting for 3 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        logger.info(`✅ Finished waiting`);

        logger.info(`🔍 Checking for chatbot drawer...`);
        const chatDrawer = await jobPage.$(".chatbot_DrawerContentWrapper");
        logger.info(`🔍 Chatbot drawer exists: ${chatDrawer !== null}`);

        if (chatDrawer) {
          logger.info("💬 Chatbot detected, starting chat form handling...");
          let appliedJobPage = await this.handleChatForm(jobPage);
          logger.info(`✅ Returned from handleChatForm function`);

          logger.info(`🔍 Checking for success message...`);
          // FIXED: Removed logger calls from page.evaluate()
          const success = await appliedJobPage.evaluate(() => {
            const elements = Array.from(document.querySelectorAll("body *"));
            // Removed logger call here as it's not available in browser context

            const msg = elements.find((el) => {
              const text = el.innerText || "";
              return text.includes("You have successfully applied to");
            });

            return msg?.innerText || null;
          });

          logger.info(`🔍 Success message found: ${success !== null}`);

          if (success) {
            logger.info(`📣 Creating notification for job: ${job.title}`);
            notifyAll(this.createNotification(job));
            logger.info(`✅ ${success}`);

            // Save successful application to MongoDB
            await this.saveJobApplication(job);
            appliedJobs.push(job);
          } else {
            logger.info(`⚠️ No success message found after chatbot interaction`);
          }
        } else {
          logger.info(`💬 No chatbot found, checking for direct success message...`);
          logger.info(`⏳ Waiting for 4 seconds for page to update...`);
          await new Promise((resolve) => setTimeout(resolve, 4000));
          logger.info(`✅ Finished waiting`);

          logger.info(`🔍 Checking for success message on regular page...`);
          // FIXED: Removed logger calls from page.evaluate()
          const success = await jobPage.evaluate(() => {
            const elements = Array.from(document.querySelectorAll("body *"));
            // Removed logger call here as it's not available in browser context

            const msg = elements.find((el) => {
              const text = el.innerText || "";
              return text.includes("You have successfully applied to");
            });

            return msg?.innerText || null;
          });

          logger.info(`🔍 Success message found: ${success !== null}`);

          if (success) {
            logger.info(`📣 Creating notification for job: ${job.title}`);
            notifyAll(this.createNotification(job));
            logger.info(`✅ ${success}`);

            // Save successful application to MongoDB
            await this.saveJobApplication(job);
            appliedJobs.push(job);
          } else logger.info("🤷 Unknown apply result - no success message detected");
        }
      } catch (err) {
        logger.info(`❌ Couldn't apply: ${err.message}`);
        logger.info(`📚 Error stack: ${err.stack}`);
      }

      logger.info(`🔒 Closing job page`);
      await jobPage.close();
      logger.info(`✅ Job page closed`);
    }
    logger.info(`🏁 Finished applying to all jobs. Successfully applied to ${appliedJobs.length} jobs.`);
    return appliedJobs;
  }

  async saveJobApplication(job) {
    try {
      logger.info(`💾 Saving job application to database: ${job.title} at ${job.company}`);

      const jobData = {
        title: job.title,
        company: job.company,
        location: job.location || "N/A",
        experience: job.experience || "N/A",
        salary: job.salary || "N/A",
        rating: job.rating || "N/A",
        reviews: job.reviews || "No",
        postedOn: job.postedOn || "N/A",
        description: job.description || "No description available",
        skills: job.skills || [],
        applyLink: job.applyLink || "N/A",
        portal: "Naukri", // Setting the portal as Naukri
        userId: this.user._id.toString(), // Using the user ID from the constructor
        status: "Applied",
        notes: `Applied via automation on ${new Date().toLocaleString()}`,
        applicationId: `NK-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
      };

      // Check if the fastify instance has the jobApplicationModel decorator
      if (this.fastify && this.fastify.jobApplicationModel) {
        const result = await this.fastify.jobApplicationModel.create(jobData);
        logger.info(`✅ Job application saved to database with ID: ${result.insertedId}`);
        return result.insertedId;
      } else {
        logger.warn(`⚠️ No jobApplicationModel found on fastify instance, saving directly to collection`);
        // Fallback: save directly to the MongoDB collection if plugin is not registered
        const result = await this.fastify.mongo.db.collection("jobApplications").insertOne({
          ...jobData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        logger.info(`✅ Job application saved to database with ID: ${result.insertedId}`);
        return result.insertedId;
      }
    } catch (error) {
      logger.error(`❌ Error saving job application to database:`, error);
      throw error;
    }
  }
  // Fix for handleChatForm method - remove logger from page.evaluate()
  async handleChatForm(page) {
    logger.info(`🤖 Starting handleChatForm function`);
    try {
      logger.info(`🔍 Waiting for chatbot drawer...`);
      await page.waitForSelector(".chatbot_DrawerContentWrapper", { timeout: 3000 });
      logger.info(`✅ Chatbot drawer found`);

      let attempt = 0;
      const max = 10;
      logger.info(`⚙️ Will attempt to handle up to ${max} chat interactions`);

      while (true) {
        logger.info(`\n🔄 Chat attempt ${attempt + 1}/${max}`);

        // Check if chatbot is still present
        const chatbotExists = (await page.$(".chatbot_DrawerContentWrapper")) !== null;
        logger.info(`🔍 Chatbot still exists: ${chatbotExists}`);

        if (!chatbotExists || attempt >= max) {
          logger.info(`⏹️ Breaking chat loop: chatbotExists=${chatbotExists}, attempt=${attempt}, max=${max}`);
          break;
        }

        // Get the current question
        logger.info(`🔍 Retrieving latest bot question...`);
        const question = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll(".chatbot_ListItem"));
          // Removed logger call here as it's not available in browser context

          if (items.length === 0) return null;

          const last = items[items.length - 1];
          const span = last?.querySelector(".botMsg span");
          return span?.innerText?.trim() || null;
        });

        logger.info(`🔍 Question found: ${question !== null}`);
        if (!question) {
          logger.info(`⚠️ No question found, breaking loop`);
          break;
        }

        logger.info(`🤖 Bot asks: ${question}`);

        // Check for radio buttons
        logger.info(`🔍 Checking for radio buttons...`);
        const radioBtns = await page.$$(".ssrc__radio-btn-container");
        logger.info(`🔍 Found ${radioBtns.length} radio buttons`);

        if (radioBtns.length > 0) {
          logger.info(`🔘 Processing radio button options...`);
          const optionLabels = [];

          for (let i = 0; i < radioBtns.length; i++) {
            const btn = radioBtns[i];
            const label = await btn.$("label");

            if (!label) {
              logger.info(`⚠️ No label found for radio button ${i + 1}`);
              continue;
            }

            const labelText = await page.evaluate((el) => el.innerText.trim(), label);
            optionLabels.push(labelText);
            logger.info(`🔘 Option ${i + 1}: "${labelText}"`);
          }

          logger.info(`🧠 Asking bot for choice among ${optionLabels.length} options...`);
          const answer = await this.bot.askOneLine(question, optionLabels);
          logger.info(`🎯 Bot chose: "${answer}"`);

          let clicked = false;
          for (let i = 0; i < optionLabels.length; i++) {
            logger.info(`🔍 Comparing "${optionLabels[i].toLowerCase()}" with "${answer.toLowerCase()}"`);

            if (optionLabels[i].toLowerCase() === answer.toLowerCase()) {
              logger.info(`✅ Match found at option ${i + 1}`);
              const label = await radioBtns[i].$("label");

              if (label) {
                logger.info(`👆 Clicking on option: "${optionLabels[i]}"`);
                await label.click();
                clicked = true;
                logger.info(`✅ Clicked radio: ${optionLabels[i]}`);
                break;
              } else {
                logger.info(`⚠️ Label element not found for matched option`);
              }
            }
          }

          if (!clicked) {
            logger.info(`❌ No match found. Selecting first option instead.`);
            const firstLabel = await radioBtns[0].$("label");

            if (firstLabel) {
              await firstLabel.click();
              logger.info(`✅ Clicked first radio option as fallback`);
            } else {
              logger.info(`⚠️ Could not find first label element`);
            }
          }

          // Check for Save button
          logger.info(`🔍 Looking for save button...`);
          const saveBtn = await page.$(".sendMsg");
          logger.info(`🔍 Save button exists: ${saveBtn !== null}`);

          if (saveBtn) {
            logger.info(`👆 Clicking save button...`);
            await saveBtn.click();
            logger.info("📩 Clicked Save after selecting radio");
          } else {
            logger.info(`⚠️ No save button found after radio selection`);
          }
        }
        // Check for checkboxes
        else if (await page.$('input[type="checkbox"]')) {
          logger.info(`✓ Checkbox detected`);
          const checkbox = await page.$('input[type="checkbox"]');

          if (checkbox) {
            logger.info(`👆 Clicking checkbox...`);
            await checkbox.click();
            logger.info("✅ Checkbox selected");
          } else {
            logger.info(`⚠️ Checkbox disappeared before clicking`);
          }
        }
        // Handle text input
        else {
          logger.info(`📝 Text input required, asking bot for response...`);
          const answer = await this.bot.ask(question);
          logger.info(`💬 Bot (text): ${answer}`);

          logger.info(`🔍 Looking for contenteditable div...`);
          const inputExists = (await page.$('div[contenteditable="true"]')) !== null;
          logger.info(`🔍 Contenteditable div exists: ${inputExists}`);

          if (!inputExists) {
            logger.info(`⚠️ No contenteditable div found for text input`);
          }

          logger.info(`📝 Setting text value...`);
          // FIXED: Removed logger calls from page.evaluate()
          const inputSet = await page.evaluate((val) => {
            const input = document.querySelector('div[contenteditable="true"]');
            if (input) {
              input.innerText = val;
              input.dispatchEvent(new Event("input", { bubbles: true }));
              return true;
            } else {
              return false;
            }
          }, answer);

          if (inputSet) {
            logger.info(`✅ Text input set successfully`);
          } else {
            logger.info(`❌ Could not find contenteditable element`);
          }

          logger.info(`⌨️ Pressing Enter key...`);
          await page.keyboard.press("Enter");
          logger.info(`✅ Enter key pressed`);
        }

        attempt++;
        logger.info(`⏳ Waiting 3 seconds for chatbot to process...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        logger.info(`✅ Finished waiting`);
      }

      logger.info("✅ Chatbot interaction completed");
      logger.info(`⏳ Waiting 10 seconds for final page load...`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
      logger.info(`✅ Finished waiting`);

      return page;
    } catch (e) {
      logger.info("⚠️ Chatbot handling failed:", e.message);
      logger.info(`📚 Error stack: ${e.stack}`);
      return page; // Return the page even if an error occurred
    }
  }

  createNotification(job) {
    return `📢 *Job Applied Successfully!*

🔹 *Position:* ${job.title}
🏢 *Company:* ${job.company}
📍 *Location:* ${job.location || "N/A"}
🧠 *Experience:* ${job.experience || "N/A"}
💰 *Salary:* ${job.salary || "N/A"}
⭐ *Rating:* ${job.rating || "N/A"} (${job.reviews || "No"} reviews)
📅 *Posted On:* ${job.postedOn || "N/A"}
🌐 *Portal:* Naukri
👤 *User:* ${this.user.firstName} ${this.user.lastName}

📝 *Description:* ${job.description || "No description available"}

🛠️ *Skills:* ${job.skills && job.skills.length ? job.skills.join(", ") : "N/A"}

🔗 *Apply Link:* ${job.applyLink || "N/A"}

🟢 Please wait while we track the application status.`;
  }

  async start() {
    try {
      // Set up the AI bot
      this.bot = GeminiBot.createFromJobConfig(this.jobConfig);
      const page = await this.browser.newPage();

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      logger.info(`🔑 Logging in to Naukri.com with account: ${this.credentials.email}`);
      await this.loginToNaukri(page);
      logger.info(`🔑 Logged in successfully`);
      // Extract search parameters from job config
      const { keywords, experience, location } = this.jobConfig.searchConfig;
      logger.info(`🔍 Searching for: ${keywords} in ${location} (Exp: ${experience} yrs)`);

      await this.searchJobs(page, keywords, experience, location);

      const currentUrl = page.url();

      // Create user preferences from job config
      const userPrefs = {
        location,
        minExp: Number(experience),
        maxExp: Number(experience) + 2,
        requiredSkills: keywords.split(",").map((skill) => skill.trim()),
        excludeCompanies: this.jobConfig.filterConfig.excludeCompanies || [],
        minRating: this.jobConfig.filterConfig.minRating || 3.5,
      };

      const jobs = await this.scrapePaginatedJobs(page, currentUrl, userPrefs);

      let appliedJobs = [];
      if (jobs.length === 0) {
        logger.info("No jobs found for the given criteria");
      } else {
        logger.info(`Found ${jobs.length} jobs matching criteria`);
        logger.info("Applying for jobs...");
        appliedJobs = await this.applyForJobs(jobs);
      }

      // Update job config with last run details
      if (this.jobConfig.schedule) {
        this.jobConfig.schedule.lastRun = new Date();

        // Calculate next run based on frequency
        if (this.jobConfig.schedule.frequency === "daily") {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          this.jobConfig.schedule.nextRun = tomorrow;
        } else if (this.jobConfig.schedule.frequency === "weekly") {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          this.jobConfig.schedule.nextRun = nextWeek;
        }

        // Save updated job config to database
        if (this.fastify && this.fastify.mongo) {
          try {
            const result = await this.fastify.mongo.db.collection("jobConfigs").updateOne(
              { _id: this.jobConfig._id },
              {
                $set: {
                  "schedule.lastRun": this.jobConfig.schedule.lastRun,
                  "schedule.nextRun": this.jobConfig.schedule.nextRun,
                  lastRunStats: {
                    jobsFound: jobs.length,
                    jobsApplied: appliedJobs.length,
                    timestamp: new Date(),
                  },
                },
              }
            );
            logger.info(`✅ Job config updated in database: ${result.modifiedCount} document modified`);
          } catch (dbError) {
            logger.error(`❌ Error updating job config:`, dbError);
          }
        }

        logger.info(`✅ Job automation completed. Next run scheduled for: ${this.jobConfig.schedule.nextRun}`);
      }

      await page.close();

      return {
        success: true,
        message: `Job search completed. Found ${jobs.length} matching jobs, applied to ${appliedJobs.length}.`,
        jobsFound: jobs.length,
        jobsApplied: appliedJobs.length,
      };
    } catch (err) {
      logger.error("Error during automation:", err);
      return {
        success: false,
        message: `Error during automation: ${err.message}`,
        error: err,
      };
    }
  }
}
