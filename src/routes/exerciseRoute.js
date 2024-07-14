const express = require('express');
const { Sequelize, ExerciseList, AerobicExercise, AnaerobicExercise, ExerciseLog, User } = require('../index');

const router = express.Router();

// 모든 ExerciseList 정보만 가져오기
router.get('/exerciseList', async (req, res) => {
  try {
    const { name } = req.query;  // 쿼리 파라미터에서 이름을 가져옵니다.
    const whereClause = name ? { exerciseName: { [Sequelize.Op.like]: `%${name}%` } } : {}; // 이름으로 검색할 조건

    const exercises = await ExerciseList.findAll({
      attributes: ['exerciseId', 'exerciseImage', 'exerciseName', 'exerciseType', 'exercisePart'],
      where: whereClause,  // 검색 조건을 여기에 추가합니다.
    });

    res.json(exercises);
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
    let { userId, exerciseId, exerciseType, distance, exerciseTime, set, weight, repetition } = req.body;

    // 요청 데이터 로그
    console.log('Request data:', req.body);

    // 유효성 검증
    if (!exerciseId || !exerciseType) {
      return res.status(400).json({ error: 'exerciseId and exerciseType are required fields' });
    }

    // `userId`가 빈 문자열이면 기본값으로 설정
    if (!userId) {
      userId = 'user1';  // 예시로 기본값을 'user1'로 설정
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
      console.error(`Exercise not found for exerciseId: ${exerciseId}`);
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // 운동 기록 생성
    const newLog = await ExerciseLog.create({
      exerciseId,
      userId,
      exerciseType,
      exerciseDate: new Date(),
      distance: exerciseType === 'Aerobic' ? distance : null,
      exerciseTime,
      set: exerciseType === 'Anaerobic' ? set : null,
      weight: exerciseType === 'Anaerobic' ? weight : null,
      repetition: exerciseType === 'Anaerobic' ? repetition : null,
    });

    res.status(201).json({ message: "운동 기록이 추가 되었습니다.", log: newLog });
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

module.exports = router;