'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class DietLog extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      dietLogId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      dietDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      dietType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'userId'
        }
      },
      dietImage: {
        type: DataTypes.BLOB('long'),
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'DietLog',
      tableName: 'dietLog',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    this.hasMany(models.DietLogDetail, { foreignKey: 'dietLogId', as: 'details' });
  }
}
