const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { kakaoAccessToken } = require('../controllers/loginController')
const { ExerciseList, AerobicExercise, AnaerobicExercise, ExerciseLog, User } = require('../index');
const { Op, Sequelize } = require('sequelize'); //이거 고침

console.log('Routes loaded');

// 사용자 존재 여부 확인
router.post('/checkUser', async (req, res) => {
    console.log("testCheckUser");
    const { userId } = req.body;
    console.log(userId);
    try {
      const user = await User.findOne({ where: { userId } });
      res.status(200).json({ isExist: !!user });
    } catch (error) {
      console.error('사용자 확인 오류:', error);
      res.status(500).json({ message: '사용자 확인 실패' });
    }
  });

  router.post('/auth/kakao/accesstoken', kakaoAccessToken);

  // 사용자 프로필 등록
  router.post('/profile', async (req, res) => {
    console.log('Received request on /profile');
    const connectedAt = new Date();
    const { userId, userEmail, userNickname, userBirth, userHeight, userWeight, userGender, userImage } = req.body;
    const username = userNickname;
    console.log("Gender: ", userGender);
    try {
      // 새로운 사용자 프로필 등록
      const newUser = await User.create({
        userId,
        userEmail,
        username,
        userBirth,
        userHeight,
        userWeight,
        userGender,
        userImage,
        connectedAt
      });
      res.status(200).json(newUser);
    } catch (error) {
      console.error('프로필 등록 오류:', error);
      res.status(500).json({ message: '프로필 등록 실패' });
    }
  });

// 마이페이지
router.get('/mypage', async (req, res) => {
  // 사용자 정보 조회 및 반환
  res.send('마이페이지 정보');
});

router.post('/mypage', async (req, res) => {
  // 사용자 정보 업데이트
  res.send('마이페이지 업데이트');
});

// 홈 페이지
router.get('/exerciseCalender', (req, res) => {
  res.send('운동 캘린더');
});

router.get('/exerciseList', (req, res) => {
  res.send('운동 목록');
});

router.get('/exerciseLog', (req, res) => {
  res.send('운동 기록 조회');
});



//승준
router.post('/exerciseLog', async (req, res) => {
  const { userId, exerciseDate } = req.body;

  console.log('exerciseDate', exerciseDate);

  try {
      const date = new Date(exerciseDate);

      const exerciseLogs = await ExerciseLog.findAll({
          where: {
              userId: userId,
              exerciseDate: {
                  [Op.eq]: date
              }
          }
      });

      if (exerciseLogs.length === 0) {
          return res.status(404).json({ message: 'No exercise logs found' });
      }

      const responses = await Promise.all(exerciseLogs.map(async (log) => {
          if (log.exerciseType === 'Aerobic') {
              const aerobic = await AerobicExercise.findOne({
                  where: { exerciseId: log.exerciseId }
              });
              return {
                  exerciseLogId: log.exerciseLogId,
                  exerciseDate: log.exerciseDate,
                  exerciseType: log.exerciseType,
                  distance: aerobic.distance,
                  exerciseTime: aerobic.exerciseTime
              };
          } else if (log.exerciseType === 'Anaerobic') {
              const anaerobic = await AnaerobicExercise.findOne({
                  where: { exerciseId: log.exerciseId }
              });
              return {
                  exerciseLogId: log.exerciseLogId,
                  exerciseDate: log.exerciseDate,
                  exerciseType: log.exerciseType,
                  set: anaerobic.set,
                  weight: anaerobic.weight,
                  repetition: anaerobic.repetition,
                  exerciseTime: anaerobic.exerciseTime
              };
          } else {
              return log; // 다른 유형의 운동 로그가 있을 경우 기본 로그 반환
          }
      }));

      res.json(responses);
  } catch (error) {
      console.error('Error retrieving exercise logs:', error); // 로그에 오류 정보를 출력
      res.status(500).json({ message: 'Error retrieving exercise logs', error: error.toString() });
  }
});

router.get('/:userId/:exerciseDate', async (req, res) => {
  const { userId, exerciseDate } = req.params;

  console.log('exerciseDate', exerciseDate);

  try {
      const date = new Date(exerciseDate);

      const exerciseLogs = await ExerciseLog.findAll({
          where: {
              userId: userId,
              exerciseDate: {
                  [Op.eq]: date
              }
          }
      });

      if (exerciseLogs.length === 0) {
          return res.status(404).json({ message: 'No exercise logs found' });
      }

      const responses = await Promise.all(exerciseLogs.map(async (log) => {
          if (log.exerciseType === 'Aerobic') {
              const aerobic = await AerobicExercise.findOne({
                  where: { exerciseId: log.exerciseId }
              });
              return {
                  exerciseLogId: log.exerciseLogId,
                  exerciseDate: log.exerciseDate,
                  exerciseType: log.exerciseType,
                  distance: aerobic.distance,
                  exerciseTime: aerobic.exerciseTime
              };
          } else if (log.exerciseType === 'Anaerobic') {
              const anaerobic = await AnaerobicExercise.findOne({
                  where: { exerciseId: log.exerciseId }
              });
              return {
                  exerciseLogId: log.exerciseLogId,
                  exerciseDate: log.exerciseDate,
                  exerciseType: log.exerciseType,
                  set: anaerobic.set,
                  weight: anaerobic.weight,
                  repetition: anaerobic.repetition,
                  exerciseTime: anaerobic.exerciseTime
              };
          } else {
              return log; // 다른 유형의 운동 로그가 있을 경우 기본 로그 반환
          }
      }));

      res.json(responses);
  } catch (error) {
      console.error('Error retrieving exercise logs:', error); // 로그에 오류 정보를 출력
      res.status(500).json({ message: 'Error retrieving exercise logs', error: error.toString() });
  }
});

// PUT 요청: 특정 운동 기록 수정
router.put('/:exerciseLogId', async (req, res) => {
  const { exerciseLogId } = req.params;
  const { exerciseType, exerciseDate, ...details } = req.body; // 업데이트할 세부 사항을 body에서 가져옴

  try {
      const log = await ExerciseLog.findByPk(exerciseLogId);

      if (!log) {
          return res.status(404).json({ message: 'Exercise log not found' });
      }

      if (exerciseType === 'Aerobic') {
          await AerobicExercise.update(details, { where: { exerciseId: log.exerciseId } });
      } else if (exerciseType === 'Anaerobic') {
          await AnaerobicExercise.update(details, { where: { exerciseId: log.exerciseId } });
      }

      await log.update({ exerciseType, exerciseDate });
      res.json({ message: 'Exercise log updated successfully' });
  } catch (error) {
      console.error('Error updating exercise log:', error);
      res.status(500).json({ message: 'Error updating exercise log', error: error.toString() });
  }
});

// DELETE 요청: 특정 운동 기록 삭제
router.delete('/:exerciseLogId', async (req, res) => {
  const { exerciseLogId } = req.params;

  try {
      const log = await ExerciseLog.findByPk(exerciseLogId);

      if (!log) {
          return res.status(404).json({ message: 'Exercise log not found' });
      }

      if (log.exerciseType === 'Aerobic') {
          await AerobicExercise.destroy({ where: { exerciseId: log.exerciseId } });
      } else if (log.exerciseType === 'Anaerobic') {
          await AnaerobicExercise.destroy({ where: { exerciseId: log.exerciseId } });
      }

      await log.destroy();
      res.json({ message: 'Exercise log deleted successfully' });
  } catch (error) {
      console.error('Error deleting exercise log:', error);
      res.status(500).json({ message: 'Error deleting exercise log', error: error.toString() });
  }
});

// GET 요청: 특정 사용자의 특정 월의 운동 기록 조회
router.post('/exerciseCalender', async (req, res) => {
  const { userId, month } = req.body;

  console.log('Received userId:', userId); // 로그 추가
  console.log('Received month:', month); // 로그 추가

  try {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      const exerciseLogs = await ExerciseLog.findAll({
          where: {
              userId: userId,
              exerciseDate: {
                  [Op.between]: [startDate, endDate]
              }
          }
      });

      if (exerciseLogs.length === 0) {
          return res.status(404).json({ message: 'No exercise logs found' });
      }

      const responses = await Promise.all(exerciseLogs.map(async (log) => {
          if (log.exerciseType === 'Aerobic') {
              const aerobic = await AerobicExercise.findOne({
                  where: { exerciseId: log.exerciseId }
              });
              return {
                  exerciseName: log.exerciseName,
                  exerciseDate: log.exerciseDate,
                  exerciseType: log.exerciseType,
                  distance: aerobic.distance,
                  exerciseTime: aerobic.exerciseTime
              };
          } else if (log.exerciseType === 'Anaerobic') {
              const anaerobic = await AnaerobicExercise.findOne({
                  where: { exerciseId: log.exerciseId }
              });
              return {
                  exerciseName: log.exerciseName,
                  exerciseDate: log.exerciseDate,
                  exerciseType: log.exerciseType,
                  set: anaerobic.set,
                  weight: anaerobic.weight,
                  repetition: anaerobic.repetition
              };
          } else {
              return log; // 다른 유형의 운동 로그가 있을 경우 기본 로그 반환
          }
      }));

      res.json(responses);
  } catch (error) {
      console.error('Error retrieving exercise logs:', error); // 로그에 오류 정보를 출력
      res.status(500).json({ message: 'Error retrieving exercise logs', error: error.toString() });
  }
});

router.get('/exerciseCalendar', async (req, res) => {
  const { userId, month } = req.query;

  console.log('Received userId:', userId);
  console.log('Received month:', month);

  try {
      if (!userId || !month) {
          return res.status(400).json({ message: 'userId and month are required' });
      }

      const exerciseLogs = await ExerciseLog.findAll({
          where: {
              userId: userId,
              exerciseDate: {
                  [Op.startsWith]: month
              }
          }
      });
      console.log(exerciseLogs);

      console.log('Found exercise logs:', exerciseLogs);

      if (exerciseLogs.length === 0) {
          return res.status(404).json({ message: 'No exercise logs found' });
      }

      const responses = await Promise.all(exerciseLogs.map(async (log) => {
          if (log.exerciseType === 'Aerobic') {
              const aerobic = await AerobicExercise.findOne({
                  where: { exerciseId: log.exerciseId }
              });
              return {
                  exerciseLogId: log.exerciseLogId,
                  exerciseDate: log.exerciseDate,
                  exerciseType: log.exerciseType,
                  distance: aerobic.distance,
                  exerciseTime: aerobic.exerciseTime
              };
          } else if (log.exerciseType === 'Anaerobic') {
              const anaerobic = await AnaerobicExercise.findOne({
                  where: { exerciseId: log.exerciseId }
              });
              return {
                  exerciseLogId: log.exerciseLogId,
                  exerciseDate: log.exerciseDate,
                  exerciseType: log.exerciseType,
                  set: anaerobic.set,
                  weight: anaerobic.weight,
                  repetition: anaerobic.repetition,
                  exerciseTime: anaerobic.exerciseTime
              };
          } else {
              return log;
          }
      }));

      res.json(responses);
  } catch (error) {
      console.error('Error retrieving exercise logs:', error);
      res.status(500).json({ message: 'Error retrieving exercise logs', error: error.toString() });
  }
});



module.exports = router;