const express = require('express');
const { Sequelize, ExerciseList, AerobicExercise, AnaerobicExercise, ExerciseLog, User, exerciseScrap } = require('../index');

const router = express.Router();

// 모든 ExerciseList 정보 가져오기 (POST 요청으로 변경)
router.post('/exerciseList', async (req, res) => {
    try {
      const { userId, name } = req.body;  // 요청 본문에서 userId와 이름을 가져옵니다.
  
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
  
      // 해당 유저가 스크랩한 운동 목록 조회
      const userScraps = await exerciseScrap.findAll({
        where: { userId },
        attributes: ['exerciseId']
      });
  
      const scrapIds = userScraps.map(scrap => scrap.exerciseId);
  
      if (scrapIds.length === 0) {
        return res.json([]); // 스크랩된 운동이 없으면 빈 배열 반환
      }
  
      // 스크랩된 운동 아이디에 대한 조건 설정
      const whereClause = {
        exerciseId: { [Sequelize.Op.in]: scrapIds } // scrapIds 배열에 포함된 아이디들만 조회
      };
  
      if (name) {
        whereClause.exerciseName = { [Sequelize.Op.like]: `%${name}%` }; // 이름으로 검색할 조건 추가
      }
  
      // 스크랩된 운동 목록 조회
      const exercises = await ExerciseList.findAll({
        attributes: ['exerciseId', 'exerciseImage', 'exerciseName', 'exerciseType', 'exercisePart'],
        where: whereClause,
      });
  
      // 이미지 인코딩
      const exercisesWithBase64Images = exercises.map(exercise => {
        return {
          ...exercise.dataValues,
          exerciseImage: exercise.exerciseImage ? Buffer.from(exercise.exerciseImage).toString('base64') : null
        };
      });
  
      res.json(exercisesWithBase64Images);
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
    const newUserExercise = await exerciseScrap.create({
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