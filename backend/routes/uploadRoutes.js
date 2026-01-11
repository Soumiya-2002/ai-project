const express = require('express');
const router = express.Router();
const { uploadVideo } = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, uploadVideo);

module.exports = router;
