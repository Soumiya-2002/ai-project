const express = require('express');
const router = express.Router();
const { uploadVideo, uploadAnswerSheet } = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, uploadVideo);
router.post('/answer-sheet', authMiddleware, uploadAnswerSheet);

module.exports = router;
