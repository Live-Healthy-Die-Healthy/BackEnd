const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'test';
const config = require('../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: config.dialect,
    port: config.port,
    define: {
      timestamps: true,
      underscored: false,
    },
  });
}

// 모델을 가져와 초기화
const User = require('./models/user');
const ExerciseList = require('./models/exerciseList');

User.init(sequelize);
ExerciseList.init(sequelize);

db.User = User;
db.ExerciseList= ExerciseList;

// 모델 간의 관계 설정
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;