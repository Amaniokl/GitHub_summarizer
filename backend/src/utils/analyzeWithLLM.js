import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeWithLLM = async (batch) => {
  // Build prompt content from project files
  const fileText = batch.map(f => `File: ${f.path}\n${f.content}`).join('\n\n');

  const prompt = `You are an expert software architect. Analyze the following project files and provide a **brief, high-level summary**. Your response must be **very concise** and include only **key architectural insights**, not implementation details.

Organize your answer under the following **headings**, with each containing **2-3 short bullet points** maximum:

- Overall Architecture
- Main Components/Services
- Database Usage
- Authentication Methods
- Notable Patterns or Frameworks
- Other Technical Observations

Be as **succinct** as possible. Focus on structure, technologies used, and design patterns.

${fileText}`;

  // Initialize model
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });

  // Generate response
  const result = await model.generateContent(prompt);
  const text = await result.response.text();

  return text;
};

export default analyzeWithLLM;
