const { Sequelize } = require('sequelize');

// 데이터베이스 연결 설정
const sequelize = new Sequelize({
  dialect: 'mariadb',
  host: '127.0.0.1',  // 데이터베이스 호스트
  port: 3306,       // 데이터베이스 포트
  database: 'liveHealthy',  // 데이터베이스 이름
  username: 'test',  // 데이터베이스 사용자 이름
  password: '1234', // 데이터베이스 비밀번호
  logging: false,   // 쿼리 로깅을 비활성화합니다.
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