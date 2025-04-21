import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

export async function PepareAndTrainBot() {
  const cacheFile = path.resolve('cache/system-instruction.json');
  const userDataDir = path.resolve('cache')

  if (fs.existsSync(cacheFile)) {
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    console.log('💾 Loaded cached system instruction');
    return data.systemInstruction || '';
  }

  const pdf = fs.readdirSync(userDataDir).find(f => f.toLowerCase().endsWith('.pdf'));
  if (!pdf) {
    console.error('❌ No PDF resume found in cache. Please wait, downloading and training the bot...');
    return false
  }

  const resumePath = path.join(userDataDir, pdf);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

  console.log('📄 Generating system instruction from:', resumePath);
  const result = await model.generateContent([
    {
      inlineData: {
        data: Buffer.from(fs.readFileSync(resumePath)).toString('base64'),
        mimeType: 'application/pdf',
      },
    },
    `
    Based on this resume, generate a systemInstruction string for a job assistant bot.
    Include name, role, experience, skills, education, companies, projects, location preference, and salary expectation.
    Be always positive and professional.
    End with: "Always answer in short, crisp, one-line responses like a real applicant."
    Output only the instruction text.
    `
  ]);

  const instruction = result.response.text().trim();
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify({ systemInstruction: instruction }, null, 2));
  return instruction;
}
