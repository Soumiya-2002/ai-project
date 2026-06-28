/**
 * lessonPlanAiService.js
 * 
 * Separate AI service dedicated strictly to the Lesson Plan Analysis pipeline.
 * Evaluates lesson plan documents against a structured rubric without requiring video/audio processing.
 */
const { Report, Rubric } = require('../../lessonPlanModels');
const { GoogleGenerativeAI } = require("@google/generative-ai");

class LessonPlanAiService {
    async analyzeLessonPlanOnly(lectureId, context = {}) {
        const { lessonPlan, meta } = context;

        let usedRubric = '';
        let usedRubricName = 'Standard K12 Lesson Plan Rubric';
        let usedRubricUrl = '';
        try {
            let grade = meta && meta.grade ? meta.grade : null;
            if (grade && grade !== 'N/A') {
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
        **Standard K12 Lesson Plan Evaluation Rubric**
        
        **Category: Planning & Structure (Weight: 50%)**
        1. **Objective Clarity**: (Max Score: 2)
           - Criteria: The lesson plan must have clear, measurable objectives aligned with the grade level.
        2. **Sequence & Pacing**: (Max Score: 2)
           - Criteria: The plan should outline a logical progression of activities with appropriate time allocation.

        **Category: Content & Pedagogy (Weight: 50%)**
        3. **Subject Accuracy & Depth**: (Max Score: 2)
           - Criteria: Concepts outlined should be accurate and age-appropriate.
        4. **Assessment & Activities**: (Max Score: 2)
           - Criteria: Activities should be engaging and include clear methods of assessing student understanding.
        `;
        }

        try {
            const SOP_PROMPT = `
            You are an elite Educational Auditor. Your job is to evaluate the provided Lesson Plan based STRICTLY on the User Provided Rubric (which is in CSV/Excel format).
            
            **METADATA CONTEXT:**
            - Teacher Name: ${meta.facilitator || "N/A"}
            - School: ${meta.school || "N/A"}
            - Grade: ${meta.grade || "N/A"}
            - Subject: ${meta.subject || "N/A"}
            - Date: ${meta.date || "Today"}

            **CRITICAL INPUT: USER PROVIDED PROMPT / RUBRIC**
            """${usedRubric}"""

            **Lesson Plan Content**: 
            """${lessonPlan || "No lesson plan text provided."}"""
            
            **Instructions**:
            1. **Adhere Strictly to the User Provided Prompt**: The rubric above defines the exact parameters, scoring rules, OOI (weightage), and "If No" consequences.
               - **CRITICAL: You MUST extract and output an evaluation for EVERY single parameter listed in the rubric. Do NOT skip any parameter.**
               - **CRITICAL: Evaluation MUST be based strictly on the 'Lesson Plan Content' provided above. The 'METADATA CONTEXT' is strictly for the output header and MUST NOT be used to satisfy rubric parameters. If a parameter (like Grade, Subject, Topic, etc.) is missing from the Lesson Plan Content itself, you MUST score it as missing (No/0 or 1), even if it exists in the Metadata Context.**
            2. **Scoring Logic**:
               - Read the Lesson Plan and evaluate it against each parameter constructively and fairly.
               - Set **"yes_no"** to "Yes" or "No".
               - Assign a **Raw Score** based on this exact rule:
                 - **2** = Addressed (Yes). Default to this if the teacher has made a reasonable attempt. Assume positive intent.
                 - **1** = Needs rework (No). Use this if the requirement is partially attempted but missing key details.
                 - **0** = Rejected (No). Use this only if the requirement is completely missing.
               - **Note**: Give the teacher the benefit of the doubt for minor formatting issues, but do NOT award points for required information that is entirely absent from the text of the lesson plan.
               - Extract the exact **OOI** value (number) for that parameter from the rubric. If missing, assume 1.
               - Extract the EXACT "If No" consequence from the rubric for that parameter (e.g., "REWORK REQUIRED", "RESUBMISSION REQUIRED").
               - Provide a brief "remark" explaining the evidence.
            
            **OUTPUT FORMAT (JSON):**
            Provide the output as a valid JSON object matching exactly this structure:
            {
                "lesson_plan_report": {
                    "header": {
                        "facilitator": "${meta.facilitator || "N/A"}",
                        "school": "${meta.school || "N/A"}",
                        "grade": "${meta.grade || "N/A"}",
                        "section": "${meta.section || "N/A"}",
                        "subject": "${meta.subject || "N/A"}",
                        "date": "${meta.date || "N/A"}",
                        "rubric_name": "${usedRubricName}",
                        "rubric_url": "${usedRubricUrl}"
                    },
                    "parameters": [
                        {
                            "heading": "Category/Heading Name",
                            "parameter_no": "1",
                            "parameter": "Parameter description from rubric",
                            "yes_no": "Yes",
                            "raw_score": 2, 
                            "ooi": 1,
                            "if_no_consequence": "REWORK REQUIRED",
                            "remark": "Evidence/reasoning from the lesson plan."
                        }
                    ]
                }
            }
            `;

            console.log("-> Step 1: Gemini Lesson Plan Analysis Started (Custom OOI Format)...");

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-pro",
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.4,
                    topK: 32,
                    topP: 0.8
                }
            });

            const result = await model.generateContent(SOP_PROMPT);
            const responseText = result.response.text();
            let parsedReport = {};
            
            try {
                parsedReport = JSON.parse(responseText);
            } catch(e) {
                console.error("Failed to parse Gemini JSON output", responseText);
                throw new Error("Invalid JSON from AI");
            }

            console.log("   Step 1 Complete: Gemini Analysis Finished.");

            const reportData = parsedReport.lesson_plan_report || {};
            const params = reportData.parameters || [];

            // Calculate overall status and numerical totals
            let hasResubmission = false;
            let hasRework = false;
            let allPerfect = true;
            let totalEarnedScore = 0;
            let totalOutOf = 0;

            params.forEach(p => {
                // Ensure numbers
                const rawScore = parseInt(p.raw_score, 10) || 0;
                const ooi = parseInt(p.ooi, 10) || 1;
                
                // Calculate values
                const weightedScore = rawScore * ooi;
                const outOf = ooi * 2;
                
                p.weighted_score = weightedScore;
                p.out_of = outOf;

                totalEarnedScore += weightedScore;
                totalOutOf += outOf;

                // Status Logic: If less than 2, trigger consequence
                if (rawScore < 2) {
                    allPerfect = false;
                    const cons = String(p.if_no_consequence).toUpperCase();
                    if (cons.includes('RESUBMISSION')) {
                        hasResubmission = true;
                    } else if (cons.includes('REWORK')) {
                        hasRework = true;
                    }
                }
            });

            let finalStatus = "ACCEPTED";
            if (hasResubmission) {
                finalStatus = "RESUBMISSION REQUIRED";
            } else if (hasRework) {
                finalStatus = "REWORK REQUIRED";
            }

            reportData.overall_status = finalStatus;

            // Calculate overall percentage
            let overallPercentage = 0;
            if (totalOutOf > 0) {
                overallPercentage = (totalEarnedScore / totalOutOf) * 100;
            }
            reportData.scores = {
                overall_percentage: overallPercentage.toFixed(1) + "%"
            };

            const finalReport = {
                meta: {
                    lecture_id: lectureId,
                    video_url: null,
                    generated_at: new Date()
                },
                lesson_plan_report: reportData,
                auditor_note: "AI Analysis Complete (Lesson Plan OOI Based). Please verify."
            };

            // DB Numeric score mapping
            let dbScore = overallPercentage; 
            // Optional DB score override if status is strictly tied to numeric sorting logic
            // If you want to keep the 100/50/0 logic for DB sorting, you can uncomment below:
            /*
            if (finalStatus === "RESUBMISSION REQUIRED") dbScore = 0;
            else if (finalStatus === "REWORK REQUIRED") dbScore = 50;
            else dbScore = 100;
            */

            await Report.create({
                lecture_id: lectureId,
                analysis_data: JSON.stringify(finalReport),
                score: dbScore,
                generated_by_ai: true
            });

            console.log(`AI Pipeline Success (Lesson Plan Only). Report Saved with status: ${finalStatus}`);
            return finalReport;

        } catch (error) {
            console.error("AI Pipeline Failed:", error);
            throw error;
        }
    }
}

module.exports = new LessonPlanAiService();
