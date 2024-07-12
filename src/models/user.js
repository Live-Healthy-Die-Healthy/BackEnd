const { Sequelize, DataTypes } = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      userId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      userEmail: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '',
      },
      userBirth: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      userHeight: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userWeight: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userGender: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      userImage: {
        type: DataTypes.BLOB,
        allowNull: false,
      },
      connectedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      }
    }, {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'User',
      tableName: 'user',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }
}

