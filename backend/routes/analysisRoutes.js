const express = require('express');
const router = express.Router();
const { runAnalysis, getReport } = require('../controllers/analysisController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/:lecture_id', authMiddleware, runAnalysis);
router.get('/:lecture_id', authMiddleware, getReport);

module.exports = router;
