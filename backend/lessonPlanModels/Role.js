const { DataTypes } = require('sequelize');
const { lessonPlanSequelize: sequelize } = require('../config/lessonPlanDatabase');

const Role = sequelize.define(
    'Role',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['name'],
                name: 'roles_name_unique'
            }
        ]
    }
);

module.exports = Role;
