const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { ExerciseLog, AerobicExercise, AnaerobicExercise, sequelize } = require('../index');

router.use(express.json());

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