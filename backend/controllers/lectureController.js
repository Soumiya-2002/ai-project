const { Lecture, Teacher, Class } = require('../models');

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

        const lectures = await Lecture.findAll({
            where: whereClause,
            include: [ // Include basic info
                { model: Class, attributes: ['name', 'section'] },
                { model: Teacher, attributes: ['id'] }
            ]
        });
        res.json(lectures);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    scheduleLecture,
    getLectures
};
