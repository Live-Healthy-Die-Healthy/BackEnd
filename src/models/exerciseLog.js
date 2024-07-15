'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class ExerciseLog extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
        exerciseLogId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
          },
          exerciseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
              model: 'exerciseLists', // 이 모델과 연결
              key: 'exerciseId'
            }
          },
          userId: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
              model: 'users', // 이 모델과 연결
              key: 'userId'
            }
          },
          exerciseType: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          exerciseDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
          }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'ExerciseLog',
      tableName: 'exerciseLog',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
}