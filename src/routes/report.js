const express = require('express');
const router = express.Router();
const { User, ExerciseLog, DietLogDetail, DietLog, DailyReport, MenuList, Sequelize } = require('../index');

router.post('/daily', async (req, res) => {
  const { userId, date } = req.body;
  const formattedDate = new Date(date).toISOString().split('T')[0];  // 날짜 포맷팅

  console.log("userId: ", userId);
  console.log("date: ", date);

  try {
    // 해당 날짜에 이미 DailyReport가 있는지 확인
    const existingReport = await DailyReport.findOne({
      where: {
        userId: userId,
        date: formattedDate,
      }
    });

    if (existingReport) {
      console.log("존재!");
      // 이미 존재하는 DailyReport가 있으면 해당 데이터를 반환
      return res.status(200).json(existingReport);
    }

    // 사용자의 해당 날짜의 다이어트 로그 가져오기
    console.log("생성");
    const dietLogs = await DietLogDetail.findAll({
      include: {
        model: DietLog,
        as: 'dietLog',  // 관계 정의 시 사용한 별칭
        where: {
          userId: userId,
          dietDate: formattedDate,
        }
      }
    });

    // 해당 날짜에 섭취한 총 칼로리 계산
    let totalCalories = 0;
    for (const log of dietLogs) {
      const menu = await MenuList.findByPk(log.menuId);
      totalCalories += log.quantity * menu.menuCalorie;
    }

    // 사용자의 해당 날짜의 운동 로그 가져오기
    const exerciseLogs = await ExerciseLog.findAll({
      where: {
        userId: userId,
        exerciseDate: formattedDate,
      }
    });

    // 총 운동 시간 계산
    let totalTraining = 0;
    exerciseLogs.forEach(log => {
      totalTraining += log.exerciseTime;
    });

    // DailyReport 생성
    const newDailyReport = await DailyReport.create({
      userId,
      date: formattedDate,
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

module.exports = router;
