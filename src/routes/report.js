const express = require('express');
const axios = require('axios');

const report = express.Router();
const { ExerciseList, AerobicExercise, AnaerobicExercise, ExerciseLog, User, DietLog, DietLogDetail, MenuList } = require('../index');
const { Op, Sequelize } = require('sequelize'); 