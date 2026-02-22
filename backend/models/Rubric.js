const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Standard Rubrics or Custom ones
const Rubric = sequelize.define('Rubric', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    grade: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    original_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT('long'), // Parsed text from document
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Rubric;
