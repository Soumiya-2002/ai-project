const { School, Teacher, User, Lecture } = require('../models');

const getDashboardStats = async (req, res) => {
    try {
        const schoolsCount = await School.count();
        const teachersCount = await Teacher.count();
        const usersCount = await User.count();
        const lecturesCount = await Lecture.count();
        // Assuming 'Lecture' model has a 'video_url' or similar field, or we just count lectures as uploads for now
        // If there is a separate Video model, we should count that. Based on seed.js, only Lecture exists.

        res.json({
            schools: schoolsCount,
            teachers: teachersCount,
            users: usersCount,
            lectures: lecturesCount
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getDashboardStats
};
