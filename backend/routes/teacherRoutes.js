const express = require('express');
const router = express.Router();
const { getTeachers, addTeacher, updateTeacher, deleteTeacher } = require('../controllers/teacherController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getTeachers);
router.post('/', authMiddleware, addTeacher);
router.put('/:id', authMiddleware, updateTeacher);
router.delete('/:id', authMiddleware, deleteTeacher);

module.exports = router;
