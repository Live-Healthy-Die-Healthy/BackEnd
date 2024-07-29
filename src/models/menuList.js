'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class MenuList extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      menuId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      menuName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      menuImage: {
        type: DataTypes.BLOB('long'),
        allowNull: true,
      },
      menuCalorie: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      menuCarbo:{
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      menuProtein:{
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      menuFat:{
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      menuGI:{
        type: DataTypes.DOUBLE,
        allowNull: true,
      }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'MenuList',  
      tableName: 'menuList',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(models) {
    this.hasMany(models.DietLogDetail, { foreignKey: 'menuId', as: 'dietDetails' });
  }
}
