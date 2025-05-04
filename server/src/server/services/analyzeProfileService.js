// File: services/resumeService.js
import fs from 'fs';
import os from 'os';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../../utils/logger.js';
import browserInstance from '../../browser/browser.js';

/**
 * Downloads a user's resume from Naukri and generates a profile prompt using Gemini AI
 * @param {Object} credentials - User's Naukri credentials (username and password)
 * @returns {Promise<string>} - Generated AI instruction based on resume
 */
export const generateProfileFromNaukriResume = async (credentials) => {
    let browser = null;
    let page = null;
    let tempPdfPath = null;

    try {
        // Validate credentials
        if (!credentials || !credentials.username || !credentials.password) {
            throw new Error('Invalid credentials provided');
        }

        // Get browser instance
        browser = await browserInstance.getBrowser();
        page = await browser.newPage();

        // Set realistic user agent
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Download resume and generate profile
        const instruction = await downloadAndGenerateInstruction(page, credentials);

        logger.info(`Successfully generated profile instruction for user: ${credentials.username}`);
        return instruction;

    } catch (error) {
        logger.error(`Error generating profile from Naukri: ${error.message}`);
        throw error;
    } finally {
        // Clean up resources
        if (tempPdfPath && fs.existsSync(tempPdfPath)) {
            try {
                fs.unlinkSync(tempPdfPath);
            } catch (err) {
                logger.warn(`Failed to delete temporary PDF: ${err.message}`);
            }
        }

        if (page) {
            await page.close().catch(err => logger.warn(`Error closing page: ${err.message}`));
        }

        if (browser) {
            await browserInstance.closeBrowser().catch(err => logger.warn(`Error closing browser: ${err.message}`));
        }
    }
};

/**
 * Downloads resume from Naukri and generates instruction using Gemini
 * @param {Object} page - Puppeteer page object
 * @param {Object} credentials - User credentials
 * @returns {Promise<string>} - Generated instruction
 */
async function downloadAndGenerateInstruction(page, credentials) {
    const tempPdfPath = path.join(os.tmpdir(), `resume_${Date.now()}.pdf`);

    try {
        // Navigate to Naukri and login
        logger.info('Navigating to Naukri login page');
        await page.goto('https://www.naukri.com/', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        await page.click("a[title='Jobseeker Login']");
        await page.waitForSelector("input[type='text']", { timeout: 30000 });

        // Log in with credentials
        logger.info(`Logging in as ${credentials.username}`);
        await page.type("input[type='text']", credentials.username, { delay: 150 });
        await page.type("input[type='password']", credentials.password, { delay: 150 });
        await page.click("button[type='submit']");

        await page.waitForNavigation({
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Check if login was successful
        const isLoggedIn = await page.evaluate(() => {
            return !document.querySelector('.login-layer') &&
                !document.querySelector('.error-header');
        });

        if (!isLoggedIn) {
            throw new Error('Failed to login to Naukri. Please check credentials.');
        }

        // Navigate to profile page
        logger.info('Navigating to user profile page');
        await page.goto('https://www.naukri.com/mnjuser/profile', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        await page.waitForSelector('.nI-gNb-sb__main', {
            visible: true,
            timeout: 30000
        });

        // Scroll slightly to ensure content is loaded
        await page.evaluate(() => window.scrollTo(0, 10));

        // Generate PDF of the profile
        logger.info('Generating PDF from profile page');
        await page.pdf({
            path: tempPdfPath,
            format: 'A4',
            printBackground: true,
        });

        // Read the PDF file
        const pdfBuffer = fs.readFileSync(tempPdfPath);

        // Send to Gemini AI for analysis
        logger.info('Sending resume to Gemini AI for analysis');
        const instruction = await analyzeResumeWithGemini(pdfBuffer);

        return instruction;

    } catch (error) {
        logger.error(`Error in downloadAndGenerateInstruction: ${error.message}`);
        throw error;
    } finally {
        // Cleanup is handled by the calling function
    }
}

/**
 * Analyzes resume PDF with Gemini AI
 * @param {Buffer} pdfBuffer - PDF resume as buffer
 * @returns {Promise<string>} - Generated instruction
 */
async function analyzeResumeWithGemini(pdfBuffer) {
    try {
        // Initialize Gemini AI
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'models/gemini-1.5-flash',
            generationConfig: {
                temperature: 0.2, // Lower temperature for more focused output
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 2048, // Allow for detailed instruction
            }
        });

        // Generate profile instruction
        const result = await model.generateContent([
            {
                inlineData: {
                    data: pdfBuffer.toString('base64'),
                    mimeType: 'application/pdf',
                },
            },
            `
      Create a SYSTEM INSTRUCTION for an AI interview bot that will respond to recruiter questions as the actual job applicant.

Use this resume information to extract basic facts:
[PASTE RESUME PDF OR TEXT HERE]

Then create a system instruction that meets these requirements:
1. Begin with "My name is [Name]" and include only positive statements that highlight relevant skills, experience, education, and background. Focus on transferable skills and related experiences.
2. NEVER mention limitations or gaps - do not use phrases like "my resume doesn't list" or "not specified in my resume." Always frame responses positively by emphasizing related strengths.
3. Include these EXACT instructions for handling all questions to project confidence, competence, and a growth-oriented mindset:

"When asked about ANY technology, tool, or skill, I will respond: 'While my direct experience with [specific technology mentioned in the question] is not extensive, I have a strong foundation in related technologies such as [mention 1-2 closely related technologies from the resume]. My experience with these has equipped me with transferable skills and a solid understanding of similar concepts. I am confident in my ability to quickly learn and apply new technologies effectively in a production environment.'

When asked about ANY responsibility or role, I will respond: 'Yes, I've handled responsibilities that are closely aligned with [responsibility mentioned in the question] during my time at [company]. For example, at [mention a company or project], I [describe a relevant action and positive outcome]. This experience has provided me with valuable skills applicable to this area.'

When asked about ANY certification or training, I will respond: 'Yes, I've completed training in [mention a relevant training area from the resume]. This has provided me with a strong theoretical understanding and practical insights that are beneficial to [mention the area of the asked certification]. I am a strong believer in continuous learning and actively seek opportunities to expand my knowledge.'

When asked about ANY project experience, I will respond: 'Yes, I've contributed to [mention a type of project from the resume] that successfully delivered business value using [mention relevant technologies used in that project]. This experience has honed my ability to [mention a relevant skill gained, like problem-solving or collaboration], which would be valuable in similar projects.'

I will ALWAYS use positive and confident language, focusing on transferable skills and related experiences when direct experience is lacking. I will avoid any negative phrases like 'I don't have,' 'I haven't worked with,' 'not on my resume,' or any acknowledgment of gaps. My responses will consistently highlight my adaptability, eagerness to learn, and relevant strengths."

4. End with: "Always answer in short, crisp, one-line responses, projecting the demeanor of a capable, confident, and adaptable applicant."

Output ONLY the system instruction - ensure it contains zero mentions of limitations or gaps and focuses entirely on positive and confident phrasing, emphasizing transferable skills and related experiences when direct experience isn't present.
      `
        ]);

        const instruction = result.response.text().trim();
        logger.debug('Successfully generated instruction from Gemini');

        return instruction;

    } catch (error) {
        logger.error(`Error in analyzeResumeWithGemini: ${error.message}`);
        throw new Error(`Failed to analyze resume with Gemini: ${error.message}`);
    }
}