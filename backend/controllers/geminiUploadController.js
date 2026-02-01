const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Lecture } = require('../models');
const geminiProService = require('../services/ai/geminiProService');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    fileFilter: function (req, file, cb) {
        const allowedExtensions = /pdf|docx|doc|mp4|mov|avi|mkv/;
        const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

        if (extname) {
            return cb(null, true);
        } else {
            cb('Error: Only PDF, DOCX, and video files are allowed!');
        }
    }
}).fields([
    { name: 'video', maxCount: 1 },
    { name: 'cobParams', maxCount: 1 },
    { name: 'readingMaterial', maxCount: 1 },
    { name: 'lessonPlan', maxCount: 1 }
]);

/**
 * Upload and analyze files using Gemini Pro
 */
const uploadAndAnalyze = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err
            });
        }

        try {
            const analysisResults = {
                cobParams: null,
                readingMaterial: null,
                lessonPlan: null,
                video: null
            };

            // 1. Analyze COB Parameters
            if (req.files && req.files.cobParams) {
                const cobFile = req.files.cobParams[0];
                console.log('📄 Analyzing COB Parameters:', cobFile.originalname);

                const ext = path.extname(cobFile.path).toLowerCase();
                if (ext === '.pdf') {
                    analysisResults.cobParams = await geminiProService.analyzePDF(
                        cobFile.path,
                        'cob_params'
                    );
                } else if (ext === '.docx' || ext === '.doc') {
                    analysisResults.cobParams = await geminiProService.analyzeDOCX(
                        cobFile.path,
                        'cob_params'
                    );
                }
                console.log('✅ COB Parameters analyzed');
            }

            // 2. Analyze Reading Material
            if (req.files && req.files.readingMaterial) {
                const readingFile = req.files.readingMaterial[0];
                console.log('📚 Analyzing Reading Material:', readingFile.originalname);

                const ext = path.extname(readingFile.path).toLowerCase();
                if (ext === '.pdf') {
                    analysisResults.readingMaterial = await geminiProService.analyzePDF(
                        readingFile.path,
                        'reading_material'
                    );
                } else if (ext === '.docx' || ext === '.doc') {
                    analysisResults.readingMaterial = await geminiProService.analyzeDOCX(
                        readingFile.path,
                        'reading_material'
                    );
                }
                console.log('✅ Reading Material analyzed');
            }

            // 3. Analyze Lesson Plan
            if (req.files && req.files.lessonPlan) {
                const lessonFile = req.files.lessonPlan[0];
                console.log('📋 Analyzing Lesson Plan:', lessonFile.originalname);

                const ext = path.extname(lessonFile.path).toLowerCase();
                if (ext === '.pdf') {
                    analysisResults.lessonPlan = await geminiProService.analyzePDF(
                        lessonFile.path,
                        'lesson_plan'
                    );
                } else if (ext === '.docx' || ext === '.doc') {
                    analysisResults.lessonPlan = await geminiProService.analyzeDOCX(
                        lessonFile.path,
                        'lesson_plan'
                    );
                }
                console.log('✅ Lesson Plan analyzed');
            }

            // 4. Analyze Video (if provided)
            if (req.files && req.files.video) {
                const videoFile = req.files.video[0];
                console.log('🎥 Analyzing Video:', videoFile.originalname);

                // Prepare context from analyzed documents
                const context = {
                    cobParams: analysisResults.cobParams?.data || null,
                    readingMaterial: analysisResults.readingMaterial?.data || null,
                    lessonPlan: analysisResults.lessonPlan?.data || null
                };

                analysisResults.video = await geminiProService.analyzeVideo(
                    videoFile.path,
                    context
                );
                console.log('✅ Video analyzed');

                // Save lecture to database
                const { teacher_id, date, lecture_number, lecture_id } = req.body;
                let lecture;

                if (lecture_id) {
                    lecture = await Lecture.findByPk(lecture_id);
                    if (lecture) {
                        lecture.video_url = `/uploads/${videoFile.filename}`;
                        lecture.status = 'completed';
                        await lecture.save();
                    }
                } else if (teacher_id && date) {
                    lecture = await Lecture.create({
                        teacher_id,
                        date,
                        lecture_number: lecture_number || 1,
                        video_url: `/uploads/${videoFile.filename}`,
                        status: 'completed'
                    });
                }

                // Generate comprehensive COB report
                if (lecture && analysisResults.cobParams) {
                    console.log('📊 Generating COB Report...');
                    const cobReport = await geminiProService.generateCOBReport(
                        analysisResults.video.data,
                        analysisResults.cobParams.data,
                        {
                            readingMaterial: analysisResults.readingMaterial?.data,
                            lessonPlan: analysisResults.lessonPlan?.data
                        }
                    );

                    // Save report to database
                    const { Report } = require('../models');
                    await Report.create({
                        lecture_id: lecture.id,
                        analysis_data: JSON.stringify({
                            gemini_analysis: analysisResults,
                            cob_report: cobReport.report,
                            generated_at: new Date()
                        }),
                        score: calculateScore(cobReport.report),
                        generated_by_ai: true
                    });
                    console.log('✅ COB Report saved to database');
                }
            }

            // Return comprehensive response
            res.json({
                success: true,
                message: 'Files uploaded and analyzed successfully!',
                analysis: analysisResults,
                files: {
                    cobParams: req.files?.cobParams?.[0]?.filename,
                    readingMaterial: req.files?.readingMaterial?.[0]?.filename,
                    lessonPlan: req.files?.lessonPlan?.[0]?.filename,
                    video: req.files?.video?.[0]?.filename
                }
            });

        } catch (error) {
            console.error('❌ Error during analysis:', error);
            res.status(500).json({
                success: false,
                message: 'Error analyzing files',
                error: error.message
            });
        }
    });
};

/**
 * Analyze a single PDF file
 */
const analyzePDF = async (req, res) => {
    try {
        const { filePath, analysisType } = req.body;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                message: 'File path is required'
            });
        }

        const fullPath = path.join(__dirname, '..', filePath);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        const result = await geminiProService.analyzePDF(fullPath, analysisType || 'content');

        res.json({
            success: true,
            analysis: result
        });

    } catch (error) {
        console.error('Error analyzing PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing PDF',
            error: error.message
        });
    }
};

/**
 * Analyze a single video file
 */
const analyzeVideoFile = async (req, res) => {
    try {
        const { filePath, context } = req.body;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                message: 'File path is required'
            });
        }

        const fullPath = path.join(__dirname, '..', filePath);

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        const result = await geminiProService.analyzeVideo(fullPath, context || {});

        res.json({
            success: true,
            analysis: result
        });

    } catch (error) {
        console.error('Error analyzing video:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing video',
            error: error.message
        });
    }
};

/**
 * Calculate overall score from COB report
 */
function calculateScore(cobReport) {
    try {
        if (cobReport && cobReport.scores && cobReport.scores.overall_percentage) {
            return parseFloat(cobReport.scores.overall_percentage.replace('%', ''));
        }
        return 85; // Default score
    } catch (error) {
        return 85;
    }
}

module.exports = {
    uploadAndAnalyze,
    analyzePDF,
    analyzeVideoFile
};
