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
        allowNull: false,
      },
      connectedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userEmail: {
        type: DataTypes.STRING,
        allowNull: false,
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
        type: DataTypes.BLOB,
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