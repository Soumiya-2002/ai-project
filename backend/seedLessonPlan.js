const { sequelize, User, Role, School, Teacher } = require('./lessonPlanModels');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const seed = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: true }); 

        // 1. Seed Roles
        const roles = ['super_admin', 'school_admin', 'teacher'];
        const roleMap = {};

        for (const roleName of roles) {
            const role = await Role.create({ name: roleName });
            roleMap[roleName] = role.id;
        }

        // 2. Seed Super Admin
        const passwordHash = await bcrypt.hash('123456', 10);

        await User.create({
            name: 'Lesson Plan Admin',
            email: 'admin@lessonplan.com',
            password: passwordHash,
            role_id: roleMap.super_admin
        });

        // 3. Seed School
        const school = await School.create({
            name: 'Lesson Plan High',
            address: '123 Lesson Way',
            contact_number: '555-0000',
            email: 'info@lessonplan.edu'
        });

        // 4. Seed School Admin
        const schoolAdminUser = await User.create({
            name: 'Lesson Plan Principal',
            email: 'principal@lessonplan.com',
            password: passwordHash,
            role_id: roleMap.school_admin
        });

        // 5. Seed Teacher
        const teacherUser = await User.create({
            name: 'Lesson Plan Teacher',
            email: 'teacher@lessonplan.com',
            password: passwordHash,
            role_id: roleMap.teacher
        });

        await Teacher.create({
            user_id: teacherUser.id,
            school_id: school.id,
            subjects: JSON.stringify(['Math', 'History'])
        });

        console.log('Successfully seeded Lesson Plan database!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
