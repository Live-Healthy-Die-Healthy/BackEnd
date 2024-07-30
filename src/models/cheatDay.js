'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class CheatDay extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      cheatDayId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cheatDayDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: true,
      modelName: 'CheatDay',
      tableName: 'cheatDay',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
};