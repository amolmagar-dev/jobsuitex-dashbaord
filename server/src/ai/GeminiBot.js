import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

export class GeminiBot {
  constructor(systemInstruction) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction,
    });
  }

  // Create a bot with instructions from job config
  static createFromJobConfig(jobConfig) {
    const selfDescription = jobConfig.aiTraining?.selfDescription || '';
    return new GeminiBot(selfDescription);
  }

  async ask(question) {
    try {
      const result = await this.model.generateContent(question);
      return result.response.text().trim();
    } catch (error) {
      console.error('[GeminiBot.ask] Error:', error.message);
      return 'Skip';
    }
  }

  async askOneLine(question, options = []) {
    const prompt = options.length
      ? `Choose only one from the following options:\nOptions: ${options.join(', ')}\nQuestion: ${question}`
      : question;

    try {
      const result = await this.model.generateContent(prompt);
      const raw = result.response.text().trim();
      return raw.split(/[.,\n]/)[0].trim();
    } catch (error) {
      console.error('[GeminiBot.askOneLine] Error:', error.message);
      return 'Skip';
    }
  }
}