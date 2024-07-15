
const { Sequelize, DataTypes } = require('sequelize');

module.exports = class AerobicExercise extends Sequelize.Model {
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