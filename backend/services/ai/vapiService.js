/**
 * vapiService.js
 * 
 * Handles immediate audio extraction from heavy video files using FFmpeg for optimization.
 * This ensures lightning fast analysis. It then securely uploads the extracted audio frame
 * to the Google AI File Manager so it can be used for multimodal generation in Gemini.
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Helper to determine MIME type from extension
 */
const getFileMimeType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.mp4': return 'video/mp4';
        case '.mov': return 'video/quicktime';
        case '.avi': return 'video/x-msvideo';
        case '.wmv': return 'video/x-ms-wmv';
        case '.flv': return 'video/x-flv';
        case '.webm': return 'video/webm';
        case '.3gp': return 'video/3gpp';
        case '.mpg':
        case '.mpeg': return 'video/mpeg';
        default: return null; // Unsupported for direct upload (e.g. .mkv)
    }
};

/**
 * Extracts audio from a video file and saves it as an MP3.
 * Returns the path to the generated audio file.
 */
const extractAudio = (videoPath) => {
    return new Promise((resolve, reject) => {
        const audioPath = videoPath.replace(path.extname(videoPath), '.mp3');
        console.log(`[VapiService] Extracting audio to: ${audioPath}`);

        let timeoutId;

        const command = ffmpeg(videoPath)
            .outputOptions([
                '-vn', // Disable video
                '-threads', '0' // Use all threads for maximum speed
            ])
            .audioCodec('libmp3lame') // Use MP3 codec
            .audioBitrate('32k') // Lower bitrate is faster and smaller
            .audioChannels(1) // Mono
            .audioFrequency(16000) // 16kHz is plenty for voice recognition
            .save(audioPath)
            .on('end', () => {
                console.log('[VapiService] Audio extraction complete.');
                clearTimeout(timeoutId);
                resolve(audioPath);
            })
            .on('error', (err) => {
                console.error('[VapiService] FFmpeg Error:', err);
                clearTimeout(timeoutId);
                reject(err);
            });

        // Set a 15-minute timeout for extraction
        timeoutId = setTimeout(() => {
            console.error('[VapiService] FFmpeg Timed Out.');
            if (command) {
                try {
                    command.kill('SIGKILL');
                } catch (e) { console.error("Could not kill ffmpeg:", e); }
            }
            reject(new Error("FFmpeg extraction timed out (15m limit)."));
        }, 15 * 60 * 1000);
    });
};

const processAudio = async (videoUrl) => {
    // Note: Function name is kept 'processAudio' for compatibility with AiService, 
    // but it now handles direct Video processing too.

    if (!process.env.GEMINI_API_KEY) {
        return { transcription: "Mock Transcription (No Key)", sentiment: "Neutral" };
    }

    const apiKey = process.env.GEMINI_API_KEY.trim();
    const fileManager = new GoogleAIFileManager(apiKey);
    const genAI = new GoogleGenerativeAI(apiKey);

    let tempAudioPath = null; // Track if we created a temp file to delete later
    let fileUri = null; // Declare fileUri here

    try {
        // Resolve absolute path
        const relativePath = videoUrl.startsWith('/') ? videoUrl.slice(1) : videoUrl;
        const videoAbsolutePath = path.join(__dirname, '../../', relativePath);

        if (!fs.existsSync(videoAbsolutePath)) {
            throw new Error(`File not found at ${videoAbsolutePath}`);
        }

        console.log(`[VapiService] Input File: ${videoAbsolutePath}`);

        // --- MASSIVE SPEED OPTIMIZATION ---
        // Instead of uploading a 500MB+ video which takes 10+ minutes to process in Gemini,
        // we forcefully extract a highly compressed MP3 (takes ~10 seconds)
        // and upload that instead. Gemini processes the 15MB MP3 in ~30 seconds.
        let isVideoUpload = false;
        let uploadPath = await extractAudio(videoAbsolutePath);
        tempAudioPath = uploadPath;
        let mimeType = "audio/mp3";

        // 1. Upload File (Audio)
        console.log(`[VapiService] Uploading AUDIO to Gemini...`);

        let uploadResult;
        try {
            uploadResult = await fileManager.uploadFile(uploadPath, {
                mimeType: mimeType,
                displayName: "Lecture Audio Fast",
            });
        } catch (uploadErr) {
            console.error("[VapiService] Upload Failed:", uploadErr);
            throw uploadErr;
        }

        fileUri = uploadResult.file.uri;
        console.log(`[VapiService] File Uploaded: ${fileUri}`);

        // 2. Wait for processing
        let file = await fileManager.getFile(uploadResult.file.name);
        let attempts = 0;
        const maxAttempts = 150; // 150 * 10s = 1500s (25 minutes) - Video takes longer
        const pollInterval = 10000; // 10 seconds

        console.log(`[VapiService] Waiting for ${isVideoUpload ? 'video' : 'audio'} processing...`);

        while (file.state === "PROCESSING" && attempts < maxAttempts) {
            attempts++;
            if (attempts % 2 === 0) console.log(`[VapiService] Processing... Attempt ${attempts}/${maxAttempts}`);
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
            file = await fileManager.getFile(uploadResult.file.name);
        }

        if (file.state === "FAILED") {
            throw new Error(`File processing failed by Gemini. State: ${file.state}`);
        }

        if (file.state === "PROCESSING") {
            console.warn("[VapiService] Processing timed out. Attempting generation anyway...");
        } else {
            console.log(`[VapiService] Processing Complete. State: ${file.state}`);
        }

        // --- MASSIVE SPEED OPTIMIZATION ---
        // 3. Bypass explicit transcription generation. 
        // We will pass the fileUri directly to Gemini for the COB report, 
        // asking it to do both transcription and analysis in a single pass!
        return {
            transcription: "Transcription processed directly by AI logically from the audio file.",
            fileUri: fileUri,
            mimeType: mimeType, // Return mimeType for downstream use
            sentiment: "Neutral"
        };

    } catch (error) {
        console.error("[VapiService] Error:", error);
        throw error;

    } finally {
        // Cleanup: Delete temp audio file if we created one
        if (tempAudioPath && fs.existsSync(tempAudioPath)) {
            try {
                fs.unlinkSync(tempAudioPath);
                console.log("[VapiService] Temporary audio file deleted.");
            } catch (e) {
                console.warn("[VapiService] Failed to delete temp file:", e.message);
            }
        }
    }
};

module.exports = { processAudio };
