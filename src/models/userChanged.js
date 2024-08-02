'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class UserChanged extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
        userChangeId: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
          },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'users', // User 모델의 테이블 이름
          key: 'userId'
        }
      },
      userHeight: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userWeight: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userMuscleMass: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      userBmi: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      userBodyFatPercentage: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      userBmr: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    }, {
      sequelize,
      timestamps: false,
      modelName: 'UserChanged',
      tableName: 'userChanged',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', targetKey: 'userId' });
  }
}