const { ExerciseList } = require('./src/index');
const fs = require('fs');
const path = require('path');

const loadExerciseData = async () => {
  try {
    await ExerciseList.bulkCreate([
      {
        exerciseName: 'Push Up',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'Push Up.jpg')),
        exercisePart: 'chest',
      },
      {
        exerciseName: 'Jogging',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'Jogging.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: 'Squats',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'Squats.jpg')),
        exercisePart: 'leg',
      },
      {
        exerciseName: 'Cycling',
        exerciseType: 'AerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'Cycling.jpg')),
        exercisePart: 'AerobicExercise',
      },
      {
        exerciseName: 'Pull Up',
        exerciseType: 'AnaerobicExercise',
        exerciseImage: fs.readFileSync(path.join(__dirname, 'images', 'Pull Up.jpg')),
        exercisePart: 'back',
      }
    ], { logging: false });
    console.log('ExerciseList added');
  } catch (error) {
    console.error('Error adding ExerciseList:', error);
  }
};

module.exports = loadExerciseData;
