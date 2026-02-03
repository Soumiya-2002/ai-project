/**
 * Create Teacher Records for Users with Teacher Role
 */

const { sequelize } = require('./config/database');
const { User, Teacher, Role, School } = require('./models');

async function createTeacherRecords() {
    try {
        console.log('🔍 Finding users with teacher role...\n');

        // Find teacher role
        const teacherRole = await Role.findOne({ where: { name: 'teacher' } });
        console.log('✅ Teacher Role ID:', teacherRole.id);

        // Find all users with teacher role
        const teacherUsers = await User.findAll({
            where: { role_id: teacherRole.id },
            include: [{ model: School, attributes: ['name'] }]
        });

        console.log(`\n✅ Found ${teacherUsers.length} users with teacher role:\n`);

        for (const user of teacherUsers) {
            console.log(`📋 User: ${user.name} (${user.email})`);
            console.log(`   User ID: ${user.id}`);
            console.log(`   School ID: ${user.school_id}`);
            console.log(`   School: ${user.School ? user.School.name : 'N/A'}`);

            // Check if Teacher record exists
            const existingTeacher = await Teacher.findOne({ where: { user_id: user.id } });

            if (existingTeacher) {
                console.log(`   ✅ Teacher record exists (ID: ${existingTeacher.id})`);
            } else {
                console.log(`   ❌ No Teacher record found`);
                console.log(`   🔨 Creating Teacher record...`);

                const newTeacher = await Teacher.create({
                    user_id: user.id,
                    school_id: user.school_id,
                    subjects: 'General',
                    experience: 0,
                    status: 'active'
                });

                console.log(`   ✅ Teacher record created (ID: ${newTeacher.id})`);
            }
            console.log('');
        }

        console.log('\n✅ All teacher records verified/created!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    createTeacherRecords()
        .then(() => {
            console.log('\n✅ Script complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Failed:', error);
            process.exit(1);
        });
}

module.exports = { createTeacherRecords };
