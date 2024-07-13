const express = require('express');
const router = express.Router();
const ExerciseLog = require('../models/exerciseLog');

// GET 요청: 특정 사용자의 운동 기록 조회
router.get('/:userId/:exerciseDate', async (req, res) => {
    const { userId, exerciseDate } = req.params;
    
    try {
        const exerciseLogs = await ExerciseLog.findAll({
            where: {
                userId: userId,
                exerciseDate: exerciseDate
            }
        });

        if (exerciseLogs.length === 0) {
            return res.status(404).json({ message: 'No exercise logs found' });
        }

        res.json(exerciseLogs);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving exercise logs', error });
    }
});
module.exports = router;