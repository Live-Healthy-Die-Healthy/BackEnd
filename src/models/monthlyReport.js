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
      nextExercise: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nextDiet: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      meanTraining: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      meanCalories: {
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
