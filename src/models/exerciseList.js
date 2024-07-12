const { Sequelize, DataTypes } = require('sequelize');

module.exports = class ExerciseList extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      exerciseId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      exerciseName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      exerciseType: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      exercisePart: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      exerciseImage: {
        type: DataTypes.BLOB,
        allowNull: false,
      }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'ExerciseList',
      tableName: 'exerciseList',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
}