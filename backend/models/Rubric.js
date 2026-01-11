const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Standard Rubrics or Custom ones
const Rubric = sequelize.define('Rubric', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    criteria: {
        type: DataTypes.STRING, // e.g., "Student Engagement"
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT, // What to look for
    },
    max_score: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    }
}, {
    timestamps: true
});

module.exports = Rubric;
