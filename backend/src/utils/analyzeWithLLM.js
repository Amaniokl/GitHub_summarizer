import { GoogleGenerativeAI } from '@google/generative-ai'; // Import Gemini class
import dotenv from 'dotenv'; // Import dotenv
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Initialize with API key

const analyzeWithLLM = async (batch) => {
    const prompt = `You are an expert software architect. Analyze the following files from a project and describe:
- The overall architecture
- The main components/services
- Database usage
- Authentication methods
- Notable patterns or frameworks
- Anything else interesting

${batch.map(f => `File: ${f.path}\n${f.content}`).join('\n\n')}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" }); // Use Gemini Pro
//     const models = await genAI.listModels();
// console.log(models);

    const result = await model.generateContent(prompt); // Generate content
    const response = await result.response; // Extract response
    const text = response.text(); // Get plain text

    return text; // Return analysis
};

export default analyzeWithLLM; // Export the function
