const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { parseISO, isValid } = require('date-fns');
const { User, DietLog, DietLogDetail, MenuList, Analysis } = require('../../index');
const { Op, Sequelize } = require('sequelize'); 
const { v4: uuidv4 } = require('uuid');

const bodyParser = require('body-parser');

// 라우터 사용 시에도 동일하게 설정
router.use(express.urlencoded({    
  limit:"50mb",
  extended: true, // true로 변경
}));

router.use(express.json({   
  limit : "50mb"
}));





module.exports = router;