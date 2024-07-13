const express = require('express');
const { ExerciseList, AerobicExercise, AnaerobicExercise, ExerciseLog } = require('../index');

const router = express.Router();

// 모든 ExerciseList 정보만 가져오기
router.get('/', async (req, res) => {
  try {
    const exercises = await ExerciseList.findAll({
      attributes: ['exerciseId', 'exerciseName', 'exerciseType', 'exercisePart']
    });
    res.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 특정 ExerciseList의 상세 정보 가져오기
router.get('/:id', async (req, res) => {
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

// routes/exerciseList.js

router.post('/:id/record', async (req, res) => {
  try {
    const { userId, exerciseType, distance, exerciseTime, set, weight, repetition } = req.body;
    const exerciseId = req.params.id;

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
      distance: exerciseType === 'aerobic' ? distance : null, // 유산소 운동만 distance 사용
      exerciseTime,
      set: exerciseType === 'anaerobic' ? set : null, // 무산소 운동만 set 사용
      weight: exerciseType === 'anaerobic' ? weight : null, // 무산소 운동만 weight 사용
      repetition: exerciseType === 'anaerobic' ? repetition : null, // 무산소 운동만 repetition 사용
    });

    res.status(201).json(newLog);
  } catch (error) {
    console.error('Error creating exercise record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
