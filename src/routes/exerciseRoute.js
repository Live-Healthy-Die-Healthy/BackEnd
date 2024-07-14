const express = require('express');
const { ExerciseList, AerobicExercise, AnaerobicExercise, ExerciseLog } = require('../index');

const router = express.Router();

// 모든 ExerciseList 정보만 가져오기
router.get('/exerciseList', async (req, res) => {
  try {
    const exercises = await ExerciseList.findAll({
      attributes: ['exerciseId', 'exerciseImage', 'exerciseName', 'exerciseType', 'exercisePart']
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

// 운동 기록 등록하기 (경로 변경: /addExerciseLog)
router.post('/addExerciseLog', async (req, res) => {
  try {
    const { userId, exerciseId, exerciseType, distance, exerciseTime, set, weight, repetition } = req.body;

    // 운동 정보 확인
    const exercise = await ExerciseList.findByPk(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // 운동 기록 생성
    const newLog = await ExerciseLog.create({
      exerciseId,
      userId,
      exerciseType,
      exerciseDate: new Date(),
      distance: exerciseType === 'aerobicExercise' ? distance : null, // 유산소 운동만 distance 사용
      exerciseTime, //둘다 사용
      set: exerciseType === 'anaerobicExercise' ? set : null, // 무산소 운동만 set 사용
      weight: exerciseType === 'anaerobicExercise' ? weight : null, // 무산소 운동만 weight 사용
      repetition: exerciseType === 'anaerobicExercise' ? repetition : null, // 무산소 운동만 repetition 사용
    });

    res.status(201).json({ message: "운동 기록이 추가 되었습니다.", log: newLog });
  } catch (error) {
    console.error('Error creating exercise record:', error);
    res.status(500).json({ error: "운동 기록 등록에 실패하였습니다." });
  }
});

module.exports = router;
