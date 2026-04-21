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

    // Prioritize 'pro' models since they have far superior reasoning capabilities 
    // for severely degraded/bad handwriting and complex humanized structuring.
    const validModels = [
        "gemini-2.5-pro",
        "gemini-1.5-pro",
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
            console.log(`Attempting Gemini Vision extraction with high-tier model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `You are an expert human transcriber with perfect handwriting recognition skills. Transcribe ALL handwritten text in this document highly accurately and naturally. 

CRITICAL INSTRUCTIONS:
1. HUMANIZED & NATURAL FLOW: Read the document exactly as a human teacher intended. The output must be highly accurate, properly formatted, and visually pleasing.
2. VERBATIM TEXT: Output exactly the letters and words the student wrote. If a word is misspelled, preserve the misspelling to maintain authenticity.
3. INTELLIGENT REASONING FOR BAD HANDWRITING: Use deep contextual logic to piece together messy cursive or badly written characters. Recognize common numbering patterns (e.g., "1)", "2)", "a)", "i)", "ii)"). If a teacher's red pen overlaps and makes it look like"!p)", use your human-like reasoning to realize it's actually "i)". 
4. IGNORE PENMARKS & NOISE: Completely ignore giant red checkmarks, slashes, cross-outs by the teacher, and stray dots. Treat them as invisible overlays. DO NOT insert weird punctuation like single quotes (') or random letters caused by intersecting ink.
5. NO HALLUCINATION: Do NOT add artificial list numbers if the student didn't write them. Do NOT duplicate numbers (e.g. don't write "1) 1) b").
6. SPATIAL LAYOUT & BLANK LINES: Preserve the exact structural spacing. If there is a paragraph break or a blank line between two separate answers, you MUST retain it exactly. Text alignment (indentation) should be human-readable.
7. INLINE SCORE HANDLING: If you see numerical scores (like '1/2', '1') inline naturally, include them. 
8. PAGE BREAK HANDLING: If there are multiple pages or distinct boundaries, strictly separate them using '|||PAGE_BREAK|||' at the very end of the page.`;

            const result = await model.generateContent([
                prompt,
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
