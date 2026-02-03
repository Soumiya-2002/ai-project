/**
 * Migration: Update Lectures table to reference Users instead of Teachers
 */

const { sequelize } = require('./config/database');

async function migrateLecturesToUsers() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        console.log('🔄 Starting migration: Lectures.teacher_id → Users.id\n');

        // Step 1: Drop existing foreign key constraint
        console.log('1️⃣  Dropping old foreign key constraint...');
        try {
            await queryInterface.removeConstraint('Lectures', 'lectures_ibfk_3');
            console.log('   ✅ Old foreign key removed\n');
        } catch (err) {
            console.log('   ⚠️  Foreign key might not exist or already removed:', err.message, '\n');
        }

        // Step 2: Add new foreign key constraint to Users table
        console.log('2️⃣  Adding new foreign key constraint to Users...');
        await sequelize.query(`
            ALTER TABLE Lectures
            ADD CONSTRAINT lectures_teacher_fk
            FOREIGN KEY (teacher_id)
            REFERENCES Users(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);
        console.log('   ✅ New foreign key added\n');

        console.log('✅ Migration complete!\n');
        console.log('Summary:');
        console.log('  - Lectures.teacher_id now references Users.id');
        console.log('  - Old Teacher table reference removed');
        console.log('  - Foreign key constraint: lectures_teacher_fk\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    migrateLecturesToUsers()
        .then(() => {
            console.log('✅ Migration script complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateLecturesToUsers };
