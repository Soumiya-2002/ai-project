const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Role = require('./Role');
const School = require('./School');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // references: {
        //     model: Role,
        //     key: 'id'
        // }
    },
    school_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Optional - only for school_admin and teacher
        // references: {
        //     model: 'Schools',
        //     key: 'id'
        // }
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['email'],
            name: 'users_email_unique'
        }
    ]
});

Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

School.hasMany(User, { foreignKey: 'school_id' });
User.belongsTo(School, { foreignKey: 'school_id' });

module.exports = User;
