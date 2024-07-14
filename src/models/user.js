'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
        userId: {
            type: DataTypes.STRING,
            primaryKey: true,
          },
          username: {
            type: DataTypes.STRING,
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
          },
          connectedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'User',
      tableName: 'users',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
}