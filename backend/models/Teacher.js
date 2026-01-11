const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const School = require('./School');

const Teacher = sequelize.define('Teacher', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    school_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: School,
            key: 'id'
        }
    },
    subjects: {
        type: DataTypes.JSON, // Array of subjects they teach
        defaultValue: []
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Active'
    },
    experience: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true
});

// Associations
User.hasOne(Teacher, { foreignKey: 'user_id' });
Teacher.belongsTo(User, { foreignKey: 'user_id' });

School.hasMany(Teacher, { foreignKey: 'school_id' });
Teacher.belongsTo(School, { foreignKey: 'school_id' });

module.exports = Teacher;
