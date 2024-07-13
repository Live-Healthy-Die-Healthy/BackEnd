'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class ExerciseLog extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
        exerciseLogId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        exerciseDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        exerciseType: {
            type: DataTypes.ENUM('AerobicExercise', 'AnaerobicExercise'),
            allowNull: false
        },
        userId: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        exerciseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        distance: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        exerciseTime: {
            type: DataTypes.STRING,
            allowNull: true
        },
        set: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        weight: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        repetition: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        breakTime: {
            type: DataTypes.STRING,
            allowNull: true
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