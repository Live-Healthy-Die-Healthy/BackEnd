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
        type: DataTypes.BLOB('medium'),
        allowNull: true,
      }, 
      userMuscleMass: { // 골격근량
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      userBmi: { // BMI
        type: DataTypes.FLOAT,
        allowNull: true, 
      },
      userBodyFatPercentage: { // 체지방률
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      userBmr: { // 기초대사량
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userCarbo:{
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      userProtein:{
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      userFat:{
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      recommendedCal: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    }, {
      sequelize,
      timestamps: true,
      modelName: 'User',
      tableName: 'users',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
}