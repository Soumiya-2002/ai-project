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

            const prompt = `Transcribe ALL handwritten text in this document EXACTLY as the student wrote it. Do not auto-correct spelling or grammar mistakes made by the student. 
CRITICAL INSTRUCTIONS:
1. VERBATIM EXTRACTION: Output exactly the letters and words the student wrote. If a word is misspelled, preserve the misspelling. DO NOT add extra text or fix mistakes.
2. HUMAN-LIKE REASONING FOR BAD HANDWRITING: Read the document like a human teacher would. Use logical context to identify list items (e.g., "i)", "ii)", "iii)", "a)", "b)"). NEVER output garbage symbols like "!p)", "i!q)", "i!r)" at the start of sentences. If a red checkmark crosses Roman numerals, it mathematically creates shapes that look like '!', 'p', 'q', or 'r' to OCR. YOU MUST autocorrect these visual glitches back to standard Roman numerals: 'i)', 'ii)', 'iii)'.
3. IGNORE TEACHER CHECKMARKS AS TEXT: The page has large red checkmarks/slashes drawn across the answers. DO NOT interpret these red lines or their endpoints as text characters! Specifically, DO NOT output trailing single quotes ('), commas, or random letters (like '<', 'X', 'S') at the end of lines caused by these red marks. Treat the red checkmarks/slashes as invisible overlays.
4. IGNORE NOISE & STRAY MARKS: Do not transcribe blank signature lines, underlines, page borders, dirt, or stray dots as punctuation.
5. NO MARKDOWN LISTS OR DUPLICATE NUMBERS: Do not interpret the lines as a numbered list. For example, if a line starts with "1) b. Noon", output exactly "1) b. Noon". Do NOT output "1) 1) b. Noon". Never add artificial numbering.
6. TEACHER MARKS & NUMBERS: Extract numerical scores (like '1/2', '1') inline where they appear. Ignore the giant physical checkmarks.
7. SPATIAL LAYOUT & BLANK LINES (CRITICAL): Preserve the exact vertical spacing! If the student leaves a blank line between two answers, you MUST output a blank line (press Enter twice). If they indent "i)" and "ii)", you must also indent them. It must visually reflect the human readable answer sheet distances.
8. If there are multiple pages, separate each page's text completely with the exact phrase '|||PAGE_BREAK|||' at the end of every page before starting the next.`;

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
