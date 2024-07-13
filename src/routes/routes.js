const express = require('express');
const router = express.Router();
const { User } = require('../index');

// 로그인 페이지
router.post('/login', async (req, res) => {
  // 카카오 로그인 API를 사용한 인증 처리
  // 토큰을 받아와서 사용자 정보를 데이터베이스에 저장하거나 조회
  res.send('로그인 성공');
});

// 사용자 존재 여부 확인
router.post('/checkUser', async (req, res) => {
    const { userId } = req.body;
    try {
      const user = await User.findOne({ where: { userId } });
      res.status(200).json({ isExist: !!user });
    } catch (error) {
      console.error('사용자 확인 오류:', error);
      res.status(500).json({ message: '사용자 확인 실패' });
    }
  });

  router.post('/auth/kakao/accesstoken', async (req, res) => {
    const { code } = req.body;
    try {
      const response = await axios.post('https://kauth.kakao.com/oauth/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: 'YOUR_KAKAO_REST_API_KEY', // 환경 변수 또는 설정 파일에서 가져오기
          redirect_uri: 'http://localhost:3000/auth/kakao/callback', // 환경에 맞게 설정
          code,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const { access_token } = response.data;
      res.status(200).json({ accessToken: access_token });
    } catch (error) {
      console.error('토큰 요청 오류:', error);
      res.status(500).json({ message: '토큰 요청 실패' });
    }
  });

  // 사용자 프로필 업데이트
router.post('/profile', async (req, res) => {
    const { userId, username, userBirth, userHeight, userWeight, userGender, userImage } = req.body;
    try {
      let user = await User.findOne({ where: { userId } });
      if (user) {
        user = await user.update({
          username,
          userBirth,
          userHeight,
          userWeight,
          userGender,
          userImage
        });
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: '사용자를 찾을 수 없음' });
      }
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      res.status(500).json({ message: '프로필 업데이트 실패' });
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