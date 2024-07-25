const express = require('express');
const router = express.Router();
const { User, ExerciseLog, DietLogDetail, DietLog, DailyReport, MonthlyReport, MenuList, Sequelize, WeeklyReport } = require('../index');
const { Op } = Sequelize; // Op를 Sequelize에서 가져오기

router.post('/daily', async (req, res) => {
  const { userId, date } = req.body;

  try {
    // 입력된 날짜의 시작과 끝을 정의
    const startDate = new Date(date);
    if (isNaN(startDate)) {
      throw new Error('Invalid date format');
    }
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    if (isNaN(endDate)) {
      throw new Error('Invalid date format');
    }
    endDate.setHours(23, 59, 59, 999);

    // 해당 날짜에 이미 DailyReport가 있는지 확인
    const existingReport = await DailyReport.findOne({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    if (existingReport) {
      console.log("존재!");
      // 이미 존재하는 DailyReport가 있으면 해당 데이터를 반환
      return res.status(200).json(existingReport);
    }

    // 사용자의 해당 날짜의 다이어트 로그 가져오기
    console.log("생성");
    const dietLogs = await DietLog.findAll({
      where: {
        userId: userId,
        dietDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: DietLogDetail,
        as: 'details',
        include: [{
          model: MenuList,
          as: 'menu'
        }]
      }]
    });

    console.log("Diet Logs: ", dietLogs);

    // 해당 날짜에 섭취한 총 칼로리 계산
    let totalCalories = 0;
    dietLogs.forEach(dietLog => {
      dietLog.details.forEach(detail => {
        const calories = detail.quantity * detail.menu.menuCalorie;
        totalCalories += calories;
      });
    });

    console.log("Total Calories: ", totalCalories);

    // 사용자의 해당 날짜의 운동 로그 가져오기
    const exerciseLogs = await ExerciseLog.findAll({
      where: {
        userId: userId,
        exerciseDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    console.log("Exercise Logs: ", exerciseLogs);

    // 총 운동 시간 계산
    let totalTraining = 0;
    exerciseLogs.forEach(log => {
      totalTraining += log.exerciseTime;
    });

    console.log("Total Training: ", totalTraining);

    // DailyReport 생성
    const newDailyReport = await DailyReport.create({
      userId,
      date: startDate, // 저장할 때는 시작 날짜만 사용
      totalCalories,
      totalTraining,
      dietFeedback: 'test',  // 임시 피드백
      exerciseFeedback: 'test',  // 임시 피드백
    });

    res.status(201).json(newDailyReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 주간 레포트 생성
router.post('/weekly', async (req, res) => {
  const { userId, date } = req.body;

  try {
    // 입력된 날짜를 기준으로 주의 시작(월요일)과 끝(일요일) 설정
    const inputDate = new Date(date);
    if (isNaN(inputDate)) {
      throw new Error('Invalid date format');
    }

    // 주의 시작(월요일) 계산
    const startDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate()));
    const day = startDate.getUTCDay();
    const diff = startDate.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    startDate.setUTCDate(diff);
    startDate.setUTCHours(0, 0, 0, 0);

    // 주의 끝(일요일) 계산
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 6);
    endDate.setUTCHours(23, 59, 59, 999);

    console.log("Start Date: ", startDate);
    console.log("End Date: ", endDate);

    // 해당 날짜에 이미 WeeklyReport가 있는지 확인
    const existingReport = await WeeklyReport.findOne({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    if (existingReport) {
      console.log("존재!");
      // 이미 존재하는 WeeklyReport가 있으면 해당 데이터를 반환
      existingReport.date = startDate;  // 수정된 부분: 응답에 달의 첫 날을 포함하도록 설정
      return res.status(200).json(existingReport);
    }

    // 사용자의 해당 주의 DailyReport 찾기
    const dailyReports = await DailyReport.findAll({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    console.log("Daily Reports: ", dailyReports);

    // 일별 총 칼로리를 더해 평균 구함
    let totalCalories = 0;
    let totalTraining = 0;
    dailyReports.forEach(report => {
      totalCalories += report.totalCalories;
      totalTraining += report.totalTraining;
    });

    const meanCalories = (totalCalories / 7).toFixed(2);
    const meanTraining = (totalTraining / 7).toFixed(2);

    // WeeklyReport 생성
    const newWeeklyReport = await WeeklyReport.create({
      userId,
      date: startDate, // 주의 시작 날짜만 사용
      nextExercise: '운동하세요',
      nextDiet: '먹으세요',
      dietFeedback: '잘하셨네요',
      exerciseFeedback: '좀 치네요',
      meanCalories,
      meanTraining,
    });

    // 응답에서 주의 첫 날인 월요일 날짜를 포함
    res.status(201).json({
      weeklyReportId: newWeeklyReport.weeklyReportId,
      userId: newWeeklyReport.userId,
      date: startDate,
      nextExercise: newWeeklyReport.nextExercise,
      nextDiet: newWeeklyReport.nextDiet,
      dietFeedback: newWeeklyReport.dietFeedback,
      exerciseFeedback: newWeeklyReport.exerciseFeedback,
      meanCalories: newWeeklyReport.meanCalories,
      meanTraining: newWeeklyReport.meanTraining,
    });
  } catch (error) {
    console.error('Error retrieving weekly report:', error);
    res.status(500).json({ message: 'Error retrieving weekly report', error: error.message });
  }
});

// 월간 레포트 생성
router.post('/monthly', async (req, res) => {
  const { userId, date } = req.body;

  try {
    // 입력된 날짜를 기준으로 달의 시작과 끝 설정
    const inputDate = new Date(date);
    if (isNaN(inputDate)) {
      throw new Error('Invalid date format');
    }

    // 달의 시작 계산
    const startDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), 1));
    startDate.setUTCHours(0, 0, 0, 0);

    // 달의 끝 계산
    const endDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth() + 1, 0));
    endDate.setUTCHours(23, 59, 59, 999);

    console.log("Start Date: ", startDate);
    console.log("End Date: ", endDate);

    const existingReport = await MonthlyReport.findOne({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    if (existingReport) {
      console.log("존재!");
      // 이미 존재하는 MonthlyReport가 있으면 해당 데이터를 반환
      existingReport.date = startDate;  // 수정된 부분: 응답에 달의 첫 날을 포함하도록 설정
      return res.status(200).json(existingReport);
    }

    // 사용자의 해당 달의 DailyReport 찾기
    const dailyReports = await DailyReport.findAll({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    console.log("Daily Reports: ", dailyReports);

    // 일별 총 칼로리를 더해 평균 구함
    let totalCalories = 0;
    let totalTraining = 0;
    dailyReports.forEach(report => {
      totalCalories += report.totalCalories;
      totalTraining += report.totalTraining;
    });

    const meanCalories = (totalCalories / dailyReports.length).toFixed(2);
    const meanTraining = (totalTraining / dailyReports.length).toFixed(2);

    // MonthlyReport 생성
    const newMonthlyReport = await MonthlyReport.create({
      userId,
      date: startDate, // 달의 시작 날짜만 사용
      nextExercise: '운동하세요',
      nextDiet: '먹으세요',
      dietFeedback: '잘하셨네요',
      exerciseFeedback: '좀 치네요',
      meanCalories,
      meanTraining,
    });

    // 응답에서 달의 첫 날인 1일 날짜를 포함
    res.status(201).json({
      monthlyReportId: newMonthlyReport.monthlyReportId,
      userId: newMonthlyReport.userId,
      date: startDate,
      nextExercise: newMonthlyReport.nextExercise,
      nextDiet: newMonthlyReport.nextDiet,
      dietFeedback: newMonthlyReport.dietFeedback,
      exerciseFeedback: newMonthlyReport.exerciseFeedback,
      meanCalories: newMonthlyReport.meanCalories,
      meanTraining: newMonthlyReport.meanTraining,
    });
  } catch (error) {
    console.error('Error retrieving monthly report:', error);
    res.status(500).json({ message: 'Error retrieving monthly report', error: error.message });
  }
});

router.post('/dailyReportDate', async (req, res) => {
  const { userId, month } = req.body;
  
  console.log('userId:', userId);
  console.log('month:', month);
  
  try {
    const startDate = new Date(month);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    console.log('startDate:', startDate);
    console.log('endDate:', endDate);

    const dailyReports = await DailyReport.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['date'],
      order: [['date', 'ASC']]
    });

    const reportDates = dailyReports.map(report => report.date.toISOString().split('T')[0]);

    console.log('Report Dates:', reportDates);

    res.status(200).json({ date: reportDates });
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; 
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

router.post('/weeklyReportDate', async (req, res) => {
  const { userId, month } = req.body;

  console.log('userId:', userId);
  console.log('month:', month);

  try {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    console.log('startDate:', startDate);
    console.log('endDate:', endDate);

    const dailyReports = await DailyReport.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['date'],
      order: [['date', 'ASC']]
    });

    const weeklyReportDates = dailyReports.reduce((acc, report) => {
      const date = new Date(report.date);
      const week = getWeekNumber(date);
      const weekKey = `${date.getUTCFullYear()}-W${week < 10 ? '0' : ''}${week}`;

      if (!acc[weekKey]) {
        acc[weekKey] = report.date.toISOString().split('T')[0];
      }
      return acc;
    }, {});

    const reportDates = Object.values(weeklyReportDates);

    console.log('Report Dates:', reportDates);

    res.status(200).json({ date: reportDates });
  } catch (error) {
    console.error('Error fetching weekly reports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/monthlyReportDate', async (req, res) => {
  const { userId, year } = req.body;
  
  console.log('userId:', userId);
  console.log('year:', year);
  
  try {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    console.log('startDate:', startDate);
    console.log('endDate:', endDate);

    const dailyReports = await DailyReport.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['date'],
      order: [['date', 'ASC']]
    });

    const monthlyReportDates = dailyReports.reduce((acc, report) => {
      const month = report.date.toISOString().split('T')[0].substring(0, 7); // Extract 'YYYY-MM'
      if (!acc.includes(month)) {
        acc.push(month);
      }
      return acc;
    }, []);

    console.log('Monthly Report Dates:', monthlyReportDates);

    res.status(200).json({ dates: monthlyReportDates });
  } catch (error) {
    console.error('Error fetching monthly reports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
