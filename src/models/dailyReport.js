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
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalTraining: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      dietFeedback: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      exerciseFeedback: {
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
