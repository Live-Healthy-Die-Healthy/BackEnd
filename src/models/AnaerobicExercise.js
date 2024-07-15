'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class AnaerobicExercise extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
        exerciseLogId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            references: {
              model: 'exerciseLog', // exerciseLog 모델과 연결
              key: 'exerciseLogId'
            }
          },
          set: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          weight: {
            type: DataTypes.JSON,
            allowNull: false,
          },
          repetition: {
            type: DataTypes.JSON,
            allowNull: false,
          },
          exerciseTime: {
            type: DataTypes.TIME,
            allowNull: false,
          }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'AnaerobicExercise',
      tableName: 'anaerobicExercise',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
  static associate(models) {
    this.belongsTo(models.ExerciseList, { foreignKey: 'exerciseId', as: 'exercise' });
  }
}
