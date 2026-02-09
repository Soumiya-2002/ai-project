const { Report } = require('../models');
const vapiService = require('./ai/vapiService');
const nlmService = require('./ai/nlmService');
const geminiService = require('./ai/geminiService');

class AiService {
    async analyzeVideo(fileUrl, lectureId, context = {}) {
        console.log(`Starting AI Pipeline for Lecture ${lectureId}...`, context);

        const { cobParams, readingMaterial, lessonPlan } = context;

        const SOP_PROMPT = `
        **SOP for generating COB reports using AI – Gemini 1.5 Pro**
        **Role**: Auditor/Observer.
        **Task**: Analyze the video against the provided COB parameters and Materials.
        
        **Inputs**:
        1. Video/Audio: ${fileUrl}
        2. COB Parameters (Parsed): 
           """${cobParams || "Using Default K1-K2 Template"}"""
        3. Reading Material (Parsed): 
           """${readingMaterial || "No reading material provided"}"""
        4. Lesson Plan (Parsed): 
           """${lessonPlan || "No lesson plan provided"}"""
        
        **Instructions**:
        - Identify any errors or deviations based strictly on the provided COB Parameters.
        - The AI does NOT judge 'IAR' (In Accordance with Rules). Only report observed errors.
        - If the teacher deviates from the Lesson Plan or doesn't use the Reading Material effectively, note it.
        `;

        try {
            // 1. Vapi: Audio Processing & Transcription
            console.log("-> Step 1: Vapi Audio Analysis");
            const vapiResult = await vapiService.processAudio(fileUrl);
            const transcription = vapiResult.transcription || "No transcription available.";

            // 2. NLM: Rubric & Engagement Scoring (uses transcription)
            console.log("-> Step 2: NLM Rubric Scoring");
            const nlmResult = await nlmService.generateRubricScore(transcription);

            // 3. Gemini: COB Reporting (uses transcription + context)
            console.log("-> Step 3: Gemini COB Analysis");
            // We pass the FULL Prompt including the parsed content
            const geminiResult = await geminiService.generateAnalysis(
                `Transcription: ${transcription}\n\n${SOP_PROMPT}`
            );

            // 4. Aggregate & Save
            const finalReport = {
                meta: {
                    lecture_id: lectureId,
                    video_url: fileUrl,
                    generated_at: new Date()
                },
                vapi_analysis: vapiResult,
                nlm_analysis: nlmResult,
                ...geminiResult, // Spread COB Report fields (cob_analysis, errors, etc.)
                auditor_note: "AI Analysis Complete. Please verify."
            };

            // Calculate formatted aggregate score (Simple average or from NLM)
            const score = nlmResult.engagement ? (nlmResult.engagement * 10) : 85;

            await Report.create({
                lecture_id: lectureId,
                analysis_data: JSON.stringify(finalReport),
                score: Math.min(100, Math.max(0, score)),
                generated_by_ai: true
            });

            console.log(`AI Pipeline Success.Report Saved.`);
            return finalReport;

        } catch (error) {
            console.error("AI Pipeline Failed:", error);
            throw error; // Rethrow to handle in controller
        }
    }
}

module.exports = new AiService();
