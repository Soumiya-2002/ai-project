const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Lecture = require('./Lecture');

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    lecture_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Lecture,
            key: 'id'
        }
    },
    analysis_data: {
        type: DataTypes.TEXT, // JSON string or text summary from AI
        allowNull: true
    },
    rubric_scores: {
        type: DataTypes.JSON, // { clarity: 5, engagement: 4, ... }
        allowNull: true
    },
    generated_by_ai: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});

Lecture.hasOne(Report, { foreignKey: 'lecture_id' });
Report.belongsTo(Lecture, { foreignKey: 'lecture_id' });

module.exports = Report;
