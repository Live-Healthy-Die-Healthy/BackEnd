const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { parseISO, isValid } = require('date-fns');
const { kakaoAccessToken } = require('../controllers/loginController')
const { ExerciseList, AerobicExercise, AnaerobicExercise, ExerciseLog, User, DietLog, DietLogDetail, MenuList } = require('../index');
const { Op, Sequelize } = require('sequelize'); 
const { Analysis } = require('../index');
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








































// 이미지 분석 및 식단 기록 추가 라우트
router.post('/dietImage' , async (req, res) => {
  const { userId, dietType, dietDate, dietImage } = req.body;

  try {
    // 분석 ID 생성
    const analysisId = uuidv4();

    // 분석 ID 반환
    res.json({ analysisId });

    // 비동기적으로 이미지 분석 시작
    performImageAnalysis(analysisId, dietImage, userId, dietType, dietDate);

  } catch (error) {
    console.error('Error processing diet image:', error);
    res.status(500).json({ message: 'Error processing diet image', error: error.message });
  }
});

router.get('/analysisStatus/:analysisId', async (req, res) => {
  const { analysisId } = req.params;

  try {
    const analysis = await Analysis.findByPk(analysisId);

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    if (analysis.status === 'completed') {
      console.log("analysis.dietDetailLogIds(com) : ", analysis.dietDetailLogIds);
      res.json({
        status: 'completed',
        dietInfo: analysis.result_json,
        dietDetailLogIds: analysis.dietDetailLogIds
      });
    } else if (analysis.status === 'failed') {
      res.json({
        status: 'failed',
        message: '음식의 양을 정확히 파악할 수 없습니다. 사진을 다시 찍어주세요.'
      });
    } else {
      res.json({ status: 'in_progress' });
    }
  } catch (error) {
    console.error('Error checking analysis status:', error);
    res.status(500).json({ message: 'Error checking analysis status', error: error.message });
  }
});






async function performImageAnalysis(analysisId, dietImage, userId, dietType, dietDate) {
  try {
    const analysisResult = await getGPTResponse("Analyze this meal image", dietImage);

    // 예상양이 0인 음식이 있는지 확인
    const hasZeroQuantity = analysisResult.음식상세.some(food => food.예상양 === 0);

    if (hasZeroQuantity) {
      await Analysis.create({
        analysisId,
        userId,
        dietImage,
        result_json: null,
        status: 'failed'
      });
      return { status: 'failed', message: '음식의 양을 정확히 파악할 수 없습니다. 사진을 다시 찍어주세요.' };
    }

    

    // DietLog 생성
    const newDietLog = await DietLog.create({
      userId,
      dietDate,
      dietType,
      dietImage
    });

    // DietLogDetail 생성 및 dietDetailLogId 수집
    const dietDetailLogIds = [];
    for (const food of analysisResult.음식상세) {
      let menuItem = await MenuList.findOne({ where: { menuName: food.음식명 } });

      if (!menuItem) {
        menuItem = await MenuList.create({
          menuName: food.음식명,
          menuCalorie: food.영양정보.칼로리 / 100,
        });
      }

      const dietLogDetail = await DietLogDetail.create({
        dietLogId: newDietLog.dietLogId,
        menuId: menuItem.menuId,
        quantity: food.예상양
      });
      console.log("dietLogDetail.dietDetailLogId : ", dietLogDetail.dietDetailLogId);

      dietDetailLogIds.push(dietLogDetail.dietDetailLogId);
    }
    console.log("dietDetailLogIds : ", dietDetailLogIds);

    await Analysis.create({
      analysisId,
      userId,
      dietImage,
      result_json: analysisResult,
      status: 'completed',
      dietDetailLogIds
    });

    return { status: 'completed', dietInfo: analysisResult };

  } catch (error) {
    console.error('Error during image analysis:', error);
    throw error;
  }
}



router.put('/updateDietDetail', async (req, res) => {
  const { updatedDetails } = req.body;

  try {
    for (const detail of updatedDetails) {
      const { dietDetailLogId, quantity } = detail;
      await DietLogDetail.update(
        { quantity },
        { where: { dietDetailLogId } }
      );
    }

    res.status(200).json({ message: 'Diet details updated successfully' });
  } catch (error) {
    console.error('Error updating diet details:', error);
    res.status(500).json({ message: 'Error updating diet details', error: error.message });
  }
});














const basePrompt = `
당신은 영양학과 식품과학 분야의 전문가인 AI 영양사입니다. 사용자가 업로드한 식단 이미지를 분석하여 종합적이고 구조화된 식단 정보를 제공합니다. 다음 JSON 형식에 따라 분석 결과를 출력하세요:

{
    "총칼로리": 0,
    "영양소비율": {
        "탄수화물": 0,
        "단백질": 0,
        "지방": 0
    },
    "음식상세": [
        {
            "음식명": "",
            "예상양": 0,
            "칼로리": 0,
            "영양정보": {
                "칼로리": 0,
                "탄수화물": 0,
                "단백질": 0,
                "지방": 0
            },
            "주요영양소": ""
        }
    ],
    "영양분석": {
        "장점": [],
        "개선점": []
    },
    "권장사항": [],
    "식사시간": {
        "적합한시간": "",
        "조언": ""
    },
    "주의사항": ""
}

모든 분석은 업로드된 이미지만을 기반으로 하며, 정확한 개인별 권장량을 위해서는 사용자의 성별, 나이, 체중, 활동 수준 등의 추가 정보가 필요함을 명시하세요.

사용자의 질문이나 요청에 따라 위의 형식을 유연하게 조정하지 말고, 항상 이 JSON 구조를 유지하세요.
각 음식의 '예상양'은 그램(g) 단위로 제공하고, '영양정보'는 100g 당 영양소 함량을 나타냅니다.
`;


function encodeImageToBase64(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) reject(err);
            else resolve(data.toString('base64'));
        });
    });
}

function sanitizeJsonString(jsonString) {
    jsonString = jsonString.trim();
    jsonString = jsonString.replace(/,\s*([\]}])/g, '$1');
    const openBraces = (jsonString.match(/{/g) || []).length;
    const closeBraces = (jsonString.match(/}/g) || []).length;
    jsonString += '}}'.repeat(openBraces - closeBraces);
    return jsonString;
}

function parsePartialJson(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn("완전한 JSON 파싱 실패, 부분 파싱 시도:", error.message);
        const partialObject = {};
        jsonString.replace(/("[^"]+"):([^,}\]]+)/g, (match, key, value) => {
            try {
                partialObject[JSON.parse(key)] = JSON.parse(value);
            } catch (e) {
                partialObject[JSON.parse(key)] = value.trim();
            }
        });
        return partialObject;
    }
}

function getFallbackResponse(error, rawResponse) {
    return {
        error: "응답 파싱 중 오류가 발생했습니다.",
        message: error.message,
        rawResponse: rawResponse
    };
}

function enhancedLogging(message, data) {
    console.log(`[${new Date().toISOString()}] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

function isResponseComplete(response) {
    try {
        JSON.parse(response);
        return true;
    } catch (error) {
        return false;
    }
}

function findLastCompleteObject(incompleteJson) {
    let lastValidIndex = incompleteJson.lastIndexOf('}');
    if (lastValidIndex === -1) return '';
    let openBraces = 0;
    for (let i = 0; i <= lastValidIndex; i++) {
        if (incompleteJson[i] === '{') openBraces++;
        if (incompleteJson[i] === '}') openBraces--;
    }
    while (openBraces > 0 && lastValidIndex > 0) {
        lastValidIndex = incompleteJson.lastIndexOf('}', lastValidIndex - 1);
        openBraces--;
    }
    return incompleteJson.substring(0, lastValidIndex + 1);
}

function mergeAndParseResponses(responses) {
    let mergedResponse = responses.join('');
    mergedResponse = sanitizeJsonString(mergedResponse);
    let completeJson = findLastCompleteObject(mergedResponse);
    try {
        return JSON.parse(completeJson);
    } catch (error) {
        enhancedLogging("JSON 파싱 실패, 부분 파싱 시도", error);
        return parsePartialJson(completeJson);
    }
}

async function getGPTResponse(message, imageBase64) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
  }

  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  let messages = [
      { role: "system", content: basePrompt },
      { role: "user", content: message }
  ];
  if (imageBase64) {
      messages.push({
          role: "user",
          content: `Analyze this image: data:image/jpeg;base64,${imageBase64}`
      });
  }

  const payload = {
      model: imageBase64 ? "gpt-4o" : "gpt-4",
      messages: messages,
      max_tokens: 1000,
      response_format: { type: "json_object" }
  };

  let allResponses = []; // allResponses 변수를 최상위에 선언
  try {
      let isComplete = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!isComplete && retryCount < maxRetries) {
          try {
              const response = await axios.post(apiUrl, payload, {
                  headers: {
                      'Authorization': `Bearer ${apiKey}`,
                      'Content-Type': 'application/json'
                  },
                  timeout: 60000 // 60 seconds timeout
              });

              if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message) {
                  const content = response.data.choices[0].message.content;
                  allResponses.push(content);

                  if (isResponseComplete(content)) {
                      isComplete = true;
                  } else {
                      payload.messages.push({ role: "assistant", content: content });
                      payload.messages.push({ role: "user", content: "Please continue the previous response." });
                  }
              } else {
                  throw new Error('Invalid response structure from OpenAI API');
              }
          } catch (error) {
              enhancedLogging(`Attempt ${retryCount + 1} failed:`, error.message);
              retryCount++;
              if (retryCount >= maxRetries) {
                  throw error;
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
      }

      if (!isComplete) {
          throw new Error('Failed to get a complete response after maximum retries');
      }

      const parsedContent = mergeAndParseResponses(allResponses);
      enhancedLogging('Parsed GPT Response:', parsedContent);
      return parsedContent;
  } catch (error) {
      enhancedLogging('Failed to get GPT response:', error.response ? error.response.data : error.message);
      return getFallbackResponse(error, allResponses.join(''));
  }
}


function moveImageFile(imagePath) {
    const publicPath = path.join(__dirname, 'public', 'uploads', path.basename(imagePath));
    fs.renameSync(imagePath, publicPath);
    return `/uploads/${path.basename(imagePath)}`;
}














module.exports = router;