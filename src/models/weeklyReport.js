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
      meanCalories: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      meanCarbo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      meanProtein: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      meanFat: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      dietData: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      dietFeedback: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      exerciseFeedback: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      anAeroInfo: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      aeroInfo: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      totalExerciseTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      weeklyCal: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: 0,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      aerobicRatio: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        defaultValue: 0,
      },
      anaerobicRatio: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: 0,
      }
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
