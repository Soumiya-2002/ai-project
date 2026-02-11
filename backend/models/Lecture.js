const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Class = require('./Class');

const Lecture = sequelize.define('Lecture', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    class_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Class,
            key: 'id'
        }
    },
    lecture_number: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    time_slot: {
        type: DataTypes.STRING, // e.g., "10:00 AM - 11:00 AM"
    },
    video_url: {
        type: DataTypes.STRING, // URL to stored video
        allowNull: true
    },
    grade: {
        type: DataTypes.STRING,
        allowNull: true // Store "Grade 10", "Kindergarten", etc.
    },
    section: {
        type: DataTypes.STRING,
        allowNull: true // Store "A", "B", "Rose", etc.
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
    }
}, {
    timestamps: true
});

// User (as teacher) has many Lectures
User.hasMany(Lecture, { foreignKey: 'teacher_id', as: 'lectures' });
Lecture.belongsTo(User, { foreignKey: 'teacher_id', as: 'Teacher' });

Class.hasMany(Lecture, { foreignKey: 'class_id' });
Lecture.belongsTo(Class, { foreignKey: 'class_id' });

module.exports = Lecture;
