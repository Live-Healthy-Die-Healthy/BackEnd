'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class MonthlyReport extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      monthlyReportId: {
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
      },
      meanCarbo: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      meanProtein: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      meanFat: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      dietData: {
        type: DataTypes.JSON,
        allowNull: true,
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
      },
      aeroInfo: {
        type: DataTypes.JSON,
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
      modelName: 'MonthlyReport',
      tableName: 'monthlyReport',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
};
