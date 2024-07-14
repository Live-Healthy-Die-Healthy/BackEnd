'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class AerobicExercise extends Sequelize.Model {
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
          distance: {
            type: DataTypes.FLOAT,
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
      modelName: 'AerobicExercise',
      tableName: 'aerobicExercise',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
}