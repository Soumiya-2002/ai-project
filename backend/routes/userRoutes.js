const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, getTeachersBySchool } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getUsers);
router.get('/teachers', authMiddleware, getTeachersBySchool); // New route for teachers
router.post('/', authMiddleware, createUser);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deleteUser);

module.exports = router;
