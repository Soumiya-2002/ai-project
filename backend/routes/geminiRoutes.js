const express = require('express');
const router = express.Router();
const geminiUploadController = require('../controllers/geminiUploadController');
const verifyToken = require('../middleware/authMiddleware');

/**
 * @route   POST /api/gemini/upload
 * @desc    Upload and analyze files (COB params, reading material, lesson plan, video)
 * @access  Private
 */
router.post('/upload', verifyToken, geminiUploadController.uploadAndAnalyze);

/**
 * @route   POST /api/gemini/analyze-pdf
 * @desc    Analyze a specific PDF file
 * @access  Private
 */
router.post('/analyze-pdf', verifyToken, geminiUploadController.analyzePDF);

/**
 * @route   POST /api/gemini/analyze-video
 * @desc    Analyze a specific video file
 * @access  Private
 */
router.post('/analyze-video', verifyToken, geminiUploadController.analyzeVideoFile);

module.exports = router;
