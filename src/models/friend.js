'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class Friend extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      friend_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'users', 
          key: 'userId',  
        },
      },
      to_user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'users', 
          key: 'userId',  
        },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending', // 기본값을 'pending'으로 설정
      },
      request_date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW, // 요청 날짜의 기본값을 현재 시간으로 설정
      },
      accept_date: {
        type: DataTypes.DATE,
        allowNull: true,
      }
    }, {
      sequelize,
      timestamps: false,
      modelName: 'Friend',
      tableName: 'friend',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    this.belongsTo(models.User, { foreignKey: 'to_user_id', as: 'to_user' });
  }
};
