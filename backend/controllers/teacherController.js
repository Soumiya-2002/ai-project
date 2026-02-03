const { Teacher, User, School, Role } = require('../models');
const bcrypt = require('bcryptjs');

const getTeachers = async (req, res) => {
    try {
        const { page = 1, limit = 10, school_id } = req.query;
        const whereClause = {};
        const offset = (page - 1) * limit;

        const userRole = req.user?.role;
        const userId = req.user?.id;

        // If School Admin or Teacher, filter by their school
        if (userRole === 'school_admin' || userRole === 'teacher') {
            const currentUser = await User.findByPk(userId);
            if (currentUser && currentUser.school_id) {
                whereClause.school_id = currentUser.school_id;
            }
        } else if (school_id) {
            // Super Admin can filter by specific school
            whereClause.school_id = school_id;
        }

        const { count, rows } = await Teacher.findAndCountAll({
            where: whereClause,
            include: [
                { model: User, attributes: ['name', 'email'] },
                { model: School, attributes: ['name'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Flatten data for frontend
        const formatted = rows.map(t => ({
            id: t.id,
            user_id: t.user_id,
            name: t.User.name,
            email: t.User.email,
            school: t.School ? t.School.name : 'N/A',
            school_id: t.school_id,
            subjects: t.subjects,
            status: t.status,
            experience: t.experience
        }));

        res.json({
            data: formatted,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const addTeacher = async (req, res) => {
    try {
        const { name, email, password, school_id, subjects, experience } = req.body;

        // Check if user exists
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // If logged-in user is School Admin, enforce they can only create teachers for their school
        const userRole = req.user?.role;
        const userId = req.user?.id;
        if (userRole === 'school_admin') {
            const currentUser = await User.findByPk(userId);
            if (currentUser && currentUser.school_id && school_id != currentUser.school_id) {
                return res.status(403).json({ message: 'You can only create teachers for your own school' });
            }
        }

        // Create User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || '123456', salt); // Default password if not provided

        const teacherRole = await Role.findOne({ where: { name: 'teacher' } });

        user = await User.create({
            name,
            email,
            password: hashedPassword,
            role_id: teacherRole.id,
            school_id: school_id  // Assign school_id to User as well
        });

        // Create Teacher Profile
        const teacher = await Teacher.create({
            user_id: user.id,
            school_id,
            subjects: JSON.stringify(subjects || []),
            experience: experience || 0
        });

        res.status(201).json({ message: 'Teacher created', teacher });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params; // Teacher ID
        const { name, email, subjects, status, experience } = req.body;

        const teacher = await Teacher.findByPk(id, { include: [User] });
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Update User info
        if (name || email) {
            await teacher.User.update({ name, email });
        }

        // Update Teacher info
        if (subjects) {
            await teacher.update({ subjects: JSON.stringify(subjects) });
        }

        if (status) {
            await teacher.update({ status });
        }

        if (experience !== undefined) {
            await teacher.update({ experience });
        }

        res.json({ message: 'Teacher updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await Teacher.findByPk(id);

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Delete User (Cascade will handle Teacher if configured, but let's be explicit or safe)
        // Ideally we delete the User, and that deletes the Teacher. 
        // But since we selected Teacher first, let's get User ID.
        const userId = teacher.user_id;

        await teacher.destroy(); // Remove profile
        await User.destroy({ where: { id: userId } }); // Remove login

        res.json({ message: 'Teacher deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getTeachers,
    addTeacher,
    updateTeacher,
    deleteTeacher
};
