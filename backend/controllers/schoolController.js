const { School, Class } = require('../models');

const addSchool = async (req, res) => {
    try {
        const { name, address, contact_number, email, principal, teacher_count, student_count } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and Email are required' });
        }

        // Check for duplicates
        const existingSchool = await School.findOne({ where: { email } });
        if (existingSchool) {
            return res.status(400).json({ message: 'School with this email already exists' });
        }

        const existingName = await School.findOne({ where: { name } });
        if (existingName) {
            return res.status(400).json({ message: 'School with this name already exists' });
        }

        const school = await School.create({
            name,
            address,
            contact_number,
            email,
            principal,
            teacher_count,
            student_count
        });

        res.status(201).json(school);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getSchools = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await School.findAndCountAll({
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            data: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const updateSchool = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, contact_number, email, principal, teacher_count, student_count, status } = req.body;

        const school = await School.findByPk(id);
        if (!school) return res.status(404).json({ message: 'School not found' });

        // If email is changing, check for duplicates
        if (email && email !== school.email) {
            const existingEmail = await School.findOne({ where: { email } });
            if (existingEmail) return res.status(400).json({ message: 'Email already in use' });
        }

        await school.update({ name, address, contact_number, email, principal, teacher_count, student_count, status });
        res.json(school);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const deleteSchool = async (req, res) => {
    try {
        const { id } = req.params;
        const school = await School.findByPk(id);
        if (!school) return res.status(404).json({ message: 'School not found' });

        await school.destroy();
        res.json({ message: 'School deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const addClass = async (req, res) => {
    try {
        const { school_id } = req.params;
        const { name, section } = req.body;

        const newClass = await Class.create({
            name,
            section,
            school_id
        });

        res.status(201).json(newClass);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const getClasses = async (req, res) => {
    try {
        const { school_id } = req.params;
        const classes = await Class.findAll({ where: { school_id } });
        res.json(classes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    addSchool,
    getSchools,
    updateSchool,
    deleteSchool,
    addClass,
    getClasses
};
