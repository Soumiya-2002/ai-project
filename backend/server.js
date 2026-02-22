const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, syncDatabase } = require('./models');
const authRoutes = require('./routes/authRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const rubricRoutes = require('./routes/rubricRoutes');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Allow all origins for debugging
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logger
app.use((req, res, next) => {
    //console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

app.use('/auth', authRoutes);
app.use('/schools', schoolRoutes);
app.use('/teachers', require('./routes/teacherRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/lectures', lectureRoutes);
app.use('/upload', uploadRoutes);
app.use('/analysis', analysisRoutes);
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/rubrics', rubricRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const startServer = async () => {
    await connectDB();
    await syncDatabase();

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Set timeout to 30 minutes for large uploads
    server.timeout = 30 * 60 * 1000;
};

startServer();
