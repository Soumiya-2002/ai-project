/**
 * AiService.js
 * 
 * Central orchestration module for all AI operations.
 * It manages the multi-step pipeline for analyzing an uploaded lecture video:
 * 1. Resolves the correct Grade-specific Rubric from the database.
 * 2. Uses VapiService to extract and process audio transcription/analysis.
 * 3. Uses NLMService to generate engagement/sentiment scores.
 * 4. Combines the context (Prompt, Reading Material, Lesson Plan, Vapi Audio) and sends it to GeminiService to generate the final COB report.
 * 5. Saves the generated analysis to the database and links it to the Lecture.
 */
const { Report, Rubric, Lecture } = require('../models');
const vapiService = require('./ai/vapiService');
const nlmService = require('./ai/nlmService');
const geminiService = require('./ai/geminiService');

class AiService {
    async analyzeVideo(fileUrl, lectureId, context = {}) {
        //console.log(`Starting AI Pipeline for Lecture ${lectureId}...`, context);

        const { readingMaterial, lessonPlan, meta } = context;

        let usedRubric = '';
        try {
            let grade = meta && meta.grade ? meta.grade : null;
            if (grade && grade !== 'N/A') {
                // Map the specific grade to the broader Rubric category
                let mappedGrade = grade;
                if (['KG1', 'KG2'].includes(grade)) {
                    mappedGrade = "KG 1 and KG 2";
                } else if (['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'].includes(grade)) {
                    mappedGrade = "Grade 1 to 8";
                } else if (['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].includes(grade)) {
                    mappedGrade = "Grade 9 to 12";
                }
                const rubric = await Rubric.findOne({ where: { grade: mappedGrade } });
                if (rubric && rubric.content) {
                    usedRubric = rubric.content;
                    console.log("Using Rubric:", usedRubric);
                }
            }
        } catch (e) {
            console.error("Error fetching rubric:", e);
        }

        if (!usedRubric || usedRubric.trim() === '') {
            usedRubric = `
        **Standard K12 Classroom Observation Rubric**
        
        **Category: Concepts (Weight: 50%)**
        1. **Concepts & Explanation**: (Max Score: 2)
           - Criteria: Teacher must handle concepts accurately without errors. Explanations should be clear, detailed, and age-appropriate.
        2. **Rectification - Concepts**: (Max Score: 2)
           - Criteria: Teacher must identify and correctly rectify any student misconceptions or errors immediately.

        **Category: Delivery (Weight: 20%)**
        3. **Subject Language**: (Max Score: 2)
           - Criteria: Teacher should use correct subject-specific terminology and clear language.
        4. **Communication & Pace**: (Max Score: 2)
           - Criteria: Voice should be audible, modulated, and the pace should allow students to follow.

        **Category: Facilitator-Student (Weight: 15%)**
        5. **Interaction & Engagement**: (Max Score: 2)
           - Criteria: Teacher should ask questions, encourage participation, and ensure a two-way learning process.

        **Category: Classroom Management (Weight: 15%)**
        6. **Time Management & Discipline**: (Max Score: 2)
           - Criteria: Session should flow broadly according to plan, maintaining student discipline and focus.
        `;
        }

        console.log("Using Rubric:", usedRubric.substring(0, 100) + "...");

        const SOP_PROMPT = `
        **SOP for generating COB reports using AI – Gemini 1.5 Pro**
        **Role**: Auditor/Observer.
        **Task**: Analyze the attached audio/video recording and evaluate it according to the specific instructions below.
        
        **CRITICAL INPUT: USER PROVIDED PROMPT / RUBRIC**
        """${usedRubric}"""

        **Supporting Materials**:
        1. Reading Material (if any): """${readingMaterial || "N/A"}"""
        2. Lesson Plan (if any): """${lessonPlan || "N/A"}"""
        
        **Instructions**:
        1. **Adhere Strictly to the User Provided Prompt**: The text above under "USER PROVIDED PROMPT / RUBRIC" contains the exact parameters, scoring rules, and evaluation criteria you MUST use. 
           - If it lists questions, answer them. 
           - If it lists a rubric table, fill it.
           - Do not use external standards unless the prompt explicitly asks for them.
        2. **Evidence Based**: All scores and comments must be backed by evidence from the recording.
        3. **Context**: Use the provided Lesson Plan and Reading Material to judge content accuracy and preparation.
        `;

        try {
            // 1. Vapi: Audio Processing & Transcription
            console.log("-> Step 1: Vapi Audio Analysis Started...");
            const vapiResult = await vapiService.processAudio(fileUrl);
            console.log("   Step 1 Complete: Vapi Transcription Received.", vapiResult);
            const transcription = vapiResult.transcription || "No transcription available.";

            // 2. NLM: Rubric & Engag ement Scoring (uses transcription)
            console.log("-> Step 2: NLM Rubric Scoring Started...");
            const nlmResult = await nlmService.generateRubricScore(transcription);
            console.log("   Step 2 Complete: NLM Scoring Generated.");

            // 3. Gemini: COB Reporting (uses transcription + context)
            console.log("-> Step 3: Gemini COB Analysis Started...");

            // Pass the FULL Prompt including the parsed content, AND the meta context, AND the file context
            const geminiResult = await geminiService.generateAnalysis(
                `${SOP_PROMPT}`,
                context.meta, // Pass the metadata object
                {
                    fileUri: vapiResult.fileUri,
                    mimeType: vapiResult.mimeType
                }
            );
            console.log("   Step 3 Complete: Gemini Analysis Finished.");

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
