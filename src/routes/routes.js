const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { ExerciseLog, AerobicExercise, AnaerobicExercise, sequelize } = require('../index');

// GET 요청: 특정 사용자의 운동 기록 조회
router.get('/:userId/:exerciseDate', async (req, res) => {
    const { userId, exerciseDate } = req.params;
    
    try {
        const exerciseLogs = await ExerciseLog.findAll({
            where: {
                userId: userId,
                [Op.and]: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('exerciseDate')), exerciseDate)
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

module.exports = router;