const express = require('express');
const router = express.Router();
const { scheduleLecture, getLectures } = require('../controllers/lectureController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, scheduleLecture);
router.get('/', authMiddleware, getLectures);

module.exports = router;
