/**
 * uploadController.js
 * 
 * This controller handles the core Video Upload process from the frontend.
 * It uses 'multer' to handle multipart/form-data for file uploads, saves the files locally,
 * provisions a database entry for the new Lecture, and starts the AI Analysis pipeline in the background.
 */
const multer = require('multer');
const path = require('path');
const { Lecture } = require('../lessonPlanModels');
const { extractTextFromImage } = require('../services/ocrService');

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

const checkImageFileType = (file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images or PDFs Only for answer sheet field!');
    }
};

const uploadImageMulter = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: function (req, file, cb) {
        checkImageFileType(file, cb);
    }
}).single('image');

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
        //console.log("--> Upload Controller Hit");
        if (err) {
            console.error("Multer Error:", err);
            return res.status(400).json({ message: err });
        } else {
            //console.log("Files:", req.files ? Object.keys(req.files) : "None");
            //console.log("Body:", req.body);

            let lessonPlanFileName = '';

            if (req.files && req.files.lessonPlan) {
                lessonPlanFileName = req.files.lessonPlan[0].filename;
            } else {
                return res.status(400).json({ message: 'No lesson plan selected!' });
            }

            // Move the file to a school-specific folder if school_id is provided and it's a new upload
            let finalVideoRelPath = `/uploads/${lessonPlanFileName}`;
            if (req.body.school_id) {
                try {
                    const { School } = require('../lessonPlanModels');
                    const school = await School.findByPk(req.body.school_id);
                    if (school) {
                        const schoolFolderName = school.name.replace(/[^a-zA-Z0-9]/g, '_');
                        const schoolDir = path.join(__dirname, '../uploads', schoolFolderName);
                        
                        if (!fs.existsSync(schoolDir)) {
                            fs.mkdirSync(schoolDir, { recursive: true });
                        }
                        const oldPath = path.join(__dirname, '../uploads', lessonPlanFileName);
                        const newLessonPlanFileName = `${Date.now()}-${lessonPlanFileName}`; // prevent conflicts
                        const newPath = path.join(schoolDir, newLessonPlanFileName);
                        if (fs.existsSync(oldPath)) {
                            fs.renameSync(oldPath, newPath);
                            finalVideoRelPath = `/uploads/${schoolFolderName}/${newLessonPlanFileName}`;
                        }
                    }
                } catch (folderErr) {
                    console.error("Failed to process video path/folder:", folderErr);
                    // continue with default uploads path
                }
            }

            try {
                const readingText = "";
                const lessonText = req.files.lessonPlan ? await extractText(req.files.lessonPlan[0]) : "";

                const { teacher_id, date, lecture_number, lecture_id } = req.body;
                let lecture;

                if (lecture_id) {
                    //console.log("Updating existing lecture:", lecture_id);
                    lecture = await Lecture.findByPk(lecture_id);
                    if (lecture) {
                        // Use the new folder path
                        lecture.video_url = finalVideoRelPath;
                        lecture.status = 'completed';
                        // Update grade/section if provided
                        if (req.body.grade) lecture.grade = req.body.grade;
                        if (req.body.section) lecture.section = req.body.section;
                        await lecture.save();
                    }
                } else if (teacher_id && date) {
                    //console.log("Creating new lecture for teacher:", teacher_id, "on", date);
                    // teacher_id is now User ID directly (no Teacher table needed)
                    lecture = await Lecture.create({
                        teacher_id, // User ID from Users table
                        date,
                        lecture_number: lecture_number || 1,
                        video_url: finalVideoRelPath,
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

                // --- ASYNC PROCESSING CHANGE ---
                // Return immediate response to User so they don't wait 3-4 minutes
                res.status(202).json({
                    message: 'Upload Successful! AI Analysis started in background.',
                    file: finalVideoRelPath,
                    lecture: lecture,
                    status: 'processing',
                    lecture_id: lecture.id
                });

                if (lecture) {
                    // Update Status to Processing
                    lecture.status = 'processing';
                    await lecture.save();

                    // Start Background Process (Fire & Forget)
                    (async () => {
                        console.log(`[Background] Starting AI Analysis for Lecture ${lecture.id}...`);
                        try {
                            const AiService = require('../services/AiService');
                            const { User, School, Class } = require('../lessonPlanModels');

                            // Fetch Rich Metadata for AI Context
                            let contextMeta = {
                                facilitator: 'Unknown Teacher',
                                school: 'Unknown School',
                                school_id: req.body.school_id || null, // Include school_id for Rubric
                                grade: lecture.grade || req.body.grade || 'N/A',
                                section: lecture.section || req.body.section || 'N/A',
                                subject: 'General',
                                date: lecture.date || new Date().toISOString().split('T')[0]
                            };

                            try {
                                const fullLecture = await Lecture.findByPk(lecture.id, {
                                    include: [
                                        {
                                            model: User,
                                            as: 'Teacher',
                                            include: [{ model: School }]
                                        },
                                        {
                                            model: Class,
                                            include: [{ model: School }]
                                        }
                                    ]
                                });

                                if (fullLecture) {
                                    if (fullLecture.Teacher) {
                                        contextMeta.facilitator = fullLecture.Teacher.name;
                                        if (fullLecture.Teacher.School) contextMeta.school = fullLecture.Teacher.School.name;
                                    }
                                    if (fullLecture.Class) {
                                        if (contextMeta.grade === 'N/A') contextMeta.grade = fullLecture.Class.name;
                                        if (contextMeta.section === 'N/A') contextMeta.section = fullLecture.Class.section;
                                        if (!contextMeta.school && fullLecture.Class.School) {
                                            contextMeta.school = fullLecture.Class.School.name;
                                        }
                                    }
                                }
                            } catch (metaErr) {
                                console.warn("[Background] Failed to fetch rich metadata:", metaErr.message);
                            }

                            // Run AI Analysis specifically for Lesson Plans
                            console.log("[Background] Calling AI Service for Lesson Plan (This takes time)...");
                            const analysisResult = await AiService.analyzeLessonPlan(lecture.video_url, lecture.id, {
                                lessonPlan: lessonText,
                                meta: contextMeta
                            });

                            // Generate PDF Report
                            if (analysisResult && !analysisResult.error) {
                                try {
                                    const htmlTemplatePath = path.join(__dirname, '../content/COB Template - K1 to Gr 10.html');
                                    // Use a simpler filename
                                    const reportFilename = `report-${lecture.id}.pdf`;
                                    const reportPath = path.join(__dirname, '../uploads', reportFilename);

                                    if (fs.existsSync(htmlTemplatePath)) {
                                        const { generateReportFromHtml } = require('../services/htmlReportService');
                                        await generateReportFromHtml(analysisResult, htmlTemplatePath, reportPath);
                                    } else {
                                        const { generatePDF } = require('../services/pdfService');
                                        await generatePDF(analysisResult, reportPath);
                                    }
                                    console.log("[Background] PDF Report Generated Successfully:", reportFilename);
                                } catch (pdfErr) {
                                    console.error("[Background] PDF Generation Failed:", pdfErr);
                                }
                            }

                            // Mark as Completed
                            lecture.status = 'completed';
                            await lecture.save();
                            console.log(`[Background] Lecture ${lecture.id} processing FINISHED.`);

                        } catch (aiErr) {
                            console.error("[Background] AI Service Error:", aiErr);
                            lecture.status = 'failed';
                            await lecture.save();
                        }
                    })();
                }

            } catch (dbErr) {
                console.error("DB Error:", dbErr);
                res.status(500).json({ message: 'Database Error', error: dbErr.message });
            }
        }
    });
};

const uploadAnswerSheet = async (req, res) => {
    uploadImageMulter(req, res, async (err) => {
        if (err) {
            console.error("Multer Error:", err);
            return res.status(400).json({ message: err });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file selected!' });
        }

        try {
            console.log(`File uploaded: ${req.file.filename}`);
            const text = await extractTextFromImage(req.file.path, req.file.mimetype);

            // Generate PDF from extracted text
            const PDFDocument = require('pdfkit');
            const pdfFilename = `extracted-${Date.now()}.pdf`;
            const pdfPath = path.join(__dirname, '../uploads', pdfFilename);

            const doc = new PDFDocument({ margin: 50 });
            const writeStream = fs.createWriteStream(pdfPath);
            doc.pipe(writeStream);

            // Split extracted text into pages using the requested delimiter
            const pages = text.split(/\|\|\|PAGE_BREAK\|\|\|/gi).map(p => p.trim()).filter(p => p.length > 0);

            if (pages.length === 0) {
                doc.fontSize(18).font('Helvetica-Bold').text('Extracted Answer Sheet');
                doc.moveDown();
                doc.fontSize(12).font('Helvetica').text('No text extracted.', { align: 'left' });
            } else {
                pages.forEach((pageText, index) => {
                    if (index > 0) {
                        doc.addPage();
                    }
                    doc.fontSize(18).font('Helvetica-Bold').text(`Extracted Answer Sheet - Page ${index + 1}`);
                    doc.moveDown(1.5);
                    doc.fontSize(12).font('Helvetica').text(pageText, { align: 'left', lineGap: 4 });
                });
            }

            doc.end();

            writeStream.on('finish', () => {
                res.status(200).json({
                    message: 'File uploaded and text extracted successfully.',
                    text: text,
                    file: `/uploads/${req.file.filename}`,
                    pdfUrl: `/uploads/${pdfFilename}`
                });
            });

        } catch (error) {
            console.error("Extraction Error:", error);
            res.status(500).json({ message: 'Error extracting text from file', error: error.message });
        }
    });
};

const chunkStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = path.join(__dirname, '../uploads/temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'chunk-' + Date.now());
    }
});
const uploadChunkMulter = multer({ storage: chunkStorage }).single('chunk');

const uploadChunk = async (req, res) => {
    uploadChunkMulter(req, res, async (err) => {
        if (err) {
            console.error("Multer error in uploadChunk:", err);
            require('fs').writeFileSync('multer_error.log', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
            return res.status(400).json({ message: err.message || err });
        }
        const { uploadId, chunkIndex } = req.body;
        const chunkFile = req.file;

        if (!chunkFile || !uploadId || chunkIndex === undefined) {
            return res.status(400).json({ message: "Invalid payload" });
        }

        const tempDir = path.join(__dirname, '../uploads/temp', uploadId);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const chunkPath = path.join(tempDir, chunkIndex.toString());
        fs.renameSync(chunkFile.path, chunkPath);

        res.status(200).send("OK");
    });
};

module.exports = {
    uploadVideo,
    uploadChunk,
    uploadAnswerSheet
};
