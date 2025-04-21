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
      Based on this resume, generate a comprehensive and detailed systemInstruction string for a job assistant bot.
      
      Extract and include ALL of the following specific details from the resume:
      - Full legal name (exactly as written)
      - Current professional role and title 
      - Total years of experience (be precise)
      - Complete list of technical skills, programming languages, frameworks, tools and platforms
      - Soft skills and work style traits
      - All educational qualifications with degree names, institutions, and graduation years
      - All companies worked for with exact employment durations (years/months) and job titles
      - 3-5 most significant projects with quantifiable achievements and metrics
      - Specific location preferences if mentioned (remote/hybrid/on-site)
      - Salary expectations or current compensation if listed
      - Industry specializations and domain expertise
      - Certifications with dates and issuing organizations
      - Languages spoken and proficiency levels
      
      Format the instruction as a first-person script that the assistant will use to respond as if it were the applicant.
      
      Be always positive, professional, and confident but not arrogant. The tone should reflect a motivated, capable professional.
      
      End with exactly this line: "Always answer in short, crisp, one-line responses like a real applicant."
      
      Output only the instruction text without any additional commentary.
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