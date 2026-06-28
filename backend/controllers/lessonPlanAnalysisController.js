const { Report, Lecture, User, School, Class } = require('../lessonPlanModels');
const { processAudio } = require('../services/ai/vapiService');
const { generateAnalysis } = require('../services/ai/geminiService');
const { generateRubricScore } = require('../services/ai/nlmService');
const { generateLessonPlanReportFromHtml } = require('../services/lessonPlan/lessonPlanReportService');
const path = require('path');
const fs = require('fs');

/**
 * analysisController.js
 * 
 * Handles the retrieval and generation of AI Analysis Reports.
 * It contains functions to retrieve reports by lecture ID, and re-generate/patch
 * detailed PDF reports for download.
 */

/**
 * Runs the AI analysis manually (if not done in background).
 * Orchestrates Vapi, Gemini, and NLM services to generate the final Report.
 */
const runAnalysis = async (req, res) => {
    try {
        const { lecture_id } = req.params;

        const lecture = await Lecture.findByPk(lecture_id);
        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found' });
        }

        if (!lecture.video_url) {
            return res.status(400).json({ message: 'No video uploaded for this lecture' });
        }

        // 1. Process Video/Audio (Vapi)
        // In a real app, we'd extract audio from video_url first
        const vapiResult = await processAudio(lecture.video_url);

        // 2. Generate Text Analysis (Gemini)
        // Note: For new analysis, we can also pass meta here if we wanted, 
        // but typically uploadController handles the initial detailed analysis call if configured.
        // However, if this endpoint is hitting geminiService directly:
        const analysisText = await generateAnalysis(vapiResult.transcription);

        // 3. Generate Rubric Scores (NLM)
        const rubricScores = await generateRubricScore(analysisText);

        // 4. Save Report
        const report = await Report.create({
            lecture_id: lecture.id,
            analysis_data: analysisText,
            rubric_scores: rubricScores,
            generated_by_ai: true
        });

        res.json(report);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * Retrieves an existing AI Analysis report from the database by Lecture ID.
 * Returns the raw JSON data of the report.
 */
const getReport = async (req, res) => {
    try {
        const { lecture_id } = req.params;
        const report = await Report.findOne({ where: { lecture_id } });

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * Downloads the AI Report as a formatted PDF.
 * If the PDF already exists and metadata is complete, it serves it directly.
 * Otherwise, it patches missing metadata (School/Teacher) and uses htmlReportService
 * to generate a brand new PDF on the fly before sending it to the client.
 */
const downloadReport = async (req, res) => {
    try {
        const { lecture_id } = req.params;
        const report = await Report.findOne({ where: { lecture_id } });

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Parse Data
        let analysisData = report.analysis_data;
        if (typeof analysisData === 'string') {
            try { analysisData = JSON.parse(analysisData); } catch (e) { console.error("JSON Parse Error", e); }
        }

        // Check if Metadata is missing or "N/A"
        let needsPatching = false;
        const reportRoot = analysisData.lesson_plan_report || analysisData.cob_report || {};
        const header = reportRoot.header || {};
        
        if (
            !header.school || header.school === 'N/A' || header.school === 'Unknown School' ||
            !header.facilitator || header.facilitator === 'N/A' || header.facilitator === 'Unknown Teacher' || header.facilitator === 'Name'
        ) {
            needsPatching = true;
        }

        const existingReportPath = path.join(__dirname, '../uploads', `report-${lecture_id}.pdf`);

        // If file exists AND we don't need to patch, serve it fast
        if (fs.existsSync(existingReportPath) && !needsPatching) {
            //console.log(`Serving existing report for ID ${lecture_id}`);
            return res.download(existingReportPath, `Report-${lecture_id}.pdf`);
        }

        // Prepare for Generation / Patching
        const tempDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        const tempPath = path.join(tempDir, `report-${lecture_id}.pdf`);

        if (needsPatching) {
            //console.log(`Patching metadata for Report ID ${lecture_id}...`);
            try {
                // Fetch details
                const lecture = await Lecture.findByPk(lecture_id, {
                    include: [
                        { model: User, as: 'Teacher', include: [{ model: School }] },
                        { model: Class, include: [{ model: School }] }
                    ]
                });

                if (lecture) {
                    // Update Header
                    if (!analysisData.lesson_plan_report) analysisData.lesson_plan_report = {};
                    if (!analysisData.lesson_plan_report.header) analysisData.lesson_plan_report.header = {};

                    if (lecture.Teacher) {
                        analysisData.lesson_plan_report.header.facilitator = lecture.Teacher.name;
                        if (lecture.Teacher.School) {
                            analysisData.lesson_plan_report.header.school = lecture.Teacher.School.name;
                        }
                    }
                    if (lecture.Class) {
                        // Inherit grade/section
                        analysisData.lesson_plan_report.header.grade = lecture.Class.name;
                        analysisData.lesson_plan_report.header.section = lecture.Class.section;
                        // If school wasn't found on teacher
                        if (!analysisData.lesson_plan_report.header.school && lecture.Class.School) {
                            analysisData.lesson_plan_report.header.school = lecture.Class.School.name;
                        }
                    }
                    // Persist date
                    if (lecture.date) {
                        analysisData.lesson_plan_report.header.date = lecture.date;
                    }

                    // Save back to DB to fix it permanently
                    if (report.update) {
                        await report.update({ analysis_data: JSON.stringify(analysisData) });
                    } else {
                        report.analysis_data = JSON.stringify(analysisData);
                        await report.save();
                    }
                }
            } catch (patchErr) {
                console.error("Error patching metadata:", patchErr);
            }
        }

        // Generate PDF using Puppeteer (HTML Service)
        //console.log(`Generating PDF for ID ${lecture_id}...`);
        await generateLessonPlanReportFromHtml(analysisData, tempPath);

        // Send to user
        res.download(tempPath, `Report-${lecture_id}.pdf`, (err) => {
            if (err) {
                if (err.code === 'ECONNABORTED') {
                    // Client disconnected, ignore
                    // console.log(`[Info] Download for Report-${lecture_id}.pdf was aborted by the client.`);
                } else {
                    console.error("File Send Error:", err);
                    if (!res.headersSent) {
                        res.status(500).send("Error downloading file");
                    }
                }
            }
        });

    } catch (err) {
        console.error("PDF Generation Error:", err.message);
        res.status(500).send('Server Error generating PDF');
    }
};

module.exports = {
    runAnalysis,
    getReport,
    downloadReport
};
