require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { sequelize, ExerciseLog, User, ExerciseList, AerobicExercise, AnaerobicExercise } = require('./src/index');
const routes = require('./src/routes/routes');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

    // ExerciseList 목업 데이터
    await ExerciseList.bulkCreate([
      {
        exerciseId: 1,
        exerciseName: 'Running',
        exerciseType: 'Aerobic',
        exercisePart: 'Legs'
      },
      {
        exerciseId: 2,
        exerciseName: 'Bench Press',
        exerciseType: 'Anaerobic',
        exercisePart: 'Chest'
      },
      {
        exerciseId: 3,
        exerciseName: 'Squat',
        exerciseType: 'Anaerobic',
        exercisePart: 'Thighs',
      },
    ]);

    // AerobicExercise 목업 데이터
    await AerobicExercise.bulkCreate([
      {
        exerciseId: 1,
        distance: 5.0,
        exerciseTime: '00:30:00'
      },
    ]);

    // AnaerobicExercise 목업 데이터
    await AnaerobicExercise.bulkCreate([
      {
        exerciseId: 2,
        set: 3,
        weight: 50,
        repetition: 10,
        exerciseTime: '00:45:00'
      },
      {
        exerciseId: 3,
        set: 4,
        weight: 60,
        repetition: 8,
        exerciseTime: '00:50:00'
      }
    ]);

    // ExerciseLog 목업 데이터
    await ExerciseLog.bulkCreate([
      {
        exerciseId: 1,
        userId: '1234',
        exerciseType: 'Aerobic',
        exerciseDate: '2024-07-13'
      },
      {
        exerciseId: 2,
        userId: '1234',
        exerciseType: 'Anaerobic',
        exerciseDate: '2024-07-14'
      },
      {
        exerciseId: 1,
        userId: 'user2',
        exerciseType: 'Aerobic',
        exerciseDate: '2024-07-13'
      },
      {
        exerciseId: 2,
        userId: 'user2',
        exerciseType: 'Anaerobic',
        exerciseDate: '2024-07-14'
      }
    ]);

    console.log('test data uploaded');
    /*const users = await User.findAll();
    const exerciseLogs = await ExerciseLog.findAll();
    console.log('Users:', JSON.stringify(users, null, 2));
    console.log('ExerciseLogs:', JSON.stringify(exerciseLogs, null, 2));
    */
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};


initializeApp();

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});