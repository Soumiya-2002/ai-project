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

    async analyzeLessonPlan(fileUrl, lectureId, context = {}) {
        console.log(`Starting AI Pipeline for Lesson Plan ${lectureId}...`, context);

        const { lessonPlan, meta } = context;

        const { Report, Rubric } = require('../lessonPlanModels');
        let usedRubric = '';
        let usedRubricName = 'Lesson Plan Evaluation Rubric';
        let usedRubricUrl = '';
        try {
            // First check for school_id rubric
            let whereClause = {};
            if (meta && meta.school_id) {
                whereClause.school_id = meta.school_id;
            }

            if (Rubric) {
                let rubric = await Rubric.findOne({ where: whereClause, order: [['createdAt', 'DESC']] });
                
                // Fallback to a global rubric
                if (!rubric) {
                    rubric = await Rubric.findOne({ where: { school_id: null }, order: [['createdAt', 'DESC']] });
                }

                if (rubric && rubric.content) {
                    usedRubric = rubric.content;
                    usedRubricName = rubric.original_name;
                    const baseUrl = process.env.BACKEND_URL || 'https://lmsapi.nitisolutions.com';
                    usedRubricUrl = `${baseUrl}${rubric.file_path}`;
                    console.log(`Using Lesson Plan Rubric: ${usedRubricName} (${usedRubricUrl})`);
                }
            }
        } catch (e) {
            console.error("Error fetching lesson plan rubric:", e);
        }

        if (!usedRubric || usedRubric.trim() === '') {
            usedRubric = `
        **Lesson Plan Audit Rubric**
        Header: General
        Parameter 1: Does the lesson plan include clear objectives? (OOI: 3)
        Parameter 2: Are the activities age-appropriate? (OOI: 2)
        `;
        }

        console.log("Using Rubric:", usedRubric.substring(0, 100) + "...");

        try {
            console.log("-> Step 1: Gemini Lesson Plan Analysis Started...");

            const SOP_PROMPT = `
            **SOP for analyzing Lesson Plans using AI – Gemini 1.5 Pro**
            **Role**: Academic Auditor.
            **Task**: Analyze the attached Lesson Plan Document and evaluate it according to the specific Excel Rubric provided below.
            
            **CRITICAL INPUT: USER PROVIDED EXCEL RUBRIC**
            """${usedRubric}"""

            **Attached Lesson Plan**:
            """${lessonPlan || "N/A"}"""
            
            **Instructions**:
            1. **Adhere Strictly to the Excel Rubric**: The text above under "USER PROVIDED EXCEL RUBRIC" contains the exact parameters and OOI (Priority Weights) you MUST use. 
            2. **Scoring Logic**:
               - Evaluate if the parameter is met in the Lesson Plan. Answer Yes or No.
               - Determine the Base Score:
                 * Perfectly Right = 2
                 * Rework Needed = 1
                 * Resubmit / Rejected = 0
               - Multiply the Base Score by the OOI value to get the 'Earned Score'.
               - The Max Score for a parameter is OOI * 2.
            3. **Output Format Requirement**:
               When generating the JSON response, map the Rubric parameters to the 'parameters' array in the cob_report.
               - 'category': The rubric heading.
               - 'parameter': The rubric parameter text.
               - 'score': The Base Score (0, 1, or 2).
               - 'out_of': 2.
               - 'weight': The OOI value.
               - 'auditor_note': State whether the parameter was met (Yes/No) and provide a brief justification based on the lesson plan.
            `;

            // Pass the FULL Prompt including the parsed content, AND the meta context
            const geminiResult = await geminiService.generateAnalysis(
                `${SOP_PROMPT}`,
                context.meta, // Pass the metadata object
                {
                    fileUri: null, // No video
                    mimeType: null
                }
            );
            console.log("   Step 1 Complete: Gemini Analysis Finished.");

            // Inject the rubric reference into the generated report's header BEFORE it gets saved
            if (geminiResult && geminiResult.cob_report && geminiResult.cob_report.header) {
                geminiResult.cob_report.header.rubric_name = usedRubricName;
                geminiResult.cob_report.header.rubric_url = usedRubricUrl;
            }

            // 4. Aggregate & Save
            const finalReport = {
                meta: {
                    lecture_id: lectureId,
                    video_url: fileUrl, // Contains path to lesson plan pdf
                    generated_at: new Date()
                },
                vapi_analysis: null,
                nlm_analysis: null,
                ...geminiResult,
                auditor_note: "Lesson Plan AI Analysis Complete. Please verify."
            };

            // Calculate formatted aggregate score based on Weighted Percentage
            let calculatedScore = 0;
            if (geminiResult && geminiResult.cob_report && geminiResult.cob_report.parameters) {
                let totalWeight = 0;
                let earnedWeightedScore = 0;

                geminiResult.cob_report.parameters.forEach(p => {
                    let wStr = String(p.weight || "1").replace(/[^0-9.]/g, '');
                    let w = parseFloat(wStr) || 1;

                    let isNA = p.score === null || p.score === 'NA' || p.score === 'N/A' || p.score === 'null';

                    if (!isNA) {
                        let sStr = String(p.score).match(/^[0-9.]+/);
                        let s = sStr ? parseFloat(sStr[0]) : 0;

                        let outOfStr = String(p.out_of).match(/^[0-9.]+/);
                        let outOf = outOfStr ? parseFloat(outOfStr[0]) : 1;

                        if (outOf > 0) {
                            earnedWeightedScore += (s / outOf) * w;
                            totalWeight += w;
                        }
                    }
                });

                if (totalWeight > 0) {
                    calculatedScore = (earnedWeightedScore / totalWeight) * 100;
                }

                if (!geminiResult.cob_report.scores) geminiResult.cob_report.scores = {};
                geminiResult.cob_report.scores.overall_percentage = calculatedScore.toFixed(1) + "%";
            }

            const finalScoreToSave = calculatedScore > 0 ? calculatedScore : 85;

            await Report.create({
                lecture_id: lectureId,
                analysis_data: JSON.stringify(finalReport),
                score: Math.min(100, Math.max(0, finalScoreToSave)),
                generated_by_ai: true
            });

            console.log(`Lesson Plan AI Pipeline Success. Report Saved.`);
            return finalReport;

        } catch (error) {
            console.error("Lesson Plan AI Pipeline Failed:", error);
            throw error;
        }
    }

    async analyzeVideo(fileUrl, lectureId, context = {}) {
        //console.log(`Starting AI Pipeline for Lecture ${lectureId}...`, context);

        const { readingMaterial, lessonPlan, meta } = context;

        let usedRubric = '';
        let usedRubricName = 'Standard K12 Classroom Observation Rubric';
        let usedRubricUrl = '';
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

                let whereClause = { grade: mappedGrade };
                if (meta && meta.school_id) {
                    whereClause.school_id = meta.school_id;
                }

                let rubric = await Rubric.findOne({ where: whereClause, order: [['createdAt', 'DESC']] });

                // Fallback to a global rubric if a school-specific one does not exist
                if (!rubric) {
                    rubric = await Rubric.findOne({ where: { grade: mappedGrade, school_id: null }, order: [['createdAt', 'DESC']] });
                }

                if (rubric && rubric.content) {
                    usedRubric = rubric.content;
                    usedRubricName = rubric.original_name;
                    const baseUrl = process.env.BACKEND_URL || 'https://lmsapi.nitisolutions.com';
                    usedRubricUrl = `${baseUrl}${rubric.file_path}`;
                    console.log(`Using Rubric: ${usedRubricName} (${usedRubricUrl})`);
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

        try {
            // 1. Vapi: Audio Processing & Transcription
            console.log("-> Step 1: Vapi Audio Analysis Started...");
            const vapiResult = await vapiService.processAudio(fileUrl);
            console.log("   Step 1 Complete: Vapi Transcription Received.", vapiResult);
            const transcription = vapiResult.transcription || "No transcription available.";

            const SOP_PROMPT = `
            **SOP for generating COB reports using AI – Gemini 1.5 Pro**
            **Role**: Auditor/Observer.
            **Task**: Analyze the attached audio/video recording and evaluate it according to the specific instructions below.
            
            **CRITICAL INPUT: USER PROVIDED PROMPT / RUBRIC**
            """${usedRubric}"""

            **Supporting Materials**:
            1. Reading Material (if any): """${readingMaterial || "N/A"}"""
            2. Lesson Plan (if any): """${lessonPlan || "N/A"}"""
            3. Video Transcription: """${transcription}"""
            
            **Instructions**:
            1. **Adhere Strictly to the User Provided Prompt**: The text above under "USER PROVIDED PROMPT / RUBRIC" contains the exact parameters, scoring rules, and evaluation criteria you MUST use. 
               - **CRITICAL: You MUST extract and output an evaluation for EVERY single parameter listed in the rubric. Do NOT skip any parameter.**
               - If it lists questions, answer them. 
               - If it lists a rubric table, fill it.
               - Do not use external standards unless the prompt explicitly asks for them.
            2. **Human-like, Realistic Auditing**: Evaluate the teacher like an expert human auditor.
               - **Realistic Scoring**: Even if almost everything is correct, a realistic 'excellent' score should be around 85% to 94%. NO ONE should receive a perfect 100% overall. 
               - Find at least 1 or 2 minor areas where the teacher could improve (e.g., pace, deeper probing questions, handling minor distractions) and deduct partial marks there to make the evaluation realistic.
               - However, be FAIR. Do not arbitrarily give 0s if they actually attempted the criteria. Give partial marks if they did a decent job but weren't flawless.
               - Always cross-reference the concepts taught in the video against the provided 'Reading Material' and 'Lesson Plan'. If they deviate negatively or make errors, penalize the score accordingly.
            3. **Negative Parameters**: If a rubric parameter is worded negatively (e.g., "Makes no conceptual errors"), you MUST actively scrutinize the transcript to ensure there are absolutely no errors, half-truths, or incomplete concepts before awarding the maximum score. If any error exists, penalize the score.
            `;

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

            // Inject the rubric reference into the generated report's header BEFORE it gets saved
            if (geminiResult && geminiResult.cob_report && geminiResult.cob_report.header) {
                geminiResult.cob_report.header.rubric_name = usedRubricName;
                geminiResult.cob_report.header.rubric_url = usedRubricUrl;
            }

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

            // Calculate formatted aggregate score based on Weighted Percentage
            let calculatedScore = 0;
            if (geminiResult && geminiResult.cob_report && geminiResult.cob_report.parameters) {
                let totalWeight = 0;
                let earnedWeightedScore = 0;

                geminiResult.cob_report.parameters.forEach(p => {
                    let wStr = String(p.weight || "1").replace(/[^0-9.]/g, '');
                    let w = parseFloat(wStr) || 1;

                    // Check if score is explicitly N/A or null
                    let isNA = p.score === null || p.score === 'NA' || p.score === 'N/A' || p.score === 'null';

                    if (!isNA) {
                        let sStr = String(p.score).match(/^[0-9.]+/);
                        let s = sStr ? parseFloat(sStr[0]) : 0;

                        let outOfStr = String(p.out_of).match(/^[0-9.]+/);
                        let outOf = outOfStr ? parseFloat(outOfStr[0]) : 1;

                        if (outOf > 0) {
                            earnedWeightedScore += (s / outOf) * w;
                            totalWeight += w;
                        }
                    }
                });

                if (totalWeight > 0) {
                    calculatedScore = (earnedWeightedScore / totalWeight) * 100;
                }

                // Override the overall_percentage accurately
                if (!geminiResult.cob_report.scores) geminiResult.cob_report.scores = {};
                geminiResult.cob_report.scores.overall_percentage = calculatedScore.toFixed(1) + "%";
            }

            const finalScoreToSave = calculatedScore > 0 ? calculatedScore : (nlmResult.engagement ? (nlmResult.engagement * 10) : 85);

            await Report.create({
                lecture_id: lectureId,
                analysis_data: JSON.stringify(finalReport),
                score: Math.min(100, Math.max(0, finalScoreToSave)),
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
