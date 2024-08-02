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
const DietLog = require('./models/dietLog');
const DietLogDetail = require('./models/dietLogDetail');
const MenuList = require('./models/menuList');
const Analysis = require('./models/Analysis');
const DailyReport = require('./models/dailyReport');
const WeeklyReport = require('./models/weeklyReport');
const MonthlyReport = require('./models/monthlyReport');
const ExerciseScrap = require('./models/exerciseScrap');
const Friend = require('./models/friend');
const CheatDay = require('./models/cheatDay');
const UserChanged = require('./models/userChanged');

User.init(sequelize);
AerobicExercise.init(sequelize);
AnaerobicExercise.init(sequelize);
ExerciseList.init(sequelize);
ExerciseLog.init(sequelize);
DietLog.init(sequelize);
DietLogDetail.init(sequelize);
MenuList.init(sequelize);
Analysis.init(sequelize);
DailyReport.init(sequelize);
WeeklyReport.init(sequelize);
MonthlyReport.init(sequelize);
ExerciseScrap.init(sequelize);
Friend.init(sequelize);
CheatDay.init(sequelize);
UserChanged.init(sequelize);

db.User = User;
db.AerobicExercise = AerobicExercise;
db.AnaerobicExercise = AnaerobicExercise;
db.ExerciseList = ExerciseList;
db.ExerciseLog = ExerciseLog;
db.DietLog = DietLog;
db.DietLogDetail = DietLogDetail;
db.MenuList = MenuList;
db.Analysis = Analysis;
db.DailyReport = DailyReport;
db.WeeklyReport = WeeklyReport;
db.MonthlyReport = MonthlyReport;
db.ExerciseScrap = ExerciseScrap;
db.Friend = Friend;
db.CheatDay = CheatDay;
db.UserChanged = UserChanged;

// 모델 간의 관계 설정
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;