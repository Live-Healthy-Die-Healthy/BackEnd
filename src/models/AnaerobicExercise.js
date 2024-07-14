'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class AnaerobicExercise extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
        exerciseId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
              model: 'exerciseLists',
              key: 'exerciseId'
            }
          },
          set: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          weight: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          repetition: {
            type: DataTypes.INTEGER,
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
}