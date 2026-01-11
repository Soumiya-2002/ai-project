const { Report, Lecture } = require('../models');
const { processAudio } = require('../services/ai/vapiService');
const { generateAnalysis } = require('../services/ai/geminiService');
const { generateRubricScore } = require('../services/ai/nlmService');

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

module.exports = {
    runAnalysis,
    getReport
};
