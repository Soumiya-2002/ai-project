const { User, Role, School } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * userController.js
 * 
 * Acts as the primary manager for all core User accounts across the system.
 * Handles role-based visibility, ensuring users like School Admins can only view and mutate
 * users within their assigned domain.
 */

/**
 * Retrieves a paginated list of users.
 * Filters automatically based on the requester's role (Super Admin vs School Admin).
 */
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Build where clause based on user role
        let whereClause = {};
        const userRole = req.user?.role;
        const userId = req.user?.id;

        // If School Admin or Teacher, filter by their school
        if (userRole === 'school_admin' || userRole === 'teacher') {
            const currentUser = await User.findByPk(userId);
            if (currentUser && currentUser.school_id) {
                whereClause.school_id = currentUser.school_id;
            }
        }

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            include: [
                { model: Role, attributes: ['name'] },
                { model: School, attributes: ['name'], required: false }
            ],
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const formatted = rows.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.Role ? u.Role.name : 'N/A',
            school: u.School ? u.School.name : 'N/A'
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

/**
 * Creates a generic User account.
 * Primarily used by Super Admins to provision School Admins or external roles.
 */
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, school_id } = req.body;

        let user = await User.findOne({ where: { email } });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const roleRecord = await Role.findOne({ where: { name: role } });
        if (!roleRecord) return res.status(400).json({ message: 'Invalid Role' });

        // Validate school_id for school_admin and teacher roles
        if ((role === 'school_admin' || role === 'teacher') && !school_id) {
            return res.status(400).json({ message: 'School is required for School Admin and Teacher roles' });
        }

        // If logged-in user is School Admin, enforce they can only create users for their school
        const userRole = req.user?.role;
        const userId = req.user?.id;
        if (userRole === 'school_admin') {
            const currentUser = await User.findByPk(userId);
            if (currentUser && currentUser.school_id && school_id != currentUser.school_id) {
                return res.status(403).json({ message: 'You can only create users for your own school' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            name,
            email,
            password: hashedPassword,
            role_id: roleRecord.id,
            school_id: (role === 'school_admin' || role === 'teacher') ? school_id : null
        });

        res.status(201).json({ message: 'User created' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * Updates an existing user's details.
 * Can promote/demote roles and adjust school assignments dynamically.
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, school_id } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const updateData = { name, email };

        if (role) {
            const roleRecord = await Role.findOne({ where: { name: role } });
            if (roleRecord) {
                updateData.role_id = roleRecord.id;

                // Update school_id based on role
                if (role === 'school_admin' || role === 'teacher') {
                    if (school_id) {
                        updateData.school_id = school_id;
                    }
                } else {
                    // If changing to super_admin, remove school_id
                    updateData.school_id = null;
                }
            }
        } else if (school_id !== undefined) {
            // If only school_id is being updated
            updateData.school_id = school_id;
        }

        await user.update(updateData);
        res.json({ message: 'User updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

/**
 * Hard deletes a user from the system by their primary key ID.
 */
const deleteUser = async (req, res) => {
    try {
        await User.destroy({ where: { id: req.params.id } });
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get teachers by school from Users table
/**
 * A specialized endpoint to fetch purely 'Teacher' users for dropdowns and assignments.
 * Prevents exposing full user lists where only an active instructor list is needed.
 */
const getTeachersBySchool = async (req, res) => {
    try {
        const { school_id } = req.query;
        const userRole = req.user?.role;
        const userId = req.user?.id;

        // Build where clause
        let whereClause = {};

        // Get teacher role ID
        const teacherRole = await Role.findOne({ where: { name: 'teacher' } });
        if (!teacherRole) {
            return res.status(404).json({ message: 'Teacher role not found' });
        }
        whereClause.role_id = teacherRole.id;

        // Role-based filtering
        if (userRole === 'school_admin' || userRole === 'teacher') {
            // School Admin/Teacher can only see teachers from their school
            const currentUser = await User.findByPk(userId);
            if (currentUser && currentUser.school_id) {
                whereClause.school_id = currentUser.school_id;
            }
        } else if (userRole === 'super_admin') {
            // Super Admin can filter by specific school
            if (school_id) {
                whereClause.school_id = school_id;
            }
        }

        const teachers = await User.findAll({
            where: whereClause,
            include: [
                { model: Role, attributes: ['name'] },
                { model: School, attributes: ['name'], required: false }
            ],
            attributes: ['id', 'name', 'email', 'school_id'],
            order: [['name', 'ASC']]
        });

        const formatted = teachers.map(t => ({
            id: t.id,
            name: t.name,
            email: t.email,
            school_id: t.school_id,
            school_name: t.School ? t.School.name : 'N/A'
        }));

        res.json({
            success: true,
            data: formatted,
            total: formatted.length
        });

    } catch (err) {
        console.error('Error fetching teachers by school:', err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getTeachersBySchool
};
