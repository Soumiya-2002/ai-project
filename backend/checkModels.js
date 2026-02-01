require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        console.log('Fetching available models...\n');

        // Try using gemini-pro (text-only model)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('Hello, what models are available?');
        const response = await result.response;
        console.log('✅ gemini-pro is available!');
        console.log('Response:', response.text());

    } catch (error) {
        console.error('Error:', error.message);
    }
}

listModels();
