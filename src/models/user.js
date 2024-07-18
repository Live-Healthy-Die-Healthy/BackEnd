'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '사용자',
      },
      connectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '1234',
      },
      userEmail: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userBirth: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      userHeight: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userWeight: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userGender: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userImage: {
        type: DataTypes.BLOB('long'),
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: false,
      modelName: 'User',
      tableName: 'users',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
}