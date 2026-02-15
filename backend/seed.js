const { sequelize, User, Role, School, Teacher } = require('./models');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const seed = async () => {
    try {
        //console.log('Connecting to database...');
        await sequelize.authenticate();

        //console.log('Recreating tables...');
        await sequelize.sync({ force: true }); // DEV ONLY ✅

        // 1. Seed Roles
        const roles = ['super_admin', 'school_admin', 'teacher'];
        const roleMap = {};

        for (const roleName of roles) {
            const role = await Role.create({ name: roleName });
            roleMap[roleName] = role.id;
        }
        //console.log('Roles seeded.');

        // 2. Seed Super Admin
        const passwordHash = await bcrypt.hash('123456', 10);

        await User.create({
            name: 'Super Admin',
            email: 'admin@school.com',
            password: passwordHash,
            role_id: roleMap.super_admin
        });
        //console.log('Super Admin created: admin@school.com / 123456');

        // 3. Seed School
        const school = await School.create({
            name: 'Springfield High',
            address: '742 Evergreen Terrace',
            contact_number: '555-0100',
            email: 'info@springfield.edu'
        });
        //console.log('School created: Springfield High');

        // 4. Seed School Admin
        // Note: In our strict schema, we might need a link, but User model doesn't strictly enforce school_id yet 
        // unless we added it. For now, we create the user. Ideally, School Admin should be linked to School.
        // Let's assume for this demo, the frontend/backend logic handles "School Admin manages School ID 1"

        // We'll Create the user
        const schoolAdminUser = await User.create({
            name: 'Principal Skinner',
            email: 'principal@school.com',
            password: passwordHash,
            role_id: roleMap.school_admin
        });
        // If we had a SchoolAdmin table, we'd link it here. For now, we just have the User.
        // We can manually add a property if our User model supported it, but let's stick to the RBAC.
        //console.log('School Admin created: principal@school.com / 123456');

        // 5. Seed Teacher
        const teacherUser = await User.create({
            name: 'Edna Krabappel',
            email: 'teacher@school.com',
            password: passwordHash,
            role_id: roleMap.teacher
        });

        await Teacher.create({
            user_id: teacherUser.id,
            school_id: school.id,
            subjects: JSON.stringify(['Math', 'History'])
        });
        //console.log('Teacher created: teacher@school.com / 123456');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
