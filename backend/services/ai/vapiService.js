const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Helper to convert Video -> Audio (MP3) using system FFmpeg
const extractAudio = (videoPath) => {
    return new Promise((resolve, reject) => {
        const audioPath = videoPath.replace(path.extname(videoPath), '.mp3');
        console.log(`Extracting Audio: ${videoPath} -> ${audioPath}`);

        // ffmpeg -i input.mp4 -vn -ar 16000 -ac 1 -b:a 32k output.mp3 (Optimized for Speech Text)
        const command = `ffmpeg -y -i "${videoPath}" -vn -ar 16000 -ac 1 -b:a 32k "${audioPath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("FFmpeg Error:", stderr);
                reject(error);
            } else {
                console.log("Audio Extraction Complete.");
                resolve(audioPath);
            }
        });
    });
};

const processAudio = async (videoUrl) => {
    console.log("-> VapiService (FFmpeg + Gemini): Processing...", videoUrl);

    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is missing. Returning mock data.");
        return { transcription: "Mock Transcription due to missing key.", sentiment: "Neutral" };
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY.trim();
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using Gemini 2.5 Flash - confirmed available and efficient
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Resolve absolute path
        const relativePath = videoUrl.startsWith('/') ? videoUrl.slice(1) : videoUrl;
        const absolutePath = path.join(__dirname, '../../', relativePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`File not found at ${absolutePath}`);
        }

        // 1. Convert Video to Audio (MP3) to drastically reduce size and avoid "File API" issues
        let audioPath;
        try {
            audioPath = await extractAudio(absolutePath);
        } catch (ffmpegErr) {
            console.warn("FFmpeg failed, falling back to original video file:", ffmpegErr.message);
            audioPath = absolutePath; // Fallback to sending the video directly if ffmpeg fails
        }

        // 2. Read file (Audio or Video)
        const fileBuffer = fs.readFileSync(audioPath);
        const base64Data = fileBuffer.toString('base64');
        const mimeType = audioPath.endsWith('.mp3') ? "audio/mp3" : "video/mp4";

        console.log(`Sending Inline Data to Gemini (${mimeType}, ${fileBuffer.length} bytes)...`);

        // 3. Generate Transcription
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            },
            { text: "Generate a verbatim transcription of the speech in this file." }
        ]);

        // Cleanup generated mp3
        if (audioPath !== absolutePath && fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }

        const transcription = result.response.text();
        console.log("Transcription Generated (Length):", transcription.length);

        return {
            transcription: transcription,
            sentiment: "Neutral"
        };

    } catch (error) {
        console.error("Vapi (Gemini Audio) Error:", error);
        return { transcription: "Error generating transcription: " + error.message, sentiment: "Error" };
    }
};

module.exports = { processAudio };
