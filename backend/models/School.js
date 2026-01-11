const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const School = sequelize.define('School', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address: {
        type: DataTypes.TEXT,
    },
    contact_number: {
        type: DataTypes.STRING,
    },
    email: {
        type: DataTypes.STRING,
    },
    principal: {
        type: DataTypes.STRING,
    },
    teacher_count: {
        type: DataTypes.INTEGER,
    },
    student_count: {
        type: DataTypes.INTEGER,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Active'
    }
}, {
    timestamps: true
});

module.exports = School;
