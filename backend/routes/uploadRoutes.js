const express = require('express');
const router = express.Router();
const { uploadVideo, uploadAnswerSheet, uploadChunk } = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/chunk', authMiddleware, uploadChunk);

router.post('/', authMiddleware, (req, res, next) => {
    req.setTimeout(0); // Disable timeout for long video uploads on slow internet
    next();
}, uploadVideo);

router.post('/answer-sheet', authMiddleware, (req, res, next) => {
    req.setTimeout(0);
    next();
}, uploadAnswerSheet);

module.exports = router;
