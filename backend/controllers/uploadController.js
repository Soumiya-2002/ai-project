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
        if (err) {
            return res.status(400).json({ message: err });
        } else {
            // Check if video exists
            if (!req.files || !req.files.video) {
                return res.status(400).json({ message: 'No video selected!' });
            }

            const videoFile = req.files.video[0];

            try {
                // Extract text from auxiliary files
                const cobText = req.files.cobParams ? await extractText(req.files.cobParams[0]) : "";
                const readingText = req.files.readingMaterial ? await extractText(req.files.readingMaterial[0]) : "";
                const lessonText = req.files.lessonPlan ? await extractText(req.files.lessonPlan[0]) : "";

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
                    // teacher_id is now User ID directly (no Teacher table needed)
                    lecture = await Lecture.create({
                        teacher_id, // User ID from Users table
                        date,
                        lecture_number: lecture_number || 1,
                        video_url: `/uploads/${videoFile.filename}`,
                        status: 'completed'
                    });
                }

                if (lecture) {
                    const AiService = require('../services/AiService');
                    // Pass the extra context texts to the AI Service
                    AiService.analyzeVideo(lecture.video_url, lecture.id, {
                        cobParams: cobText,
                        readingMaterial: readingText,
                        lessonPlan: lessonText
                    });
                }

                res.json({
                    message: 'Upload Successful! AI Analysis Started.',
                    file: `/uploads/${videoFile.filename}`,
                    lecture
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
