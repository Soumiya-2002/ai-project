const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, Teacher } = require('../models');

const register = async (req, res) => {
    try {
        const { name, email, password, role, school_id } = req.body; // 'role' is string name here

        // Check if user exists
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Find Role ID
        const roleRecord = await Role.findOne({ where: { name: role } });
        if (!roleRecord) {
            return res.status(400).json({ message: 'Invalid Role' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        user = await User.create({
            name,
            email,
            password: hashedPassword,
            role_id: roleRecord.id
        });

        // If role is teacher, link to school
        if (role === 'teacher' && school_id) {
            await Teacher.create({
                user_id: user.id,
                school_id,
                subjects: []
            });
        }

        // Create JWT
        const payload = {
            user: {
                id: user.id,
                role: role // send string role in token
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, role: role } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        //console.log(email, password);
        // Check if user exists
        let user = await User.findOne({
            where: { email },
            include: [Role, { model: require('../models').School, required: false }]
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Create JWT
        const payload = {
            user: {
                id: user.id,
                role: user.Role.name
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        role: user.Role.name,
                        school_id: user.school_id,
                        school_name: user.School ? user.School.name : null
                    }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    register,
    login
};
