const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Extracts audio from a video file and saves it as an MP3.
 * Returns the path to the generated audio file.
 */
const extractAudio = (videoPath) => {
    return new Promise((resolve, reject) => {
        const audioPath = videoPath.replace(path.extname(videoPath), '.mp3');
        console.log(`[VapiService] Extracting audio to: ${audioPath}`);

        ffmpeg(videoPath)
            .outputOptions('-vn') // Disable video recording
            .audioCodec('libmp3lame') // Use MP3 codec
            .audioBitrate('128k')
            .save(audioPath)
            .on('end', () => {
                console.log('[VapiService] Audio extraction complete.');
                resolve(audioPath);
            })
            .on('error', (err) => {
                console.error('[VapiService] FFmpeg Error:', err);
                reject(err);
            });
    });
};

const processAudio = async (videoUrl) => {
    if (!process.env.GEMINI_API_KEY) {
        return { transcription: "Mock Transcription (No Key)", sentiment: "Neutral" };
    }

    let audioPath = null;
    let fileUri = null;
    const apiKey = process.env.GEMINI_API_KEY.trim();
    const fileManager = new GoogleAIFileManager(apiKey);
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use the fastest model available for simple transcription
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        // Resolve absolute path
        const relativePath = videoUrl.startsWith('/') ? videoUrl.slice(1) : videoUrl;
        const videoAbsolutePath = path.join(__dirname, '../../', relativePath);

        if (!fs.existsSync(videoAbsolutePath)) {
            throw new Error(`File not found at ${videoAbsolutePath}`);
        }

        // 1. Extract Audio Locally
        console.log("[VapiService] Step 1: Extracting Audio from Video...");
        audioPath = await extractAudio(videoAbsolutePath);

        // 2. Upload Audio to Gemini
        console.log("[VapiService] Step 2: Uploading Audio to Gemini...");
        const uploadResult = await fileManager.uploadFile(audioPath, {
            mimeType: "audio/mp3",
            displayName: "Lecture Audio",
        });
        fileUri = uploadResult.file.uri;
        console.log(`[VapiService] Audio Uploaded: ${fileUri}`);

        // 3. Wait for processing
        let file = await fileManager.getFile(uploadResult.file.name);
        let attempts = 0;
        while (file.state === "PROCESSING" && attempts < 20) {
            console.log("[VapiService] Processing audio...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            file = await fileManager.getFile(uploadResult.file.name);
            attempts++;
        }

        if (file.state === "FAILED") {
            throw new Error("Audio processing failed by Gemini.");
        }

        // 4. Generate Content (Transcription)
        console.log("[VapiService] Step 3: Generating Transcription...");

        // List of multimodal models to try (Confirmed available for this user)
        const modelsToTry = [
            "gemini-flash-latest",    // Generic Alias
            "gemini-2.0-flash",       // Fast & New
            "gemini-2.5-flash",       // Cutting Edge
            "gemini-2.5-pro",         // High Intelligence
            "gemini-pro-latest"       // Fallback
        ];

        let transcription = "";
        let lastError = null;
        let successModel = "";

        for (const modelName of modelsToTry) {
            try {
                console.log(`[VapiService] Attempting transcription with model: ${modelName}`);
                const currentModel = genAI.getGenerativeModel({ model: modelName });

                const result = await currentModel.generateContent([
                    {
                        fileData: {
                            mimeType: "audio/mp3",
                            fileUri: fileUri
                        }
                    },
                    { text: "Generate a detailed, verbatim transcription of this audio. Ignore background noise." }
                ]);

                transcription = result.response.text();
                if (transcription) {
                    successModel = modelName;
                    console.log(`[VapiService] Success with ${modelName}`);
                    break;
                }
            } catch (err) {
                console.warn(`[VapiService] Failed with ${modelName}: ${err.message.split('\n')[0]}`);
                lastError = err;
            }
        }

        if (!transcription) {
            throw lastError || new Error("All transcription models failed.");
        }

        console.log(`[VapiService] Transcription Complete using ${successModel}. Length: ${transcription.length}`);

        return {
            transcription: transcription,
            sentiment: "Neutral" // Placeholder
        };

    } catch (error) {
        console.error("[VapiService] Error:", error);
        throw error; // Rethrow to let caller handle failure

    } finally {
        // Cleanup: Delete the temporary audio file
        if (audioPath && fs.existsSync(audioPath)) {
            try {
                fs.unlinkSync(audioPath);
                console.log("[VapiService] Temporary audio file deleted.");
            } catch (e) {
                console.warn("[VapiService] Failed to delete temp file:", e.message);
            }
        }
    }
};

module.exports = { processAudio };
