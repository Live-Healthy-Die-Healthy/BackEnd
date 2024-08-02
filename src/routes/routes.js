const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { parseISO, isValid } = require('date-fns');
const { kakaoAccessToken } = require('../controllers/loginController')
const { ExerciseList, AerobicExercise, AnaerobicExercise, ExerciseLog, User, DietLog, DietLogDetail, MenuList, Friend, CheatDay } = require('../index');
const { Op, Sequelize } = require('sequelize'); 
const { Analysis } = require('../index');
const { v4: uuidv4 } = require('uuid');

const bodyParser = require('body-parser');

// 라우터 사용 시에도 동일하게 설정
router.use(express.urlencoded({    
  limit:"100mb",
  extended: true, // true로 변경
}));

router.use(express.json({   
  limit : "100mb"
}));

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

// 주의 마지막일(일요일)을 구하는 함수
function getSunday(date) {
  const monday = getMonday(date);
  return new Date(monday.setDate(monday.getDate() + 6));
}

// 월의 시작일(1일)을 구하는 함수
function getFirstDayOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// 월의 마지막일을 구하는 함수
function getLastDayOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

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
    const { userId, userEmail, userNickname, userBirth, userHeight, userWeight, userGender,  userMuscleMass, userBmi, userBodyFatPercentage, userBmr, userImage } = req.body.profileData;
    const username = userNickname;
    console.log("userImage: ", userImage);

    let imageBuffer = null;
    if (userImage && userImage.startsWith('data:image')) {
      const base64Data = userImage.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    }
    console.log("imageBuffer: ", imageBuffer);

    const currentYear = new Date().getFullYear();
    const userAge = currentYear - userBirth;

    // BMR 계산 함수 (Harris-Benedict 방정식)
    function calculateBMR(weight, height, age, gender) {
      if (gender === 'Male') {
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else if (gender === 'Female') {
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    } else {
        throw new Error('Invalid gender');
    }
  } 

    // TDEE 계산 함수 
    function calculateTDEE(bmr, activityLevel) {
       return bmr * activityLevel;
    }

    // BMR 계산
    const userBMR = calculateBMR(userWeight, userHeight, userAge, userGender);
    const activityLevel = 1.55;

    // TDEE 계산 (권장 섭취 칼로리)
    const recommendedCal = calculateTDEE(userBMR, activityLevel);
    console.log(`권장 섭취 칼로리: ${recommendedCal.toFixed(2)} kcal/day`);

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
        userMuscleMass,
        userBmi,
        userBodyFatPercentage,
        userBmr,
        userImage : imageBuffer,
        connectedAt,
        recommendedCal
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
      userMuscleMass: user.userMuscleMass,
      userBmi: user.userBmi,
      userBodyFatPercentage: user.userBodyFatPercentage,
      userBmr: user.userBmr,
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
  const { userId, username, userBirth, userHeight, userWeight, userMuscleMass, userBmi, userBodyFatPercentage, userBmr, userImage } = req.body;

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
      user.userMuscleMass=userMuscleMass;
      user.userBmi= userBmi;
      user.userBodyFatPercentage= userBodyFatPercentage;
      user.userBmr= userBmr;
      user.userImage = imageBuffer;

      await user.save();

      res.status(200).json(user);
  } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Failed to update user profile' });
  }
});


// 캘린더 POST 요청: 특정 사용자의 특정 월의 식단 및 운동 기록 조회
router.post('/calendar', async (req, res) => {
  const { userId, date } = req.body;

  console.log('Received userId:', userId);
  console.log('Received date:', date);

  try {
    const inputDate = new Date(date);
    const startDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), 2, 0, 0, 0, 0);
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

    const exerciseLogs = await ExerciseLog.findAll({
      where: {
        userId: userId,
        exerciseDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const recordsByDate = {};

    dietLogs.forEach(log => {
      const logDate = new Date(log.dietDate).toISOString().split('T')[0];
      if (!recordsByDate[logDate]) {
        recordsByDate[logDate] = { hasDietLog: false, hasExerciseLog: false };
      }
      recordsByDate[logDate].hasDietLog = true;
    });

    exerciseLogs.forEach(log => {
      const logDate = new Date(log.exerciseDate).toISOString().split('T')[0];
      if (!recordsByDate[logDate]) {
        recordsByDate[logDate] = { hasDietLog: false, hasExerciseLog: false };
      }
      recordsByDate[logDate].hasExerciseLog = true;
    });

    const response = Object.keys(recordsByDate).map(date => ({
      date,
      hasDietLog: recordsByDate[date].hasDietLog,
      hasExerciseLog: recordsByDate[date].hasExerciseLog
    }));

    res.json(response);
  } catch (error) {
    console.error('Error retrieving logs:', error);
    res.status(500).json({ message: 'Error retrieving logs', error: error.toString() });
  }
});


// POST 요청: 특정 사용자의 특정 날짜의 기록 조회
router.post('/calendarDetail', async (req, res) => {
  const { userId, date } = req.body;

  try {
    const inputDate = new Date(date);
    const startDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 0, 0, 0, 0);
    const endDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 23, 59, 59, 999);

    // 식단 로그 조회
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

    // 운동 로그 조회
    const exerciseLogs = await ExerciseLog.findAll({
      where: {
        userId: userId,
        exerciseDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    // 총 칼로리 계산
    const totalCalories = dietLogs.reduce((total, log) => {
      return total + log.details.reduce((subtotal, detail) => subtotal + (detail.quantity * detail.menu.menuCalorie), 0);
    }, 0);

    // 운동 이름과 세트/거리 정보 조회
    const exerciseDetails = await Promise.all(exerciseLogs.map(async (log) => {
      const exercise = await ExerciseList.findOne({ where: { exerciseId: log.exerciseId } });
      let exerciseDetail = {
        exerciseName: exercise ? exercise.exerciseName : 'Unknown',
        set: null,
        distance: null
      };

      if (log.exerciseType === 'AerobicExercise') {
        const aerobic = await AerobicExercise.findOne({ where: { exerciseLogId: log.exerciseLogId } });
        exerciseDetail.distance = aerobic ? aerobic.distance : null; // 거리 (km)
      } else if (log.exerciseType === 'AnaerobicExercise') {
        const anaerobic = await AnaerobicExercise.findOne({ where: { exerciseLogId: log.exerciseLogId } });
        if (anaerobic) {
          const weights = JSON.parse(anaerobic.weight);
          exerciseDetail.set = weights.length; // 세트 수
        }
      }

      return exerciseDetail;
    }));

    res.json({
      totalCalories,
      exerciseDetails
    });
  } catch (error) {
    console.error('Error getting record details:', error);
    res.status(500).json({ message: 'Error getting record details', error: error.message });
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
        carbo: parseFloat((detail.quantity * detail.menu.menuCarbo).toFixed(2)),
        protein: parseFloat((detail.quantity * detail.menu.menuProtein).toFixed(2)),
        fat: parseFloat((detail.quantity * detail.menu.menuFat).toFixed(2)),
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

// /friendRequest 친구 요청 보내기
router.post('/friendRequest', async (req, res) => {
  const { userId, to_user_id } = req.body;

  // 요청 데이터가 유효한지 확인
  if (!userId || !to_user_id) {
      return res.status(400).json({ error: 'Both userId and to_user_id are required' });
  }

  // 자기 자신에게 친구 요청을 보낼 수 없음
  if (userId === to_user_id) {
      return res.status(400).json({ success: false, message: '자기 자신에게 친구 요청을 보낼 수 없습니다.' });
  }

  try {
      // to_user_id가 DB에 존재하는지 확인
      const userExists = await User.findOne({ where: { userId: to_user_id } });

      if (!userExists) {
          return res.status(200).json({ isExist: false });
      }

      // 이미 친구 요청을 보낸 상태인지 확인
      const existingFriendRequest = await Friend.findOne({
          where: { userId, to_user_id }
      });

      if (existingFriendRequest) {
          return res.status(200).json({ success: false, message: '이미 친구 요청을 보낸 사용자입니다.' });
      }

      // 친구 요청 생성
      const newFriendRequest = await Friend.create({
          userId,
          to_user_id,
          status: 'pending',
          request_date: new Date(),
      });

      // 성공 응답
      res.status(200).json({ isExist: true, success: true, message: 'Friend request sent successfully', friendRequest: newFriendRequest });
  } catch (error) {
      console.error('Error creating friend request:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


// /showFriendRequest 친구 추가 요청 보기
router.post('/showFriendRequest', async (req, res) => {
  const { userId } = req.body;

  // 요청 데이터가 유효한지 확인
  if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
  }

  try {
      // 해당 사용자가 받은 친구 요청을 조회
      const friendRequests = await Friend.findAll({
          where: { to_user_id: userId, status: 'pending' },
          include: [
              {
                  model: User,
                  as: 'user',
                  attributes: ['userId', 'username'],
              },
          ],
      });
      // 요청이 없을 경우
      if (friendRequests.length === 0) {
        return res.status(200).json({ message: '친구 요청이 없습니다.' });
    }

    // 요청 정보 가공
    const formattedRequests = friendRequests.map(request => ({
        userId: request.user.userId,
        username: request.user.username,
    }));

    res.status(200).json(formattedRequests);
} catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});

// 친구 요청 상태 업데이트 (수락 또는 거절)
router.post('/confirmFriendRequest', async (req, res) => {
  const { userId, to_user_id, confirm } = req.body;

  if (!userId || !to_user_id || !confirm) {
    return res.status(400).json({ error: 'userId, to_user_id, and confirm are required' });
  }

  if (!['accepted', 'rejected'].includes(confirm)) {
    return res.status(400).json({ error: 'confirm must be either "accepted" or "rejected"' });
  }

  try {
    const friendRequest = await Friend.findOne({
      where: {
        userId : to_user_id,
        to_user_id : userId,
        status: 'pending',
      }
    });

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    friendRequest.status = confirm;
    friendRequest.accept_date = confirm === 'accepted' ? new Date() : null;
    await friendRequest.save();

    if (confirm === 'accepted') {
      await Friend.create({
        userId,
        to_user_id,
        status: 'accepted',
        accept_date: new Date(),
      });
    }
    
    res.status(200).json({ message: 'Friend request updated successfully', friendRequest });
  } catch (error) {
    console.error('Error updating friend request status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 친구 목록 확인
router.post('/friendList', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // 해당 사용자의 친구 목록을 조회 (to_user_id를 사용)
    const friends = await Friend.findAll({
      where: { to_user_id: userId, status: 'accepted' },
      include: [
        {
          model: User,
          as: 'user', // 관계 정의 시 설정한 alias
          attributes: ['userId', 'userImage', 'username'],
        },
      ],
    });

    // 요청이 없을 경우
    if (friends.length === 0) {
      return res.status(200).json({ message: '친구가 없습니다.' });
    }

    // 요청 정보 가공
    const formattedFriends = friends.map(friend => ({
      userId: friend.user.userId,
      userImage: friend.user.userImage ? Buffer.from(friend.user.userImage).toString('base64') : null,
      username: friend.user.username,
    }));

    res.status(200).json(formattedFriends);
  } catch (error) {
    console.error('Error fetching friend list:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const getUserData = async (userId) => {
  const user = await User.findOne({
    where: { userId: userId },
    attributes: ['userWeight', 'userBodyFatPercentage', 'userBmi', 'userMuscleMass']
  });

  if (user) {
    return {
      userWeight: user.userWeight,
      userBodyFatPercentage: user.userBodyFatPercentage,
      userBmi: user.userBmi,
      userMuscleMass: user.userMuscleMass
    };
  } else {
    // 기본값을 0으로 설정
    return {
      userWeight: 0,
      userBodyFatPercentage: 0,
      userBmi: 0,
      userMuscleMass: 0
    };
  }
};

const getPreviousMonthData = async (userId, date) => {
  // 주어진 날짜를 기준으로 이전 달의 첫날과 마지막 날 계산
  const currentDate = new Date(date);
  const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const firstDayOfPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
  const lastDayOfPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0);

  // User 모델에서 이전 달 데이터 조회
  const previousMonthData = await User.findOne({
    where: {
      userId: userId,
      updatedAt: {
        [Op.between]: [firstDayOfPreviousMonth, lastDayOfPreviousMonth]
      }
    },
    attributes: ['userWeight', 'userBodyFatPercentage', 'userBmi', 'userMuscleMass']
  });

  // 데이터 반환
  if (previousMonthData) {
    return {
      userWeight: previousMonthData.userWeight,
      userBodyFatPercentage: previousMonthData.userBodyFatPercentage,
      userBmi: previousMonthData.userBmi,
      userMuscleMass: previousMonthData.userMuscleMass
    };
  } else {
    // 기본값을 0으로 설정
    return {
      userWeight: 0,
      userBodyFatPercentage: 0,
      userBmi: 0,
      userMuscleMass: 0
    };
  }
};

const calculateChanges = (previousData, currentData) => {
  console.log("current weight: ",currentData.userWeight);
  console.log("previous weight: ", previousData.userWeight);
  return {
    weightChange: currentData.userWeight - previousData.userWeight,
    bodyFatChange: currentData.userBodyFatPercentage - previousData.userBodyFatPercentage,
    bmiChange: currentData.userBmi - previousData.userBmi,
    muscleMassChange: currentData.userMuscleMass - previousData.userMuscleMass,
  };
};

router.post('/compareFriend', async (req, res) => {
  const { userId, friend_id, date } = req.body;

  if (!userId || !friend_id || !date) {
    return res.status(400).json({ error: 'userId, friend_id, and date are required' });
  }

  try {
    // 유저와 친구가 실제로 친구 관계인지 확인
    const friendRelation = await Friend.findOne({
      where: {
        userId,
        to_user_id: friend_id,
        status: 'accepted'
      }
    });

    if (!friendRelation) {
      return res.status(400).json({ error: 'Users are not friends' });
    }

    // 유저 정보 조회
    const user = await User.findOne({
      where: { userId }
    });

    // 친구 정보 조회
    const friend = await User.findOne({
      where: { userId: friend_id },
    });

    const userData = {
      userGender: user.userGender,
      userBirth: user.userBirth,
      userWeight: user.userWeight,
      userMuscleMass: user.userMuscleMass,
      userBmi: user.userBmi,
      userBodyFatPercentage: user.userBodyFatPercentage,
      userBmr: user.userBmr
    };

    const friendData = {
      userGender: friend.userGender,
      userBirth: friend.userBirth,
      userWeight: friend.userWeight,
      userMuscleMass: friend.userMuscleMass,
      userBmi: friend.userBmi,
      userBodyFatPercentage: friend.userBodyFatPercentage,
      userBmr: friend.userBmr
    };

    // 주간 시작일과 마지막일 계산
    const startDate = getMonday(date);
    const endDate = getSunday(date);

    const userPreviousMonthData = await getPreviousMonthData(userId, date);
    const userChanges = calculateChanges(userPreviousMonthData, userData);
    const friendPreviousMonthData = await getPreviousMonthData(friend_id, date);
    const friendChanges = calculateChanges(friendPreviousMonthData, friendData);


    // 주간 운동 시간을 계산하는 함수
    const calculateTotalExerciseTime = async (userId, startDate, endDate) => {
      const exerciseLogs = await ExerciseLog.findAll({
        where: {
          userId,
          exerciseDate: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          { model: AerobicExercise, as: 'aerobic' },
          { model: AnaerobicExercise, as: 'anaerobic' }
        ]
      });

      let totalExerciseTime = 0;

      exerciseLogs.forEach(log => {
        if (log.aerobic) {
          totalExerciseTime += log.aerobic.exerciseTime;
        }
        if (log.anaerobic) {
          totalExerciseTime += log.anaerobic.exerciseTime;
        }
      });

      return totalExerciseTime;
    };

    // 주간 운동 시간 계산
    const userWeeklyExerciseTime = await calculateTotalExerciseTime(userId, startDate, endDate);

    // 주간 운동 시간 계산
    const friendWeeklyExerciseTime = await calculateTotalExerciseTime(friend_id, startDate, endDate);

    if (!user || !friend) {
      return res.status(404).json({ error: 'User or Friend not found' });
    }

    // 유저와 친구의 정보 반환
    res.status(200).json({
      user: {
        username: user.username,
        userImage: user.userImage ? Buffer.from(user.userImage).toString('base64') : null,
        userBmi: user.userBmi,
        userRecommendedCal: user.recommendedCal,
        weeklyExerciseTime: userWeeklyExerciseTime,
        weightChangeRate: userChanges.weightChange,
        bodyFatChangeRate: userChanges.bodyFatChange,
        bmiChangeRate: userChanges.bmiChange,
        muscleMassChangeRate: userChanges.muscleMassChange,
      },
      friend: {
        username: friend.username,
        userImage: friend.userImage ? Buffer.from(friend.userImage).toString('base64') : null,
        userBmi: friend.userBmi,
        userRecommendedCal: friend.recommendedCal,
        weeklyExerciseTime: friendWeeklyExerciseTime,
        weightChangeRate: friendChanges.weightChange,
        bodyFatChangeRate: friendChanges.bodyFatChange,
        bmiChangeRate: friendChanges.bmiChange,
        muscleMassChangeRate: friendChanges.muscleMassChange,
      }
    });
  } catch (error) {
    console.error('Error fetching user or friend data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/setCheatDay', async (req, res) => {
  const { userId, cheatDayDate } = req.body;

  if (!userId || !cheatDayDate) {
    return res.status(400).json({ error: 'userId and cheatDayDate are required' });
  }

  try {
    const [cheatDay, created] = await CheatDay.findOrCreate({
      where: { userId },
      defaults: { cheatDayDate }
    });

    if (!created) {
      // 이미 존재하는 경우 업데이트
      await cheatDay.update({ cheatDayDate });
    }

    res.status(201).json(cheatDay);
  } catch (error) {
    console.error('Error setting cheat day:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/getCheatDay', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const cheatDay = await CheatDay.findOne({
      where: { userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cheatDate = cheatDay ? new Date(cheatDay.cheatDayDate) : null;
    cheatDate?.setHours(0, 0, 0, 0);

    if (!cheatDay || cheatDate <= today) {
      return res.json({
        message: "치팅데이를 설정해주세요!",
        needsCheatDaySetup: true
      });
    }

    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

    // 오늘 날짜까지의 일수 계산
    const daysUntilToday = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
    // 치팅데이까지의 일수 계산
    const daysUntilCheatDay = Math.ceil((cheatDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const dietLogs = await DietLog.findAll({
      where: {
        userId,
        dietDate: {
          [Op.between]: [startDate, cheatDate]
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

    const totalCalories = dietLogs.reduce((acc, log) => {
      return acc + log.details.reduce((total, detail) => {
        return total + (detail.quantity * detail.menu.menuCalorie);
      }, 0);
    }, 0);

    const user = await User.findOne({ where: { userId } });
    const recommendedDailyCalories = user.recommendedCal;

    // 오늘까지의 누적 권장 칼로리 계산
    const expectedCaloriesByToday = recommendedDailyCalories * daysUntilToday;
    // 치팅데이까지의 총 권장 칼로리 계산
    const totalRecommendedCalories = recommendedDailyCalories * daysUntilCheatDay;

    let message = "이대로 쭉 고고";
    if (totalCalories > expectedCaloriesByToday) {
      message = "너무 많이 먹었어요! 조금만 줄여보세요";
    } else {
      message = "지금 잘하고 있어요! 이대로 쭉 고고";
    }

    if (cheatDate.toDateString() === today.toDateString()) {
      if (totalCalories <= expectedCaloriesByToday) {
        message = "오늘 치팅하세요!";
      } else {
        message = "오늘은 치팅 못합니다";
      }
    }

    res.json({
      currentCalories: totalCalories,
      totalRecommendedCalories: totalRecommendedCalories,
      message,
      cheatDay: cheatDate.toISOString(),
      needsCheatDaySetup: false
    });
  } catch (error) {
    console.error('Error fetching cheat day info:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST 요청: 특정 사용자의 특정 월의 운동 기록 조회
router.post('/exerciseCalendar', async (req, res) => {
  const { userId, date } = req.body;

  try {
      const inputDate = new Date(date);
      const startDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1, 0, 0, 0, 0);
      const endDate = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0, 23, 59, 59, 999);


      const exerciseLogs = await ExerciseLog.findAll({
          where: {
              userId: userId,
              exerciseDate: {
                  [Op.between]: [startDate, endDate]
              }
          }
      });

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

// POST 요청: 특정 사용자의 특정 월의 식단 기록 조회
router.post('/dietCalender', async (req, res) => {
  const { userId, date } = req.body;

  try {
    const inputDate = new Date(date);
    const startDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1, 0, 0, 0, 0);
    const endDate = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0, 23, 59, 59, 999);

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

module.exports = router;