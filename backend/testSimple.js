require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    console.log('🧪 Testing Gemini API...\n');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try gemini-1.5-flash-latest
    try {
        console.log('Testing: gemini-1.5-flash-latest');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        const result = await model.generateContent('Say hello in Hindi');
        const response = await result.response;
        console.log('✅ SUCCESS! Model: gemini-1.5-flash-latest');
        console.log('Response:', response.text());
        return 'gemini-1.5-flash-latest';
    } catch (e) {
        console.log('❌ Failed:', e.message.substring(0, 100));
    }

    // Try gemini-pro
    try {
        console.log('\nTesting: gemini-pro');
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent('Say hello in Hindi');
        const response = await result.response;
        console.log('✅ SUCCESS! Model: gemini-pro');
        console.log('Response:', response.text());
        return 'gemini-pro';
    } catch (e) {
        console.log('❌ Failed:', e.message.substring(0, 100));
    }

    console.log('\n❌ No working model found');
    return null;
}

testGemini();
