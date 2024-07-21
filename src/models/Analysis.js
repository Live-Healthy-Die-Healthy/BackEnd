'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = class Analysis extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
        analysisId: {
            type: DataTypes.STRING,
            primaryKey: true,
          },
          userId: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
              model: 'users', // 이 모델과 연결
              key: 'userId'
            }
          },
          dietImage: {
            type: DataTypes.BLOB("medium"),
            allowNull: false,
          },
          result_json: {
            type: DataTypes.JSON,
            allowNull: true,
          },
          status:{
            type: DataTypes.STRING,
            allowNull: false,
          },
          dietDetailLogIds: {
            type: DataTypes.JSON, 
            allowNull: true
          }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Analysis',
      tableName: 'analysis',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

};

