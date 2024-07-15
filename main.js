require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { sequelize, ExerciseLog, User, ExerciseList, AerobicExercise, AnaerobicExercise } = require('./src/index');
const routes = require('./src/routes/exerciseRoute');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/', routes);

const initializeApp = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    // User 목업 데이터
    await User.bulkCreate([
      {
        userId: '1234',
        username: 'JohnDoe',
        password: 'password123',
        userEmail: 'john@example.com',
        userBirth: '1990-01-01',
        userHeight: 180,
        userWeight: 75,
        userGender: 'Male',
        connectedAt: new Date()
      },
      {
        userId: 'user2',
        username: 'JaneDoe',
        password: 'password456',
        userEmail: 'jane@example.com',
        userBirth: '1992-02-02',
        userHeight: 165,
        userWeight: 60,
        userGender: 'Female',
        connectedAt: new Date()
      }
    ]);

// ExerciseList 모델에 데이터 추가
await ExerciseList.bulkCreate([
  {
    exerciseId: 1,
    exerciseName: 'Push Up',
    exerciseType: 'AnaerobicExercise',
    exerciseImage: Buffer.from([]),  // 빈 이미지
    exercisePart: 'Chest',  // 주요 부위 변경
  },
  {
    exerciseId: 2,
    exerciseName: 'Jogging',
    exerciseType: 'AerobicExercise',
    exerciseImage: Buffer.from([]),  // 빈 이미지
    exercisePart: 'Full Body',  // 운동 부위 변경
  },
  {
    exerciseId: 3,
    exerciseName: 'Squats',
    exerciseType: 'AnaerobicExercise',
    exerciseImage: Buffer.from([]),  // 빈 이미지
    exercisePart: 'Legs',  // 주요 부위 변경
  },
  {
    exerciseId: 4,
    exerciseName: 'Cycling',
    exerciseType: 'AerobicExercise',
    exerciseImage: Buffer.from([]),  // 빈 이미지
    exercisePart: 'Legs',  // 운동 부위
  },
  {
    exerciseId: 5,
    exerciseName: 'Pull Up',
    exerciseType: 'AnaerobicExercise',
    exerciseImage: Buffer.from([]),  // 빈 이미지
    exercisePart: 'Back',  // 주요 부위
  }
]);
console.log('ExerciseList added');

// AerobicExercise 데이터 추가
await AerobicExercise.bulkCreate([
{
  exerciseId: 2,
  distance: 5.0,
  exerciseTime: '00:30:00', 
},
]);
console.log('AerobicExercises added');

// AnaerobicExercise 데이터 추가
await AnaerobicExercise.bulkCreate([
{
  exerciseId: 1,
  set: 3,
  weight: 10.0,
  repetition: 15,
  exerciseTime: '00:10:00', 
},
{
  exerciseId: 3,
  set: 4,
  weight: 20.0,
  repetition: 12,
  exerciseTime: '00:20:00',  
},
]);
console.log('AnaerobicExercises added');
} catch (error) {
console.error('Unable to connect to the database:', error);
}
}

// 메인 함수 호출
initializeApp();

app.listen(port, () => {
console.log(`App listening on port ${port}`);
});