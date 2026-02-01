require('dotenv').config();
const axios = require('axios');

async function testGeminiDirect() {
    console.log('🧪 Testing Gemini API with Direct REST calls...\n');

    const apiKey = process.env.GEMINI_API_KEY;

    // Test with v1 API
    const models = [
        'gemini-pro',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
    ];

    for (const model of models) {
        try {
            console.log(`Testing: ${model} (v1 API)`);
            const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

            const response = await axios.post(url, {
                contents: [{
                    parts: [{
                        text: 'Say hello in Hindi'
                    }]
                }]
            });

            console.log(`✅ SUCCESS! Model: ${model}`);
            console.log('Response:', response.data.candidates[0].content.parts[0].text);
            return model;

        } catch (e) {
            if (e.response) {
                console.log(`❌ Failed: ${e.response.status} - ${e.response.data.error?.message || 'Unknown error'}`);
            } else {
                console.log(`❌ Failed: ${e.message}`);
            }
        }
    }

    console.log('\n❌ No working model found');
    return null;
}

testGeminiDirect();
