const express = require('express');
const router = express.Router();
const { getRubrics, uploadRubric, deleteRubric } = require('../controllers/rubricController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getRubrics);
router.post('/', authMiddleware, uploadRubric);
router.delete('/:id', authMiddleware, deleteRubric);

module.exports = router;
