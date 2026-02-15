const express = require('express');
const router = express.Router();
const { scheduleLecture, getLectures, getLectureById } = require('../controllers/lectureController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, scheduleLecture);
router.get('/', authMiddleware, getLectures);
router.get('/:id', authMiddleware, getLectureById);

module.exports = router;
