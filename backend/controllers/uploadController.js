const multer = require('multer');
const path = require('path');
const { Lecture } = require('../models');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000 * 1024 * 1024 }, // 500MB limit
    fileFilter: function (req, file, cb) {
        // Allow Video, PDF, and DOCX
        if (file.fieldname === 'video') {
            checkFileType(file, cb);
        } else {
            cb(null, true); // Allow doc/pdf for other fields
        }
    }
}).fields([
    { name: 'video', maxCount: 1 },
    { name: 'cobParams', maxCount: 1 },
    { name: 'readingMaterial', maxCount: 1 },
    { name: 'lessonPlan', maxCount: 1 }
]);

function checkFileType(file, cb) {
    const filetypes = /mp4|mov|avi|mkv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Videos Only for video field!');
    }
}

// Helper to extract text
const extractText = async (file) => {
    if (!file) return "";
    const filePath = file.path;
    const ext = path.extname(filePath).toLowerCase();

    try {
        if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        } else if (ext === '.docx') {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        }
    } catch (err) {
        console.error(`Error reading ${file.originalname}:`, err);
        return `[Error reading file ${file.originalname}]`;
    }
    return "";
};

const uploadVideo = async (req, res) => {
    upload(req, res, async (err) => {
        console.log("--> Upload Controller Hit");
        if (err) {
            console.error("Multer Error:", err);
            return res.status(400).json({ message: err });
        } else {
            console.log("Files:", req.files ? Object.keys(req.files) : "None");
            console.log("Body:", req.body);

            // Check if video exists
            if (!req.files || !req.files.video) {
                console.warn("No video file found in request");
                return res.status(400).json({ message: 'No video selected!' });
            }

            const videoFile = req.files.video[0];
            console.log("Video uploaded:", videoFile.filename);

            try {
                // Extract text from auxiliary files
                const cobText = req.files.cobParams ? await extractText(req.files.cobParams[0]) : "";
                const readingText = req.files.readingMaterial ? await extractText(req.files.readingMaterial[0]) : "";
                const lessonText = req.files.lessonPlan ? await extractText(req.files.lessonPlan[0]) : "";

                const { teacher_id, date, lecture_number, lecture_id } = req.body;
                let lecture;

                if (lecture_id) {
                    console.log("Updating existing lecture:", lecture_id);
                    lecture = await Lecture.findByPk(lecture_id);
                    if (lecture) {
                        lecture.video_url = `/uploads/${videoFile.filename}`;
                        lecture.status = 'completed';
                        // Update grade/section if provided
                        if (req.body.grade) lecture.grade = req.body.grade;
                        if (req.body.section) lecture.section = req.body.section;
                        await lecture.save();
                    }
                } else if (teacher_id && date) {
                    console.log("Creating new lecture for teacher:", teacher_id, "on", date);
                    // teacher_id is now User ID directly (no Teacher table needed)
                    lecture = await Lecture.create({
                        teacher_id, // User ID from Users table
                        date,
                        lecture_number: lecture_number || 1,
                        video_url: `/uploads/${videoFile.filename}`,
                        grade: req.body.grade || null,
                        section: req.body.section || null,
                        status: 'completed'
                    });
                } else {
                    console.warn("Missing required fields for Lecture creation (lecture_id OR teacher_id + date)");
                }

                if (!lecture) {
                    console.warn("Lecture object is null/undefined. Skipping AI Analysis.");
                }

                let analysisResult = null;
                let pdfReportUrl = null;

                if (lecture) {
                    const AiService = require('../services/AiService');

                    // Fetch Rich Metadata for AI Context
                    const { User, School, Class } = require('../models');
                    let contextMeta = {
                        facilitator: 'Unknown Teacher',
                        school: 'Unknown School',
                        grade: lecture.grade || 'N/A', // Prioritize manual entry
                        section: lecture.section || 'N/A', // Prioritize manual entry
                        subject: 'General',
                        date: lecture.date || new Date().toISOString().split('T')[0]
                    };

                    try {
                        const fullLecture = await Lecture.findByPk(lecture.id, {
                            include: [
                                {
                                    model: User,
                                    as: 'Teacher',
                                    include: [{ model: School }] // User -> School
                                },
                                {
                                    model: Class,
                                    include: [{ model: School }] // Class -> School
                                }
                            ]
                        });

                        if (fullLecture) {
                            if (fullLecture.Teacher) {
                                contextMeta.facilitator = fullLecture.Teacher.name;
                                // Try getting school from Teacher's User profile
                                if (fullLecture.Teacher.School) {
                                    contextMeta.school = fullLecture.Teacher.School.name;
                                }
                            }

                            if (fullLecture.Class) {
                                // Only override if not already set by explicit input
                                if (contextMeta.grade === 'N/A') contextMeta.grade = fullLecture.Class.name;
                                if (contextMeta.section === 'N/A') contextMeta.section = fullLecture.Class.section;

                                // If school wasn't found on teacher, try class
                                if (!contextMeta.school && fullLecture.Class.School) {
                                    contextMeta.school = fullLecture.Class.School.name;
                                }
                            }
                        }
                    } catch (metaErr) {
                        console.warn("Failed to fetch rich metadata for AI:", metaErr.message);
                    }

                    // Pass the extra context texts to the AI Service
                    console.log("Starting AI Analysis (Blocking)...");
                    try {
                        analysisResult = await AiService.analyzeVideo(lecture.video_url, lecture.id, {
                            cobParams: cobText,
                            readingMaterial: readingText,
                            lessonPlan: lessonText,
                            meta: contextMeta
                        });

                        // --- GENERATE PDF REPORT ---
                        if (analysisResult && !analysisResult.error) {
                            try {
                                const htmlTemplatePath = path.join(__dirname, '../content/COB Template - K1 to Gr 10.html');

                                // Check if the template exists
                                if (fs.existsSync(htmlTemplatePath)) {
                                    const { generateReportFromHtml } = require('../services/htmlReportService');
                                    // Use a simpler filename
                                    const reportFilename = `report-${lecture.id}.pdf`;
                                    const reportPath = path.join(__dirname, '../uploads', reportFilename);

                                    await generateReportFromHtml(analysisResult, htmlTemplatePath, reportPath);
                                    pdfReportUrl = `/uploads/${reportFilename}`;
                                } else {
                                    const { generatePDF } = require('../services/pdfService');
                                    const reportFilename = `report-${lecture.id}.pdf`;
                                    const reportPath = path.join(__dirname, '../uploads', reportFilename);

                                    await generatePDF(analysisResult, reportPath);
                                    pdfReportUrl = `/uploads/${reportFilename}`;
                                }
                                console.log("PDF Report Generated:", pdfReportUrl);
                            } catch (pdfErr) {
                                console.error("PDF Generation Failed:", pdfErr);
                            }
                        }

                    } catch (aiErr) {
                        console.error("AI Service Error:", aiErr);
                        // Continue to return success for upload even if AI fails, but include error info
                        analysisResult = { error: "AI Analysis Failed", details: aiErr.message };
                    }
                }

                res.json({
                    message: 'Upload & Analysis Completed!',
                    file: `/uploads/${videoFile.filename}`,
                    lecture,
                    analysis: analysisResult,
                    pdfReport: pdfReportUrl
                });

            } catch (dbErr) {
                console.error("DB Error:", dbErr);
                res.status(500).json({ message: 'Database Error', error: dbErr.message });
            }
        }
    });
};

module.exports = {
    uploadVideo
};
