/**
 * geminiService.js
 * 
 * This service directly interacts with the Google Gemini API (Multimodal capabilities).
 * It sends structured system prompts, the lesson plan text, reading material,
 * and the extracted audio URL to process and generate an educational Classroom Observation Report in JSON format.
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Mock Data Fallback
const getMockData = () => {
    return {
        "cob_report": {
            "header": {
                "facilitator": "Mock Teacher",
                "topic_blm": "Mock Topic - Algebra",
                "duration": "45m",
                "session_type": "Classroom",
                "school": "Greenwood High",
                "grade": "7",
                "date": new Date().toDateString()
            },
            "scores": {
                "overall_percentage": "78%",
                "summary": "(MOCK) The session was interactive but pace was fast. Concepts were covered but some students seemed confused. Note: This is an AI-simulated report due to API limits."
            },
            "parameters": [
                { "category": "Concepts", "name": "Concepts & Explanation", "score": 2, "out_of": 2, "comment": "Observed: No conceptual errors found. Teacher explained the topics clearly." },
                { "category": "Concepts", "name": "Rectification - Concepts", "score": 2, "out_of": 2, "comment": "Observed: All student errors were rectified immediately and correctly." },
                { "category": "Delivery", "name": "Speaking Skills & Language", "score": 1, "out_of": 2, "comment": "Observed: Generally clear but some pronunciation issues with 'Algebraic'." },
                { "category": "Resources", "name": "Resources & Aids", "score": 1, "out_of": 1, "comment": "Observed: Teacher used the whiteboard effectively." },
                { "category": "Time Utilisation", "name": "Time Management", "score": 1, "out_of": 1, "comment": "Observed: Session started and ended on time." },
                { "category": "Plan Adherence", "name": "Lesson Plan Followed", "score": 1, "out_of": 1, "comment": "Observed: Followed the sequence defined in the plan." }
            ],
            "what_happened": [
                "The facilitator covered the concepts 'activities that disturb water' and 'ways to save water' in the session.",
                "She commenced the session by stating the agendas of the session.",
                "She concluded the session by assigning the homework."
            ],
            "highlights": ["Good energy", "Clear instructions"],
            "other_observations": ["Students were engaged"]
        }
    };
};

const generateAnalysis = async (textInput, meta = {}, fileContext = {}) => {
    console.log("Calling Gemini API for Detailed Report...", meta, fileContext);

    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is missing. Returning mock COB Report.");
        return getMockData();
    }

    const validModels = [
        "gemini-1.5-flash", // Prioritize Flash for multimodal
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-pro" // might fail for video if not 1.5-pro, but we prioritize flash
    ];

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Construct Prompt with specific metadata instructions
    const prompt = `
        You are an elite Educational Auditor. Your job is to evaluate the ATTACHED classroom lecture audio/video recording based STRICTLY on the User Provided Rubric / Instructions below.
        Listen carefully to the recording and act as an expert evaluator.
        
        **METADATA CONTEXT:**
        - Teacher Name: ${meta.facilitator || "Identify from recording"}
        - School: ${meta.school || "Identify from recording"}
        - Grade: ${meta.grade || "Identify"}
        - Subject: ${meta.subject || "Identify"}
        - Date: ${meta.date || "Today"}

        **INPUTS:**
        ${textInput}
        
        ---
        **CRITICAL INSTRUCTION: FOLLOW THE USER RUBRIC**
        The "USER PROVIDED PROMPT / RUBRIC" section in the inputs above defines the specific criteria you must evaluate.
        
        1. **Identify Criteria**: Extract the specific parameters, questions, or criteria asked for in the user's prompt.
           - If the prompt is a list of questions, each question is a parameter.
           - If the prompt is a standard rubric table, each row is a parameter.
           - **LOOK FOR MARKING SCHEME**: If the rubric mentions "Marks", "Weightage", or "Points" for each parameter, extract it.
        2. **Evaluate & Score**:
           - Assign a score for each identified parameter based ONLY on the evidence from the recording.
           - If the user prompt defines a specific scoring scale (e.g., 1-5, or Yes/No), USE IT.
           - If no scale is defined, use a default 1-5 scale (1=Poor, 5=Excellent).
        **CRITICAL INSTRUCTION: DATA COMPLETENESS & ALL POINTS**
        - **EVALUATE EVERY SINGLE POINT**: You MUST extract and evaluate EVERY SINGLE point, question, or parameter listed in the provided Rubric. Do NOT skip any. If the rubric has 25 points, your JSON 'parameters' array MUST have 25 items.
        - **Duration**: NEVER use "N/A". If you can't tell perfectly, estimate it based on the recording length or use "45m" as a standard default.
        - **Weight**: 
            1. SCAN the User Provided Rubric for columns/text like "Weightage", "Weight", or "Percentage" next to each parameter.
            2. If found, use that EXACT value (e.g., "20%", "5", "10 pts").
            3. If NOT found, use default "1".
            4. NEVER leave as "N/A".

        **OUTPUT FORMAT (JSON):**
        {
            "cob_report": {
                "header": {
                    "facilitator": "${meta.facilitator || "Name"}",
                    "school": "${meta.school || "School"}",
                    "grade": "${meta.grade || "Grade"}",
                    "section": "${meta.section || "Section"}",
                    "subject": "${meta.subject || "Subject"}",
                    "date": "${meta.date || "Date"}",
                    "topic_blm": "Topic identified from recording",
                    "duration": "45m",
                    "session_type": "Classroom"
                },
                "scores": {
                    "overall_percentage": "XX%",
                    "summary": "Brief executive summary of the observation."
                },
                "parameters": [
                    {
                        "category": "Category Name (e.g. 'General' or specific section from rubric)",
                        "name": "Parameter Name / Question from Rubric",
                        "score": X,
                        "out_of": Y,
                        "weight": "1",
                        "comment": "Specific evidence from the recording."
                    }
                ],
                "what_happened": [
                    "The facilitator covered the concepts...",
                    "She used visual aids to conduct this session."
                ],
                "highlights": ["Strength 1", "Strength 2"],
                "other_observations": ["Improvement Area 1", "Improvement Area 2"]
            }
        }
    `;

    // Prepare Request Payload (Multimodal aware)
    let requestPayload;
    if (fileContext && fileContext.fileUri && fileContext.mimeType) {
        console.log("Using Multimodal Payload (Video + Text)");
        requestPayload = [
            {
                fileData: {
                    mimeType: fileContext.mimeType,
                    fileUri: fileContext.fileUri
                }
            },
            { text: prompt }
        ];
    } else {
        requestPayload = prompt;
    }

    // Try each model until one works
    for (const modelName of validModels) {
        try {
            console.log(`Attempting generation with model: ${modelName}...`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const result = await model.generateContent(requestPayload);
            const responseText = result.response.text();
            console.log(`✅ Success with ${modelName}. Parsing response...`);

            let cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

            let parsedResult;
            try {
                parsedResult = JSON.parse(cleanText);
            } catch (parseError) {
                console.warn(`JSON Parse Failed for ${modelName}. Trying to sanitize...`);
                cleanText = cleanText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
                try {
                    parsedResult = JSON.parse(cleanText);
                } catch (retryError) {
                    console.error(`Critical JSON Parse Error for ${modelName}. Continuing to next model...`);
                    continue;
                }
            }

            // ENFORCE METADATA OVERRIDE (To ensure no N/A if we have data)
            if (parsedResult && parsedResult.cob_report && parsedResult.cob_report.header) {
                if (meta.facilitator && meta.facilitator !== 'Unknown Teacher') parsedResult.cob_report.header.facilitator = meta.facilitator;
                if (meta.school && meta.school !== 'Unknown School') parsedResult.cob_report.header.school = meta.school;
                if (meta.grade && meta.grade !== 'N/A') parsedResult.cob_report.header.grade = meta.grade;
                if (meta.section && meta.section !== 'N/A') parsedResult.cob_report.header.section = meta.section;
                if (meta.subject && meta.subject !== 'N/A') parsedResult.cob_report.header.subject = meta.subject;
                if (meta.date) parsedResult.cob_report.header.date = meta.date;
            }

            return parsedResult;

        } catch (error) {
            console.warn(`❌ Model ${modelName} failed: ${error.message}`);
            // Continue to the next model in the loop
        }
    }

    // If we exit the loop, all models failed
    console.error("All Gemini models failed. Returning Mock Data.");
    console.warn("⚠️ AI SERVICE ERROR. Returning Mock Data to allow workflow continuation.");
    return getMockData();
};

module.exports = { generateAnalysis };
