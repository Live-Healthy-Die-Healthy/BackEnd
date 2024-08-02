'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class DailyReport extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      dailyReportId: {
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
      totalCalories: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
      },
      totalCarbo: {
        type: DataTypes.DOUBLE,
        allowNUull: true,
        defaultValue: 0
      },
      totalProtein: {
        type: DataTypes.DOUBLE,
        allowNUull: true,
        defaultValue: 0
      },
      totalFat: {
        type: DataTypes.DOUBLE,
        allowNUull: true,
        defaultValue: 0
      },
      breakfastLog: {
        type: DataTypes.JSON, // 아침 식사 로그
        allowNull: true,
        defaultValue: {}
      },
      breakfastCal: {
        type: DataTypes.DOUBLE, // 아침 식사 칼로리
        allowNull: true,
        defaultValue: 0
      },
      lunchLog: {
        type: DataTypes.JSON, // 점심 식사 로그
        allowNull: true,
        defaultValue: {}
      },
      lunchCal: {
        type: DataTypes.DOUBLE, // 점심 식사 칼로리
        allowNull: true,
        defaultValue: 0
      },
      dinnerLog: {
        type: DataTypes.JSON, // 저녁 식사 로그
        allowNull: true,
        defaultValue: {}
      },
      dinnerCal: {
        type: DataTypes.DOUBLE, // 저녁 식사 칼로리
        allowNull: true,
        defaultValue: 0
      },
      snackLog: {
        type: DataTypes.JSON, // 간식 로그
        allowNull: true,
        defaultValue: {}
      },
      snackCal: {
        type: DataTypes.DOUBLE, // 간식 칼로리
        allowNull: true,
        defaultValue: 0
      },
      recommendedCal: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      dietFeedback: {
        type: DataTypes.TEXT, // 수정된 부분: STRING에서 TEXT로 변경
        allowNull: true,
        defaultValue: null
      },
      exerciseFeedback: {
        type: DataTypes.TEXT, // 수정된 부분: STRING에서 TEXT로 변경
        allowNull: true,
        defaultValue: null
      },
      date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      anAeroInfo: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
      },
      aeroInfo: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
      },
      dietInfo: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
      }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'DailyReport',
      tableName: 'dailyReport',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
};
