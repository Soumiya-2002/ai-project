const { Lecture, Class, User, School } = require('../models');

const scheduleLecture = async (req, res) => {
    try {
        const { teacher_id, class_id, date, time_slot } = req.body;

        // Validation: Check if teacher or class is already booked at that time (simple check)
        const existingVal = await Lecture.findOne({
            where: {
                teacher_id,
                date,
                time_slot,
                status: 'scheduled'
            }
        });

        if (existingVal) {
            return res.status(400).json({ message: 'Teacher is already booked for this slot.' });
        }

        const lecture = await Lecture.create({
            teacher_id,
            class_id,
            date,
            time_slot
        });

        res.status(201).json(lecture);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getLectures = async (req, res) => {
    try {
        const { teacher_id, class_id, date } = req.query;
        let whereClause = {};

        if (teacher_id) whereClause.teacher_id = teacher_id;
        if (class_id) whereClause.class_id = class_id;
        if (date) whereClause.date = date;

        // Role-based filtering
        const userRole = req.user?.role;
        const userId = req.user?.id;

        if (userRole === 'school_admin' || userRole === 'teacher') {
            const currentUser = await User.findByPk(userId);
            if (currentUser && currentUser.school_id) {
                // Get all users with teacher role from the same school
                const { Role } = require('../models');
                const teacherRole = await Role.findOne({ where: { name: 'teacher' } });

                const schoolTeachers = await User.findAll({
                    where: {
                        school_id: currentUser.school_id,
                        role_id: teacherRole.id
                    },
                    attributes: ['id']
                });
                const teacherIds = schoolTeachers.map(t => t.id);

                // Filter lectures by teachers from the same school
                if (whereClause.teacher_id) {
                    // If teacher_id is already specified, verify it's from the same school
                    if (!teacherIds.includes(parseInt(whereClause.teacher_id))) {
                        return res.json([]); // Return empty if trying to access other school's data
                    }
                } else {
                    whereClause.teacher_id = teacherIds;
                }
            }
        }

        const lectures = await Lecture.findAll({
            where: whereClause,
            order: [['id', 'DESC']], // Sort purely by ID descending (newest created first)
            include: [
                {
                    model: Class,
                    attributes: ['name', 'section']
                },
                {
                    model: User,
                    as: 'Teacher', // Using alias defined in Lecture model
                    attributes: ['id', 'name', 'email'],
                    include: [
                        { model: School, attributes: ['name', 'address'] }
                    ]
                }
            ]
        });
        res.json(lectures);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getLectureById = async (req, res) => {
    try {
        const { id } = req.params;
        const { Report } = require('../models');

        const lecture = await Lecture.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'Teacher',
                    attributes: ['id', 'name']
                },
                {
                    model: Class,
                    attributes: ['name', 'section']
                },
                {
                    model: Report, // Include the report to check if it exists
                    attributes: ['id', 'generated_by_ai']
                }
            ]
        });

        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found' });
        }

        // Construct PDF URL if report exists
        let pdfReportUrl = null;
        if (lecture.status === 'completed') {
            pdfReportUrl = `/uploads/report-${lecture.id}.pdf`;
        }

        res.json({
            ...lecture.toJSON(),
            pdfReportUrl
        });

    } catch (err) {
        console.error("Error fetching lecture:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    scheduleLecture,
    getLectures,
    getLectureById
};
