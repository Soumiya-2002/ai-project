const { School, Teacher, User, Lecture } = require('../models');

const getDashboardStats = async (req, res) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.id;

        let schoolFilter = {};
        let teacherFilter = {};
        let lectureFilter = {};

        // If School Admin or Teacher, filter by their school
        if (userRole === 'school_admin' || userRole === 'teacher') {
            const currentUser = await User.findByPk(userId);
            if (currentUser && currentUser.school_id) {
                const schoolId = currentUser.school_id;
                schoolFilter = { where: { id: schoolId } };
                teacherFilter = { where: { school_id: schoolId } };

                // For lectures, filter by teachers from the same school
                const schoolTeachers = await Teacher.findAll({
                    where: { school_id: schoolId },
                    attributes: ['id']
                });
                const teacherIds = schoolTeachers.map(t => t.id);
                lectureFilter = { where: { teacher_id: teacherIds } };
            }
        }

        const schoolsCount = await School.count(schoolFilter);
        const teachersCount = await Teacher.count(teacherFilter);
        const usersCount = await User.count({ where: schoolFilter.where ? { school_id: schoolFilter.where.id } : {} });
        const lecturesCount = await Lecture.count(lectureFilter);

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
