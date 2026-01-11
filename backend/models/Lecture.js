const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Teacher = require('./Teacher');
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
            model: Teacher,
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
    status: {
        type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
    }
}, {
    timestamps: true
});

Teacher.hasMany(Lecture, { foreignKey: 'teacher_id' });
Lecture.belongsTo(Teacher, { foreignKey: 'teacher_id' });

Class.hasMany(Lecture, { foreignKey: 'class_id' });
Lecture.belongsTo(Class, { foreignKey: 'class_id' });

module.exports = Lecture;
