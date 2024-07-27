const express = require('express');
const { Sequelize, ExerciseList, AerobicExercise, AnaerobicExercise, ExerciseLog, User, ExerciseScrap } = require('../index');

const router = express.Router();

// 모든 ExerciseList 정보 가져오기 (POST 요청으로 변경)
router.post('/exerciseList', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("userId : ", userId);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 해당 유저가 스크랩한 운동 목록 조회
    const userScraps = await ExerciseScrap.findAll({
      where: { userId },
      attributes: ['exerciseId']
    });

    const scrapIds = userScraps.map(scrap => scrap.exerciseId);

    console.log("scrapIds : ", scrapIds);

    const exercises = await ExerciseList.findAll({
      attributes: ['exerciseId', 'exerciseImage', 'exerciseName', 'exerciseType', 'exercisePart'],
    });
    console.log("exercises: ", exercises);

    const exercisesWithBase64Images = exercises.map(exercise => {
      return {
        ...exercise.dataValues,
        exerciseImage: exercise.exerciseImage ? Buffer.from(exercise.exerciseImage).toString('base64') : null,
      };
    });
    const exercise = {
      exercisesWithBase64Images,
      scrapIds
    }

    res.json(exercise);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 특정 ExerciseList의 상세 정보 가져오기
router.get('/exerciseList/:id', async (req, res) => {
  try {
    const exercise = await ExerciseList.findByPk(req.params.id, {
      include: [
        {
          model: AerobicExercise,
          as: 'aerobicExercise',
          attributes: ['distance', 'exerciseTime'],
        },
        {
          model: AnaerobicExercise,
          as: 'anaerobicExercise',
          attributes: ['set', 'weight', 'repetition', 'exerciseTime'],
        },
      ],
    });

    if (exercise) {
      res.json(exercise);
    } else {
      res.status(404).json({ error: 'Exercise not found' });
    }
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 운동 기록 등록하기 (경로: /addExerciseLog)
router.post('/addExerciseLog', async (req, res) => {
  try {
    let { userId, exerciseId, exerciseType, distance, exerciseTime, set, weight, repetition, exerciseDate } = req.body;

    // 요청 데이터 로그
    console.log('Request data:', req.body);

    // 유효성 검증
    if (!exerciseId || !exerciseType) {
      return res.status(400).json({ error: 'exerciseId and exerciseType are required fields' });
    }

    // `userId`가 빈 문자열이면 기본값으로 설정
    if (!userId) {
      userId = 'user';  // 예시로 기본값을 'user1'로 설정
    }

    // `userId`가 유효한지 확인
    const userExists = await User.findOne({ where: { userId } });
    if (!userExists) {
      console.error(`User not found for userId: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // 운동 정보 확인
    const exercise = await ExerciseList.findByPk(exerciseId);
    if (!exercise) {
      console.error(`Exercise not found for exerciseLogId: ${exerciseId}`);
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // 운동 기록 생성
    const newLog = await ExerciseLog.create({
      exerciseId,
      userId,
      exerciseType,
      exerciseDate,
      distance: exerciseType === 'Aerobic' ? distance : null,
      exerciseTime,
      set: exerciseType === 'Anaerobic' ? set : null,
      weight: exerciseType === 'Anaerobic' ? weight : null,
      repetition: exerciseType === 'Anaerobic' ? repetition : null,
    });

    const exerciseLogId = newLog.exerciseLogId;

    // 운동 유형에 따라 AerobicExercise 또는 AnaerobicExercise 생성
    if (exerciseType === 'AerobicExercise') {
      const newAerobic = await AerobicExercise.create({
        exerciseLogId, // 생성된 exerciseLogId 사용
        distance,
        exerciseTime
      });
    }  else if (exerciseType === 'AnaerobicExercise') {
      const newAnaerobic = await AnaerobicExercise.create({
        exerciseLogId, // 생성된 exerciseLogId 사용
        set,
        weight: JSON.stringify(weight), // 배열을 JSON 문자열로 변환하여 저장
        repetition: JSON.stringify(repetition), // 배열을 JSON 문자열로 변환하여 저장
        exerciseTime
      });
    }

    res.status(200).json({ message: "운동 기록이 추가 되었습니다.", log: newLog });
  } catch (error) {
    // 오류의 세부 사항 기록
    console.error('Error creating exercise record:', {
      message: error.message,
      stack: error.stack,
      errors: error.errors ? error.errors.map(e => e.message) : []
    });

    // 클라이언트에 반환할 오류 메시지
    res.status(500).json({
      error: "운동 기록 등록에 실패하였습니다.",
      details: {
        message: error.message,
        stack: error.stack,
        errors: error.errors ? error.errors.map(e => e.message) : []
      }
    });
  }
});

router.post('/exerciseScrap', async (req, res) => {
  const { userId, exerciseId } = req.body;

  if (!userId || !exerciseId) {
    return res.status(400).json({ error: 'userId and exerciseId are required' });
  }

  try {
    const newUserExercise = await ExerciseScrap.create({
      userId,
      exerciseId
    });

    res.status(201).json(newUserExercise);
  } catch (error) {
    console.error('Error adding UserExercise:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;