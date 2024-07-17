'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class DietLogDetail extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      dietDetailLogId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      quantity: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      dietLogId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'dietLog',
          key: 'dietLogId'
        }
      },
      menuId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'menuList',
          key: 'menuId'
        }
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'DietLogDetail',
      tableName: 'dietLogDetail',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(models) {
    this.belongsTo(models.DietLog, { foreignKey: 'dietLogId', as: 'dietLog' });
    this.belongsTo(models.MenuList, { foreignKey: 'menuId', as: 'menu' });
  }
}
