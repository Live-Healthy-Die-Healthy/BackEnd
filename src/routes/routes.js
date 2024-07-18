const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { parseISO, isValid } = require('date-fns');
const { kakaoAccessToken } = require('../controllers/loginController')
const { ExerciseList, AerobicExercise, AnaerobicExercise, ExerciseLog, User, DietLog, DietLogDetail, MenuList } = require('../index');
const { Op, Sequelize } = require('sequelize'); 

const bodyParser = require('body-parser');

const app = express(); // app 인스턴스를 추가로 생성

app.use(bodyParser.urlencoded({    
  limit: "50mb",
  extended: true, // true로 변경
}));

app.use(bodyParser.json({   
  limit: "50mb"
}));

// 라우터 사용 시에도 동일하게 설정
router.use(express.urlencoded({    
  limit:"50mb",
  extended: true, // true로 변경
}));

router.use(express.json({   
  limit : "50mb"
}));

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
  router.post('/newProfile', async (req, res) => {
    console.log('Received request on /newProfile');

    console.log('Full request body:', JSON.stringify(req.body, null, 2));

    const connectedAt = new Date();
    const { userId, userEmail, userNickname, userBirth, userHeight, userWeight, userGender, userImage } = req.body;
    const username = userNickname;
    console.log("userImage: ", userImage);

    let imageBuffer = null;
    if (userImage && userImage.startsWith('data:image')) {
      const base64Data = userImage.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    }
    console.log("imageBuffer: ", imageBuffer);


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
        userImage : imageBuffer,
        connectedAt
      });
      res.status(200).json(newUser);
    } catch (error) {
      console.error('프로필 등록 오류:', error);
      res.status(500).json({ message: '프로필 등록 실패' });
    }
  });




//승준
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
        let exerciseDetails;
  
        if (log.exerciseType === 'AerobicExercise') {
          const aerobic = await AerobicExercise.findOne({
            where: { exerciseLogId: log.exerciseLogId }
          });
          console.log("aerobic: ", aerobic);
          exerciseDetails = {
            distance: aerobic.distance,
            exerciseTime: aerobic.exerciseTime
          };
        } else if (log.exerciseType === 'AnaerobicExercise') {
          const anaerobic = await AnaerobicExercise.findOne({
            where: { exerciseLogId: log.exerciseLogId }
          });
  
          // weight와 repetition을 배열 형태로 변환
          const weights = JSON.parse(anaerobic.weight);
          const repetitions = JSON.parse(anaerobic.repetition);
  
          exerciseDetails = {
            set: weights.length,
            weight: weights,
            repetition: repetitions,
            exerciseTime: anaerobic.exerciseTime
          };
        } else {
          exerciseDetails = log; // 다른 유형의 운동 로그가 있을 경우 기본 로그 반환
        }
  
        // exerciseId에 해당하는 exerciseName을 찾기
        const exercise = await ExerciseList.findOne({
          where: { exerciseId: log.exerciseId }
        });
  
        return {
          exerciseLogId: log.exerciseLogId,
          exerciseDate: log.exerciseDate,
          exerciseType: log.exerciseType,
          exerciseName: exercise ? exercise.exerciseName : null,
          ...exerciseDetails
        };
      }));
  
      res.json(responses);
    } catch (error) {
      console.error('Error retrieving exercise logs:', error); // 로그에 오류 정보를 출력
      res.status(500).json({ message: 'Error retrieving exercise logs', error: error.toString() });
    }
  });

// PUT 요청: 특정 운동 기록 수정
router.put('/exerciseLog', async (req, res) => {
    const { exerciseLogId, exerciseType, distance, weight, repetition, exerciseTime } = req.body; // 업데이트할 세부 사항을 body에서 가져옴
    console.log("exerciseTime : ", exerciseTime);
    console.log("weight : ", weight);
    console.log("repetition : ", repetition);
    try {
        const log = await ExerciseLog.findByPk(exerciseLogId);
        console.log("log : ", log);

        if (!log) {
            return res.status(404).json({ message: 'Exercise log not found' });
        }

        if (exerciseType === 'AerobicExercise') {
            await AerobicExercise.update(
                { distance: distance, exerciseTime: exerciseTime },
                { where: { exerciseLogId: log.exerciseLogId } }
            );
        } else if (exerciseType === 'AnaerobicExercise') {
            // weight와 repetition을 문자열 배열 형태로 변환
            const set = weight.length;
            const weightArray = JSON.stringify(weight);
            const repetitionArray = JSON.stringify(repetition);
            console.log("weightArray : ", weightArray);
            console.log("set : ", set);
            console.log("weightArray.length : ", weightArray.length);

            await AnaerobicExercise.update(
                { set: set, weight: weightArray, repetition: repetitionArray, exerciseTime: exerciseTime },
                { where: { exerciseLogId: log.exerciseLogId } }
            );
        }

        res.json({ message: 'Exercise log updated successfully' });
    } catch (error) {
        console.error('Error updating exercise log:', error);
        res.status(500).json({ message: 'Error updating exercise log', error: error.toString() });
    }
});

router.post('/getTrainingLog', async (req, res) => {
    const { exerciseLogId } = req.body;
  
    try {
      const log = await ExerciseLog.findOne({
        where: { exerciseLogId: exerciseLogId }
      });
  
      if (!log) {
        return res.status(404).json({ message: 'No exercise log found' });
      }
  
      let exerciseDetails;
  
      if (log.exerciseType === 'AerobicExercise') {
        const aerobic = await AerobicExercise.findOne({
          where: { exerciseLogId: log.exerciseLogId }
        });
        exerciseDetails = {
          distance: aerobic.distance,
          exerciseTime: aerobic.exerciseTime
        };
      } else if (log.exerciseType === 'AnaerobicExercise') {
        const anaerobic = await AnaerobicExercise.findOne({
          where: { exerciseLogId: log.exerciseLogId }
        });
  
        // weight와 repetition을 배열 형태로 변환
        const weights = JSON.parse(anaerobic.weight);
        const repetitions = JSON.parse(anaerobic.repetition);
  
        exerciseDetails = {
          set: weights.length,
          weight: weights,
          repetition: repetitions,
          exerciseTime: anaerobic.exerciseTime
        };
      } else {
        exerciseDetails = log; // 다른 유형의 운동 로그가 있을 경우 기본 로그 반환
      }
  
      const response = {
        exerciseLogId: log.exerciseLogId,
        exerciseType: log.exerciseType,
        ...exerciseDetails
      };
  
      res.json(response);
    } catch (error) {
      console.error('Error retrieving exercise log:', error); // 로그에 오류 정보를 출력
      res.status(500).json({ message: 'Error retrieving exercise log', error: error.toString() });
    }
  });

// DELETE 요청: 특정 운동 기록 삭제
router.delete('/exerciseLog', async (req, res) => {
  const { exerciseLogId } = req.body;

  try {
      const log = await ExerciseLog.findByPk(exerciseLogId);

      if (!log) {
          return res.status(404).json({ message: 'Exercise log not found' });
      }

      if (log.exerciseType === 'AerobicExercise') {
          await AerobicExercise.destroy({ where: { exerciseLogId: log.exerciseLogId } });
      } else if (log.exerciseType === 'AnaerobicExercise') {
          await AnaerobicExercise.destroy({ where: { exerciseLogId: log.exerciseLogId } });
      }

      await log.destroy();
      res.json({ message: 'Exercise log deleted successfully' });
  } catch (error) {
      console.error('Error deleting exercise log:', error);
      res.status(500).json({ message: 'Error deleting exercise log', error: error.toString() });
  }
});

// POST 요청: 특정 사용자의 특정 월의 운동 기록 조회
router.post('/exerciseCalendar', async (req, res) => {
  const { userId, date } = req.body;

  console.log('Received userId:', userId);
  console.log('Received date:', date);

  try {
      const inputDate = new Date(date);
      const startDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1, 0, 0, 0, 0);
      const endDate = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0, 23, 59, 59, 999);

      console.log("startDate:", startDate);
      console.log("endDate:", endDate);

      const exerciseLogs = await ExerciseLog.findAll({
          where: {
              userId: userId,
              exerciseDate: {
                  [Op.between]: [startDate, endDate]
              }
          }
      });

      console.log("exerciseLogs:", exerciseLogs);

      if (exerciseLogs.length === 0) {
          return res.status(404).json({ message: 'No exercise logs found' });
      }

      const responses = await Promise.all(exerciseLogs.map(async (log) => {
          const exercise = await ExerciseList.findOne({
              where: { exerciseId: log.exerciseId }
          });

          let exerciseDetails = {
              exerciseName: exercise ? exercise.exerciseName : 'Unknown',
              exerciseDate: log.exerciseDate,
              exerciseType: log.exerciseType
          };

          if (log.exerciseType === 'AerobicExercise') {
              const aerobic = await AerobicExercise.findOne({
                  where: { exerciseLogId: log.exerciseLogId }
              });
              exerciseDetails.distance = aerobic ? aerobic.distance : null;
          } else if (log.exerciseType === 'AnaerobicExercise') {
              const anaerobic = await AnaerobicExercise.findOne({
                  where: { exerciseLogId: log.exerciseLogId }
              });
              const weights = JSON.parse(anaerobic.weight);
              console.log("weights : ", weights);
              console.log("anaerobic.weight.length : ", anaerobic.weight.length);
              exerciseDetails.set = anaerobic ? weights.length : null;
              exerciseDetails.weight = anaerobic ? anaerobic.weight : null;
              exerciseDetails.repetition = anaerobic ? anaerobic.repetition : null;
          }

          return exerciseDetails;
      }));

      res.json(responses);
  } catch (error) {
      console.error('Error retrieving exercise logs:', error);
      res.status(500).json({ message: 'Error retrieving exercise logs', error: error.toString() });
  }
});

// 프로필 페이지 - 사용자 정보 조회
router.post('/profile', async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 디코딩된 이미지를 포함한 응답 데이터 생성
    const userProfile = {
      userId: user.userId,
      userEmail: user.userEmail,
      userNickname: user.username,
      userBirth: user.userBirth,
      userHeight: user.userHeight,
      userWeight: user.userWeight,
      userGender: user.userGender,
      userImage: user.userImage ? user.userImage.toString('base64') : null, // 디코딩된 이미지 포함
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    res.status(500).json({ message: 'Failed to retrieve user profile' });
  }
});

//프로필 수정 - 사용자 정보 수정

router.put('/profile', async (req, res) => {
  const { userId, username, userBirth, userHeight, userWeight, userImage } = req.body;

  try {
      const user = await User.findOne({ where: { userId } });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      let imageBuffer = null;
      if (userImage && userImage.startsWith('data:image')) {
        const base64Data = userImage.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      }
      console.log("imageBuffer: ", imageBuffer);

      user.username = username;
      user.userBirth = userBirth;
      user.userHeight = userHeight;
      user.userWeight = userWeight;
      user.userImage = imageBuffer;

      await user.save();

      res.status(200).json(user);
  } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Failed to update user profile' });
  }
});

// POST 요청: 특정 사용자의 특정 월의 식단 기록 조회
router.post('/dietCalender', async (req, res) => {
  const { userId, date } = req.body;

  console.log('Received userId:', userId);
  console.log('Received date:', date);

  try {
    const inputDate = new Date(date);
    const startDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1, 0, 0, 0, 0);
    const endDate = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0, 23, 59, 59, 999);

    console.log("startDate:", startDate);
    console.log("endDate:", endDate);

    const dietLogs = await DietLog.findAll({
      where: {
        userId: userId,
        dietDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: DietLogDetail,
        as: 'details',
        include: [{
          model: MenuList,
          as: 'menu'
        }]
      }]
    });

    console.log("dietLogs:", dietLogs);

    if (dietLogs.length === 0) {
      return res.status(404).json({ message: 'No diet logs found' });
    }

    // 날짜별로 그룹화하여 총 칼로리를 계산
    const caloriesByDate = dietLogs.reduce((acc, log) => {
      const logDate = log.dietDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 변환
      const totalCaloriesForLog = log.details.reduce((total, detail) => {
        const calories = detail.quantity * detail.menu.menuCalorie;
        return total + calories;
      }, 0);

      if (!acc[logDate]) {
        acc[logDate] = 0;
      }
      acc[logDate] += totalCaloriesForLog;
      return acc;
    }, {});

    // 응답 형식으로 변환
    const response = Object.keys(caloriesByDate).map(date => ({
      date: date,
      calories: parseFloat(caloriesByDate[date].toFixed(2))
    }));

    res.json(response);
  } catch (error) {
    console.error('Error retrieving diet logs:', error);
    res.status(500).json({ message: 'Error retrieving diet logs', error: error.toString() });
  }
});
// 특정 날짜의 사용자 식단 로그 및 총 칼로리 계산
router.post('/dailyDiet', async (req, res) => {
  const { userId, date } = req.body;

  try {
    // 입력된 날짜의 시작과 끝을 정의
    const startDate = new Date(date);
    if (isNaN(startDate)) {
      throw new Error('Invalid date format');
    }
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    if (isNaN(endDate)) {
      throw new Error('Invalid date format');
    }
    endDate.setHours(23, 59, 59, 999);

    // 해당 날짜에 해당하는 DietLog 찾기
    const dietLogs = await DietLog.findAll({
      where: {
        userId: userId,
        dietDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: DietLogDetail,
        as: 'details',
        include: [{
          model: MenuList,
          as: 'menu'
        }]
      }]
    });

    // 식사 유형별로 데이터를 분류하고 칼로리 계산
    const dietData = {
      breakfast: { totalCalories: 0, menuNames: [] },
      lunch: { totalCalories: 0, menuNames: [] },
      dinner: { totalCalories: 0, menuNames: [] },
      snack: { totalCalories: 0, menuNames: [] }
    };

    dietLogs.forEach(dietLog => {
      const type = dietLog.dietType.toLowerCase();
      if (dietData[type]) {
        dietLog.details.forEach(detail => {
          const calories = detail.quantity * detail.menu.menuCalorie;
          dietData[type].totalCalories += calories;
          dietData[type].menuNames.push(detail.menu.menuName);
        });
      }
    });

    // 응답 데이터 형식에 맞게 변환
    const response = Object.keys(dietData).map(type => ({
      dietLogId: dietLogs.find(log => log.dietType.toLowerCase() === type)?.dietLogId || null,
      dietType: type,
      calories: parseFloat(dietData[type].totalCalories.toFixed(2)),
      menuNames: dietData[type].menuNames
    }));

    res.json(response);
  } catch (error) {
    console.error('Error retrieving daily diet:', error);
    res.status(500).json({ message: 'Error retrieving daily diet', error: error.message });
  }
});

// 특정 날짜의 특정 식단 유형의 세부 식단 정보 및 총 칼로리 계산
router.post('/dietDetail/:dietType', async (req, res) => {
  const { userId, date } = req.body;
  const { dietType } = req.params;

  console.log('Received userId:', userId);
  console.log('Received date:', date);
  console.log('Received dietType:', dietType);

  try {
    if (!dietType || typeof dietType !== 'string' || dietType.trim() === '') {
      throw new Error('Invalid diet type');
    }

    if (!date || isNaN(Date.parse(date))) {
      throw new Error('Invalid date format');
    }

    const inputDate = new Date(date);
    const startDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 0, 0, 0, 0);
    const endDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 23, 59, 59, 999);

    console.log("startDate:", startDate);
    console.log("endDate:", endDate);

    // 해당 날짜와 식단 유형에 해당하는 DietLog 찾기
    const dietLogs = await DietLog.findAll({
      where: {
        userId: userId,
        dietType: dietType,
        dietDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{
        model: DietLogDetail,
        as: 'details',
        include: [{
          model: MenuList,
          as: 'menu'
        }]
      }]
    });

    if (dietLogs.length === 0) {
      return res.status(404).json({ message: 'No diet log found for the given type and date' });
    }

    // 식단 세부 정보 계산
    const response = dietLogs.flatMap(dietLog => 
      dietLog.details.map(detail => ({
        dietDetailLogId: detail.dietDetailLogId,
        menuName: detail.menu.menuName,
        calories: parseFloat((detail.quantity * detail.menu.menuCalorie).toFixed(2)),
        quantity: detail.quantity
      }))
    );

    console.log("response:", response);
    res.json(response);
  } catch (error) {
    console.error('Error retrieving diet details:', error);
    res.status(500).json({ message: 'Error retrieving diet details', error: error.message });
  }
});


// PUT 요청: 특정 식단 세부 기록의 수량 수정
router.put('/dietDetail/:dietDetailLogId', async (req, res) => {
  const { dietDetailLogId } = req.params;
  const { quantity } = req.body;

  console.log('Received dietDetailLogId:', dietDetailLogId);
  console.log('Received quantity:', quantity);

  try {
    // 식단 세부 기록 찾기
    const dietDetail = await DietLogDetail.findByPk(dietDetailLogId);

    if (!dietDetail) {
      return res.status(404).json({ message: 'Diet detail not found' });
    }

    // 수량 업데이트
    dietDetail.quantity = quantity;
    await dietDetail.save();

    console.log(`Updated dietDetailLogId ${dietDetailLogId} with quantity ${quantity}`);

    res.json({ message: 'Quantity updated successfully', dietDetail });
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ message: 'Error updating quantity', error: error.message });
  }
});

// DELETE 요청: 특정 식단 세부 기록 삭제
router.delete('/dietDetail/:dietDetailLogId', async (req, res) => {
  const { dietDetailLogId } = req.params;


  console.log('Received dietDetailLogId:', dietDetailLogId);

  try {
    // 식단 세부 기록 찾기
    const dietDetail = await DietLogDetail.findByPk(dietDetailLogId);

    if (!dietDetail) {
      return res.status(404).json({ message: 'Diet detail not found' });
    }

    // 식단 세부 기록 삭제
    await dietDetail.destroy();

    console.log(`Deleted dietDetailLogId ${dietDetailLogId}`);

    res.json({ message: 'Diet detail deleted successfully' });
  } catch (error) {
    console.error('Error deleting diet detail:', error);
    res.status(500).json({ message: 'Error deleting diet detail', error: error.message });
  }
});

// POST 요청: 식단 기록 추가
router.post('/addDiet', async (req, res) => {
  const { userId, dietDate, dietType, menuId, quantity } = req.body;

  console.log('Received userId:', userId);
  console.log('Received dietDate:', dietDate);
  console.log('Received dietType:', dietType);
  console.log('Received menuId:', menuId);
  console.log('Received quantity:', quantity);

  try {
    // 새로운 식단 로그 생성
    const newDietLog = await DietLog.create({
      userId: userId,
      dietDate: dietDate,
      dietType: dietType
    });

    // 새로운 식단 세부 기록 생성
    const newDietLogDetail = await DietLogDetail.create({
      dietLogId: newDietLog.dietLogId,
      menuId: menuId,
      quantity: quantity
    });

    console.log('New diet log created:', newDietLog);
    console.log('New diet log detail created:', newDietLogDetail);

    res.json({
      message: 'Diet log and details added successfully',
      dietLog: newDietLog,
      dietLogDetail: newDietLogDetail
    });
  } catch (error) {
    console.error('Error adding diet log and details:', error);
    res.status(500).json({ message: 'Error adding diet log and details', error: error.message });
  }
});

// GET 요청: 모든 메뉴 항목 조회
router.get('/menuList', async (req, res) => {
  try {
    const menuItems = await MenuList.findAll();

    res.json(menuItems);
  } catch (error) {
    console.error('Error retrieving menu list:', error);
    res.status(500).json({ message: 'Error retrieving menu list', error: error.message });
  }
});

module.exports = router;