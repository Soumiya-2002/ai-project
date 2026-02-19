const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const path = require('path');
const fs = require('fs');

const processAudio = async (videoUrl) => {
    //console.log("-> VapiService (Gemini File API): Processing...", videoUrl);

    if (!process.env.GEMINI_API_KEY) {
        return { transcription: "Mock Transcription (No Key)", sentiment: "Neutral" };
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY.trim();
        const fileManager = new GoogleAIFileManager(apiKey);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Resolve absolute path
        const relativePath = videoUrl.startsWith('/') ? videoUrl.slice(1) : videoUrl;
        const absolutePath = path.join(__dirname, '../../', relativePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`File not found at ${absolutePath}`);
        }

        // 1. Upload File to Gemini
        //console.log("Uploading file to Gemini...");
        const uploadResult = await fileManager.uploadFile(absolutePath, {
            mimeType: "video/mp4",
            displayName: "Lecture Video",
        });
        const fileUri = uploadResult.file.uri;
        //console.log(`File Uploaded: ${fileUri}`);

        // 2. Wait for processing (File API requirement)
        let file = await fileManager.getFile(uploadResult.file.name);
        while (file.state === "PROCESSING") {
            const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            //console.log("Processing video...");
            await sleep(2000); // Wait 2s
            file = await fileManager.getFile(uploadResult.file.name);
        }

        if (file.state === "FAILED") {
            throw new Error("Video processing failed by Gemini.");
        }

        //console.log("Video Active. Generating Transcription...");

        // 3. Generate Content using File URI
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: file.mimeType,
                    fileUri: fileUri
                }
            },
            { text: "Generate a verbatim transcription of the speech." }
        ]);

        const transcription = result.response.text();
        //console.log("Transcription Generated (Length):", transcription.length);

        return {
            transcription: transcription,
            sentiment: "Neutral"
        };

    } catch (error) {
        console.error("Vapi (Gemini FileAPI) Error:", error);
        return { transcription: "Error: " + error.message, sentiment: "Error" };
    }
};

module.exports = { processAudio };
