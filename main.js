require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { sequelize, ExerciseLog, User, ExerciseList, 
  AerobicExercise, AnaerobicExercise, DietLog, 
  DietLogDetail, MenuList, DailyReport, 
  WeeklyReport, MonthlyReport } = require('./src/index');
const routes = require('./src/routes/exerciseRoute');
const routes2 = require('./src/routes/routes');
const gptRouter = require('./src/routes/gpt/gptRoute');
const report = require('./src/routes/report');
const menuData = require('./menuData');
const loadExerciseData = require('./exerciseData');
const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  // origin: 'https://live-healthy-die-healthy.github.io', // 허용할 출처
}));

app.use(express.urlencoded({
  limit:"100mb",
  extended: true, // true로 변경
}));

app.use(express.json({   
  limit : "100mb"
}));

app.use('/', routes);
app.use('/', routes2);
app.use('/gpt', gptRouter);
app.use('/report', report);


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
      userMuscleMass: 30.5,
      userBmi: 23.6,
      userBodyFatPercentage: 15.1,
      userBmr: 1700,
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

  await loadExerciseData();

// MenuList 데이터 추가
await menuData();

// DietLog 데이터 추가 (7월 18일로 수정)
await DietLog.bulkCreate([
  {
    dietLogId: 1,
    dietDate: new Date('2024-07-19'),
    dietType: 'Breakfast',
    userId: '1234'
  },
  {
    dietLogId: 2,
    dietDate: new Date('2024-07-19'),
    dietType: 'Lunch',
    userId: '1234'
  },
]);
console.log('DietLog added');

// DietLogDetail 데이터 추가
await DietLogDetail.bulkCreate([
  {
    dietDetailLogId: 1,
    quantity: 100,
    dietLogId: 1,
    menuId: 1
  },
  {
    dietDetailLogId: 2,
    quantity: 100,
    dietLogId: 2,
    menuId: 2
  },
]);
console.log('DietLogDetail added');

// DailyReport 데이터 추가
await DailyReport.bulkCreate([
  {
    dailyReportId: 1,
    userId: '1234',
    totalCalories: 2000,
    totalTraining: 60,
    dietFeedback: 'Good',
    exerciseFeedback: 'Great',
    date: new Date('2024-07-01').toISOString().split('T')[0]
  },
  {
    dailyReportId: 2,
    userId: '1234',
    totalCalories: 1800,
    totalTraining: 45,
    dietFeedback: 'Needs improvement',
    exerciseFeedback: 'Average',
    date: new Date('2024-07-18').toISOString().split('T')[0]
  }
]);
console.log('DailyReport added');

// WeeklyReport 데이터 추가
await WeeklyReport.bulkCreate([
  {
    weeklyReportId: 1,
    userId: '1234',
    nextExercise: 'Run 5k',
    nextDiet: 'More vegetables',
    meanExercise: 60,
    meanCalories: 2000,
    dietFeedback: 'Keep up the good work',
    exerciseFeedback: 'Keep up the good work',
    date: new Date('2024-07-01')
  },
  {
    weeklyReportId: 2,
    userId: '1234',
    nextExercise: 'Run 5k',
    nextDiet: 'More vegetables',
    meanExercise: 45,
    meanCalories: 1800,
    dietFeedback: 'You can do better',
    exerciseFeedback: 'Keep up the good work',
    date: new Date('2024-07-08')
  }
]);
console.log('WeeklyReport added');

// MonthlyReport 데이터 추가
await MonthlyReport.bulkCreate([
  {
    monthlyReportId: 1,
    userId: '1234',
    nextExercise: 'Run 5k',
    nextDiet: 'More vegetables',
    date: new Date('2024-01-01'),
    meanTraining: 60,
    meanCalories: 2000,
    dietFeedback: 'Excellent',
    exerciseFeedback: 'Outstanding'
  },
  {
    monthlyReportId: 2,
    userId: '1234',
    nextExercise: 'Jog daily',
    nextDiet: 'Less sugar',
    date: new Date('2023-11-01'),
    meanTraining: 45,
    meanCalories: 2000,
    dietFeedback: 'Fair',
    exerciseFeedback: 'Satisfactory'
  }
]);
console.log('MonthlyReport added');

console.log('test data uploaded');
};



initializeApp();

