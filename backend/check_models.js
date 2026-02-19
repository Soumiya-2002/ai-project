const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

// Debug: Check if .env even exists
if (!fs.existsSync('.env')) {
    console.error("ERROR: .env file not found in current directory!");
    process.exit(1);
}

require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set in .env file!");
    process.exit(1);
}

console.log(`Checking models using API Key: ${API_KEY.substring(0, 5)}...`);

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("\n----- AVAILABLE GENERATE CONTENT MODELS -----");
            data.models.forEach(model => {
                if (model.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${model.name.replace('models/', '')}`);
                }
            });
            console.log("---------------------------------------------");
        } else {
            console.error("No models returned or API Error:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

listModels();
