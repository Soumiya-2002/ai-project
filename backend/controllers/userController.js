const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await User.findAndCountAll({
            include: [{ model: Role, attributes: ['name'] }],
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const formatted = rows.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.Role ? u.Role.name : 'N/A'
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

const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        let user = await User.findOne({ where: { email } });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const roleRecord = await Role.findOne({ where: { name: role } });
        if (!roleRecord) return res.status(400).json({ message: 'Invalid Role' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            name,
            email,
            password: hashedPassword,
            role_id: roleRecord.id
        });

        res.status(201).json({ message: 'User created' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const updateData = { name, email };

        if (role) {
            const roleRecord = await Role.findOne({ where: { name: role } });
            if (roleRecord) {
                updateData.role_id = roleRecord.id;
            }
        }

        await user.update(updateData);
        res.json({ message: 'User updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const deleteUser = async (req, res) => {
    try {
        await User.destroy({ where: { id: req.params.id } });
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
};
