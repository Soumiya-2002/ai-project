const express = require('express');
const router = express.Router();
const { runAnalysis, getReport, downloadReport } = require('../controllers/analysisController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/:lecture_id', authMiddleware, runAnalysis);
router.get('/:lecture_id', authMiddleware, getReport);
router.get('/:lecture_id/download', authMiddleware, downloadReport);

module.exports = router;
