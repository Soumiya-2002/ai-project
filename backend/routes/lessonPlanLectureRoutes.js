const express = require('express');
const router = express.Router();
const { scheduleLecture, getLectures, getLectureById, approveLecture } = require('../controllers/lessonPlanLectureController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, scheduleLecture);
router.get('/', authMiddleware, getLectures);
router.get('/:id', authMiddleware, getLectureById);
router.put('/:id/approve', authMiddleware, approveLecture);

module.exports = router;
