const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Extracts text using the Gemini Vision Models exclusively.
 * Extremely high accuracy for cursive handwriting.
 */
const extractTextFromImage = async (filePath, mimeType) => {
    console.log("Calling Gemini Vision API for Text Extraction...", filePath);

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in your .env file!");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Based on your specific API Key's access, these are your valid vision models
    const validModels = [
        "gemini-2.5-flash",
        "gemini-2.0-flash"
    ];

    const imagePart = {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType: mimeType || 'image/jpeg'
        }
    };

    for (const modelName of validModels) {
        try {
            console.log(`Attempting Gemini Vision extraction with model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent([
                "Extract all the handwritten text from this image exactly as written. Preserve line breaks, punctuation, and structural formatting where possible. Do not interpret or change the text, just read it literally.",
                imagePart,
            ]);

            console.log(`✅ Success with ${modelName}`);
            return result.response.text();

        } catch (error) {
            console.warn(`❌ Model ${modelName} failed: ${error.message || (error.response && error.response.statusText) || 'Unknown Error'}`);

            // If it's a Rate Limit / Quota error, stop cascading and tell the user immediately
            if (error.message && error.message.includes('429')) {
                throw new Error("Gemini API Rate Limit Exceeded: You are sending requests too fast for your Free Tier. Please wait 10 seconds and try again.");
            }
        }
    }

    throw new Error("Failed to connect to Gemini Vision. Ensure your API Key quota is valid.");
};

module.exports = {
    extractTextFromImage
};
