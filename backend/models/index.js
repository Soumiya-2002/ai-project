const { sequelize, connectDB } = require('../config/database');
const Role = require('./Role');
const User = require('./User');
const School = require('./School');
const Teacher = require('./Teacher');
const Class = require('./Class');
const Lecture = require('./Lecture');
const Report = require('./Report');
const Rubric = require('./Rubric');

const syncDatabase = async (retries = 3) => {
    try {
        await sequelize.authenticate();
        console.log('Database & tables synced with alterations!');
    } catch (error) {
        console.error('Error syncing database:', error);
        if (retries > 0 && error.parent && error.parent.code === 'ER_LOCK_DEADLOCK') {
            console.log(`Deadlock detected. Retrying sync in 2 seconds... (${retries} retries left)`);
            await new Promise(res => setTimeout(res, 2000));
            return syncDatabase(retries - 1);
        }
    }
};

module.exports = {
    sequelize,
    connectDB,
    syncDatabase,
    Role,
    User,
    School,
    Teacher,
    Class,
    Lecture,
    Report,
    Rubric
};
