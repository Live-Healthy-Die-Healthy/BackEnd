const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User } = require('../index');
const { kakaoAccessToken } = require('../controllers/loginController')

console.log('Routes loaded');

// 사용자 존재 여부 확인
router.post('/checkUser', async (req, res) => {
    console.log("testCheckUser");
    const { userId } = req.body;
    console.log(userId);
    try {
      const user = await User.findOne({ where: { userId } });
      res.status(200).json({ isExist: !!user });
    } catch (error) {
      console.error('사용자 확인 오류:', error);
      res.status(500).json({ message: '사용자 확인 실패' });
    }
  });

  router.post('/auth/kakao/accesstoken', kakaoAccessToken);

  // 사용자 프로필 등록
  router.post('/profile', async (req, res) => {
    console.log('Received request on /profile');
    const connectedAt = new Date();
    const { userId, userEmail, userNickname, userBirth, userHeight, userWeight, userGender, userImage } = req.body;
    const username = userNickname;
    console.log("Gender: ", userGender);
    try {
      // 새로운 사용자 프로필 등록
      const newUser = await User.create({
        userId,
        userEmail,
        username,
        userBirth,
        userHeight,
        userWeight,
        userGender,
        userImage,
        connectedAt
      });
      res.status(200).json(newUser);
    } catch (error) {
      console.error('프로필 등록 오류:', error);
      res.status(500).json({ message: '프로필 등록 실패' });
    }
  });

// 마이페이지
router.get('/mypage', async (req, res) => {
  // 사용자 정보 조회 및 반환
  res.send('마이페이지 정보');
});

router.post('/mypage', async (req, res) => {
  // 사용자 정보 업데이트
  res.send('마이페이지 업데이트');
});

// 홈 페이지
router.get('/exerciseCalender', (req, res) => {
  res.send('운동 캘린더');
});

router.get('/exerciseList', (req, res) => {
  res.send('운동 목록');
});

router.get('/exerciseLog', (req, res) => {
  res.send('운동 기록 조회');
});

module.exports = router;