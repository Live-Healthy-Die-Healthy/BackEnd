const { Sequelize } = require('sequelize');

// 데이터베이스 연결 설정
const sequelize = new Sequelize({
  dialect: 'mariadb',
  host: '127.0.0.1',  
  port: 3301,      
  database: 'liveHealthy',  
  username: 'test',  
  password: '1234',
  logging: false,  
});

const User = require('./models/user')(sequelize, Sequelize.DataTypes);
const ExerciseList = require('./models/exerciseList')(sequelize, Sequelize.DataTypes);
const AerobicExercise = require('./models/AerobicExercise')(sequelize, Sequelize.DataTypes);
const AnaerobicExercise = require('./models/AnaerobicExercise')(sequelize, Sequelize.DataTypes);
const ExerciseLog = require('./models/exerciseLog')(sequelize, Sequelize.DataTypes);

User.hasMany(ExerciseList);
ExerciseList.belongsTo(User);

ExerciseList.hasOne(AerobicExercise, { foreignKey: 'exerciseId', as: 'aerobicExercise' });
ExerciseList.hasOne(AnaerobicExercise, { foreignKey: 'exerciseId', as: 'anaerobicExercise' });

AerobicExercise.belongsTo(ExerciseList, { foreignKey: 'exerciseId', as: 'exercise' });
AnaerobicExercise.belongsTo(ExerciseList, { foreignKey: 'exerciseId', as: 'exercise' });

ExerciseList.hasMany(ExerciseLog, { foreignKey: 'exerciseId', as: 'logs' });
ExerciseLog.belongsTo(ExerciseList, { foreignKey: 'exerciseId', as: 'exercise' });

User.hasMany(ExerciseLog, { foreignKey: 'userId', as: 'logs' });
ExerciseLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  ExerciseList,
  AerobicExercise,
  AnaerobicExercise,
  ExerciseLog,
};