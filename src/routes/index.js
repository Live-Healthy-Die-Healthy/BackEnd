const express = require('express');
const router = express.Router();
const routes = require('./routes'); // 기존 routes 파일
const exerciseRoute = require('./exerciseRoute'); // 기존 exerciseRoute 파일

// routes 파일에서 가져온 라우트를 메인 라우터에 추가
router.use('/', routes);

// exerciseRoute 파일에서 가져온 라우트를 메인 라우터에 추가
router.use('/', exerciseRoute);

module.exports = router;
