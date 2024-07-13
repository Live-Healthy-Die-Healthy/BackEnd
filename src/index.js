'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'test';
const config = require('../config/config.json')[env];
const db = {};



let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    port: config.port,
    define: {
      timestamps: true,
      underscored: false,
    },
  });
}


const User = require('./models/user');
User.init(sequelize);

db.User = User;
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;