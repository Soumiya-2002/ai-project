const { Report } = require('../models');
const vapiService = require('./ai/vapiService');
const nlmService = require('./ai/nlmService');
const geminiService = require('./ai/geminiService');

class AiService {
    async analyzeVideo(fileUrl, lectureId, context = {}) {
        //console.log(`Starting AI Pipeline for Lecture ${lectureId}...`, context);

        const { cobParams, readingMaterial, lessonPlan } = context;

        const SOP_PROMPT = `
        **SOP for generating COB reports using AI – Gemini 1.5 Pro**
        **Role**: Auditor/Observer.
        **Task**: Analyze the video transcription and evaluate it according to the specific instructions below.
        
        **CRITICAL INPUT: USER PROVIDED PROMPT / RUBRIC**
        """${cobParams || "Evaluate based on standard K12 teaching best practices."}"""

        **Supporting Materials**:
        1. Reading Material (if any): """${readingMaterial || "N/A"}"""
        2. Lesson Plan (if any): """${lessonPlan || "N/A"}"""
        
        **Instructions**:
        1. **Adhere Strictly to the User Provided Prompt**: The text above under "USER PROVIDED PROMPT / RUBRIC" contains the exact parameters, scoring rules, and evaluation criteria you MUST use. 
           - If it lists questions, answer them. 
           - If it lists a rubric table, fill it.
           - Do not use external standards unless the prompt explicitly asks for them.
        2. **Evidence Based**: All scores and comments must be backed by evidence from the video transcription.
        3. **Context**: Use the provided Lesson Plan and Reading Material to judge content accuracy and preparation.
        `;

        try {
            // 1. Vapi: Audio Processing & Transcription
            //console.log("-> Step 1: Vapi Audio Analysis Started...");
            const vapiResult = await vapiService.processAudio(fileUrl);
            //console.log("   Step 1 Complete: Vapi Transcription Received.");
            const transcription = vapiResult.transcription || "No transcription available.";

            // 2. NLM: Rubric & Engagement Scoring (uses transcription)
            //console.log("-> Step 2: NLM Rubric Scoring Started...");
            const nlmResult = await nlmService.generateRubricScore(transcription);
            //console.log("   Step 2 Complete: NLM Scoring Generated.");

            // 3. Gemini: COB Reporting (uses transcription + context)
            //console.log("-> Step 3: Gemini COB Analysis Started...");

            // Pass the FULL Prompt including the parsed content, AND the meta context
            const geminiResult = await geminiService.generateAnalysis(
                `Transcription: ${transcription}\n\n${SOP_PROMPT}`,
                context.meta // Pass the metadata object
            );
            //console.log("   Step 3 Complete: Gemini Analysis Finished.");

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

            //console.log(`AI Pipeline Success.Report Saved.`);
            return finalReport;

        } catch (error) {
            console.error("AI Pipeline Failed:", error);
            throw error; // Rethrow to handle in controller
        }
    }
}

module.exports = new AiService();
