require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize, ExerciseLog } = require('./src/index');

const app = express();
const port = process.env.PORT || 3000;


const initializeApp = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync({ force: true });
    console.log('Database synchronized');


    await ExerciseLog.bulkCreate([
      {
        userId: 'user1',
        exerciseDate: '2024-07-13',
        exerciseType: 'AerobicExercise',
        distance: 30,
        exerciseTime: '00:55:00'
      },
      {
        userId: 'user1',
        exerciseDate: '2024-07-13',
        exerciseType: 'AnaerobicExercise',
        set: 5,
        weight: '55',
        repetition: 10,
        breakTime: '00:01:00'
      },
      {
        userId: 'user2',
        exerciseDate: '2024-07-13',
        exerciseType: 'AerobicExercise',
        distance: 25,
        exerciseTime: '00:40:00'
      },
      {
        userId: 'user2',
        exerciseDate: '2024-07-13',
        exerciseType: 'AnaerobicExercise',
        set: 4,
        weight: '50',
        repetition: 12,
        breakTime: '00:02:00'
      }
    ]);
    console.log('test data uploaded');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};


initializeApp();

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});