require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt'); 
const { sequelize, User, ExerciseList } = require('./src/index');  // Sequelize 인스턴스 및 모델 가져오기

const app = express();
const port = process.env.PORT || 3301;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 라우트 설정
app.use('/api/exercises', require('./src/routes/routes'));  //


const initializeApp = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    await sequelize.sync({ force: true }); 
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
        exerciseName: 'PushUp',
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
    console.log('Exercises added');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

initializeApp();

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
