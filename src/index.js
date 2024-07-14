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

  const AerobicExercise = require('./models/AerobicExercise');
  const AnaerobicExercise = require('./models/AnaerobicExercise');
  const ExerciseList = require('./models/exerciseList');
  const ExerciseLog = require('./models/exerciseLog');
  const User = require('./models/user');

  AerobicExercise.init(sequelize);
  AnaerobicExercise.init(sequelize);
  ExerciseList.init(sequelize);
  ExerciseLog.init(sequelize);
  User.init(sequelize);

  db.AerobicExercise = AerobicExercise;
  db.AnaerobicExercise = AnaerobicExercise;
  db.ExerciseList = ExerciseList;
  db.ExerciseLog = ExerciseLog;
  db.User = User;

  // 모델 간의 관계 설정
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

module.exports = db;