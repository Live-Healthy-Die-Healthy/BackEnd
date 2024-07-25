'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class exerciseScrap extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      exerciseScrapId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      exerciseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'ExerciseScrap',  
      tableName: 'exerciseScrap',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(models) {
    this.belongsTo(models.ExerciseList, { foreignKey: 'exerciseId', as: 'exercise' });
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}
