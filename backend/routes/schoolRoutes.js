const express = require('express');
const router = express.Router();
const { addSchool, getSchools, updateSchool, deleteSchool, addClass, getClasses } = require('../controllers/schoolController');
const authMiddleware = require('../middleware/authMiddleware');

// Validations can be added here
// Only super_admin should add schools, but for now we authenticate all
router.post('/', authMiddleware, addSchool);
router.get('/', authMiddleware, getSchools);
router.put('/:id', authMiddleware, updateSchool);
router.delete('/:id', authMiddleware, deleteSchool);

router.post('/:school_id/classes', authMiddleware, addClass);
router.get('/:school_id/classes', authMiddleware, getClasses);

module.exports = router;
