'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class ExerciseList extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
        exerciseId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          exerciseName: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          exerciseType: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          exerciseImage: {
            type: DataTypes.BLOB,
          },
          exercisePart: {
            type: DataTypes.STRING,
          }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'ExerciseList',
      tableName: 'exerciseLists',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
  static associate(models) {
    this.hasMany(models.ExerciseLog, { foreignKey: 'exerciseId', as: 'ExerciseLogs' }); // alias 수정
  }
}