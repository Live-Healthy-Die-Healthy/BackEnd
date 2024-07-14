require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); 
const { sequelize, User, ExerciseList, AerobicExercise, AnaerobicExercise } = require('./src/index');
const exerciseRoutes = require('./src/routes/exerciseRoute');  
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', exerciseRoutes);

const initializeApp = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // 데이터베이스 동기화
    await sequelize.sync({ force: true });  // 모든 테이블을 삭제하고 다시 생성합니다.
    console.log('Database synchronized');


    // User 모델에 데이터 추가
    await User.bulkCreate([
      {
        userId: 'user1',
        username: '건생건사 유저',
        password: 1234,
        userEmail: 'user1@example.com',
        userBirth: '1990-01-01',
        userHeight: 170,
        userWeight: 70,
        userGender: 'Male',
        userImage: Buffer.from([]),  // 빈 BLOB 데이터
        connectedAt: new Date(),
      },
      {
        userId: 'user2',
        username: '건생건사 유저2',
        password: 5555,
        userEmail: 'user2@example.com',
        userBirth: '1992-02-02',
        userHeight: 160,
        userWeight: 60,
        userGender: 'Female',
        userImage: Buffer.from([]),  // 빈 BLOB 데이터
        connectedAt: new Date(),
      },
    ]);
    console.log('Users added');

    // ExerciseList 모델에 데이터 추가
    await ExerciseList.bulkCreate([
      {
        exerciseId: 1,
        exerciseName: 'Push Up',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: Buffer.from([]),
        exercisePart: 'Abs',
      },
      {
        exerciseId: 2,
        exerciseName: 'Jogging',
        exerciseType: 'AerobicExercise',
        exerciseImage: Buffer.from([]),
        exercisePart: 'Full Body',
      },
      {
        exerciseId: 3,
        exerciseName: 'Squats',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: Buffer.from([]),
        exercisePart: 'Thighs',
      },
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