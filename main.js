require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { sequelize, ExerciseLog, User, ExerciseList, AerobicExercise, AnaerobicExercise } = require('./src/index');
const routes = require('./src/routes/exerciseRoute');
const routes2 = require('./src/routes/routes');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors())

app.use(express.json());
app.use('/', routes);
app.use('/', routes2);


const initializeApp = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

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
      userId: 'test1',
      username: 'testuser1',
      connectedAt: new Date(),
      password: 'password1',
      userEmail: 'testuser1@example.com',
      userBirth: new Date('1990-01-01'),
      userHeight: 170,
      userWeight: 70,
      userGender: 'male',
      userImage: null // 필요한 경우 이미지를 추가할 수 있습니다.
    }
  ]);
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

  console.log('test data uploaded');
};



initializeApp();

