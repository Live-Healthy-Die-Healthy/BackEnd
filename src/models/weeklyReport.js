'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class WeeklyReport extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      weeklyReportId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'users', // User 모델과 연결
          key: 'userId',
        },
      },
      nextExercise: {
        type: DataTypes.STRING,
        allwNull: false,
      },
      nextDiet: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      meanExercise: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      meanDiet: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      weeklyFeedback: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'WeeklyReport',
      tableName: 'weeklyReport',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
};
