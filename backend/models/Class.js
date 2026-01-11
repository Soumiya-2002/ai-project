const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const School = require('./School');

const Class = sequelize.define('Class', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false, // e.g., "Senior KG", "Class 10"
    },
    section: {
        type: DataTypes.STRING, // e.g., "A", "B"
    },
    school_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: School,
            key: 'id'
        }
    }
}, {
    timestamps: true
});

School.hasMany(Class, { foreignKey: 'school_id' });
Class.belongsTo(School, { foreignKey: 'school_id' });

module.exports = Class;
