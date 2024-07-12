const express = require('express');
const router = express.Router();
const { ExerciseList } = require('../models/exerciseList');
const { Op } = require('sequelize');  // Sequelize의 연산자 가져오기

// GET 운동 목록 가져오기
router.get('/', async (req, res) => {
    try {
      const { search } = req.query;
      const whereClause = search ? { exerciseName: { [Op.like]: `%${search}%` } } : {};
      const exercises = await ExerciseList.findAll({ where: whereClause });
  
      if (exercises.length === 0) {
        res.status(404).json({ message: 'No exercises found' });
      } else {
        res.json(exercises);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;
