const { lessonPlanSequelize: sequelize, connectLessonPlanDB: connectDB } = require('../config/lessonPlanDatabase');
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
        // when Sequelize tries to drop non-existent constraints.
        await sequelize.sync({ alter: false });

        // Force alter specifically for 'Rubric', 'Lecture', and 'User' to update schema 
        // without affecting 'Roles' which has max key issues on alter: true
        await User.sync({ alter: true });
        await Rubric.sync({ alter: true });
        await Lecture.sync({ alter: true });

        //console.log('Database & tables synced!');
    } catch (error) {
        if (retries > 0 && error.parent && error.parent.code === 'ER_LOCK_DEADLOCK') {
            console.warn(`[Info] Database sync retry due to lock... (${retries} left)`);
            await new Promise(res => setTimeout(res, 2000));
            return syncDatabase(retries - 1);
        } else {
            console.error('Error syncing database:', error);
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
