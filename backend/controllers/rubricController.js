/**
 * rubricController.js
 * 
 * Handles uploading (Word, PDF, Excel), fetching, and deleting of strict grading Rubrics based on Grades.
 * The uploaded rubrics are parsed out into raw text and stored in the database so the AI Service. 
 * can quickly refer to them without reprocessing files on every video upload.
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const { Rubric } = require('../models');

// Configure Multer Storage for Rubrics
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'rubric-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /pdf|docx?|xlsx?/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = /pdf|msword|officedocument|excel|spreadsheet/.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Only Word, Excel, and PDF files are allowed!');
        }
    }
}).single('file');

/**
 * Helper function to extract text from an uploaded file.
 * Automatically detects format (.pdf, .docx, .xlsx) and uses the corresponding parser.
 * This extracted text is crucial as it's passed directly to the AI for grading logic.
 * 
 * @param {Object} file - The file object provided by multer
 * @returns {String} The extracted text from the document
 */
const extractText = async (file) => {
    if (!file) return "";
    const filePath = file.path;
    const ext = path.extname(filePath).toLowerCase();

    try {
        if (ext === '.pdf') {
            // Use pdf-parse to extract raw text from PDF documents
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        } else if (ext === '.docx' || ext === '.doc') {
            // Use mammoth to extract text paragraphs from Word documents
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } else if (ext === '.xlsx' || ext === '.xls') {
            // Use xlsx to convert excel sheets into CSV style text string
            let extractedText = "";
            const workbook = xlsx.readFile(filePath);
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const text = xlsx.utils.sheet_to_csv(sheet);
                extractedText += text + "\n";
            });
            return extractedText;
        }
    } catch (err) {
        console.error(`Error reading ${file.originalname}:`, err);
        return `[Error reading file ${file.originalname}]`;
    }
    return "";
};

const getRubrics = async (req, res) => {
    try {
        const rubrics = await Rubric.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ data: rubrics });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching rubrics', error: err.message });
    }
};

const uploadRubric = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file selected!' });
        }

        const { grade } = req.body;
        if (!grade) {
            // Delete uploaded file if grade is missing
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Grade is required!' });
        }

        try {
            // First check if a rubric already exists for this grade to replace it or allow multiple?
            // Usually, there's one rubric per grade. We'll simply create or replace? Let's just create new, or the logic could be up to the user. We'll find existing and replace it to keep the DB clean.
            let existingRubric = await Rubric.findOne({ where: { grade: grade } });

            const content = await extractText(req.file);
            const file_type = path.extname(req.file.originalname).substring(1);

            if (existingRubric) {
                // Remove old file
                if (fs.existsSync(path.join(__dirname, '..', existingRubric.file_path))) {
                    fs.unlinkSync(path.join(__dirname, '..', existingRubric.file_path));
                }

                existingRubric.file_path = `/uploads/${req.file.filename}`;
                existingRubric.original_name = req.file.originalname;
                existingRubric.file_type = file_type;
                existingRubric.content = content;
                await existingRubric.save();

                return res.json({ message: 'Rubric updated successfully', data: existingRubric });
            } else {
                const newRubric = await Rubric.create({
                    grade: grade,
                    file_path: `/uploads/${req.file.filename}`,
                    original_name: req.file.originalname,
                    file_type: file_type,
                    content: content
                });

                return res.status(201).json({ message: 'Rubric uploaded successfully', data: newRubric });
            }

        } catch (dbErr) {
            console.error("DB Error:", dbErr);
            res.status(500).json({ message: 'Database Error', error: dbErr.message });
        }
    });
};

const deleteRubric = async (req, res) => {
    try {
        const { id } = req.params;
        const rubric = await Rubric.findByPk(id);

        if (!rubric) {
            return res.status(404).json({ message: 'Rubric not found' });
        }

        // Delete file
        const fullPath = path.join(__dirname, '..', rubric.file_path);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        await rubric.destroy();
        res.json({ message: 'Rubric deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting rubric', error: err.message });
    }
};

module.exports = {
    getRubrics,
    uploadRubric,
    deleteRubric
};
