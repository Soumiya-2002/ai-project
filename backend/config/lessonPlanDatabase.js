const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const lessonPlanSequelize = new Sequelize(
    process.env.LESSON_PLAN_DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
    }
);

const connectLessonPlanDB = async () => {
    try {
        await lessonPlanSequelize.authenticate();
        //console.log('Lesson Plan MySQL Database connected successfully.');
    } catch (error) {
        console.error('Unable to connect to the Lesson Plan database:', error);
    }
};

module.exports = { lessonPlanSequelize, connectLessonPlanDB };
