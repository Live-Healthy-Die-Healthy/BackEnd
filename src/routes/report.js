const express = require('express');
const axios = require('axios');
const router = express.Router();
const { parseISO, isValid } = require('date-fns');
const { User, AerobicExercise, AnaerobicExercise, ExerciseLog, ExerciseList, DietLogDetail, DietLog, DailyReport, MenuList, Sequelize, WeeklyReport, MonthlyReport, UserChanged } = require('../index');
const { Op } = Sequelize; // Op를 Sequelize에서 가져오기

const bodyParser = require('body-parser');

// 라우터 사용 시에도 동일하게 설정
router.use(express.urlencoded({    
  limit:"50mb",
  extended: true, // true로 변경
}));

router.use(express.json({   
  limit : "50mb"
}));

// 주의 시작일(월요일)을 구하는 함수
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

// 주간 평균값 계산
const calculateWeeklyAverages = async (userId, date) => {
  const startDate = getMonday(date);
  const endDate = getSunday(date);

  console.log("startDate: ", startDate);
  console.log("endDate: ", endDate);

  try {
    const dailyReports = await DailyReport.findAll({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const totalValues = dailyReports.reduce((acc, report) => {
      acc.totalCalories += report.totalCalories;
      acc.totalCarbo += report.totalCarbo;
      acc.totalProtein += report.totalProtein;
      acc.totalFat += report.totalFat;
      return acc;
    }, { totalCalories: 0, totalCarbo: 0, totalProtein: 0, totalFat: 0 });

    console.log("total cal: ",totalValues.totalCalories);
    console.log("total car: ",totalValues.totalCarbo);
    console.log("total pro: ",totalValues.totalProtein);
    console.log("total fat: ",totalValues.totalFat);

    const reportCount = dailyReports.length;
    const meanValues = {
      meanCalories: reportCount ? totalValues.totalCalories / reportCount : 0,
      meanCarbo: reportCount ? totalValues.totalCarbo / reportCount : 0,
      meanProtein: reportCount ? totalValues.totalProtein / reportCount : 0,
      meanFat: reportCount ? totalValues.totalFat / reportCount : 0
    };

    return meanValues;
  } catch (error) {
    console.error('Error calculating weekly averages:', error);
    throw error;
  }
};

// 월간 평균값 계산
const calculateMonthlyAverages = async (userId, date) => {
  const startDate = getFirstDayOfMonth(date);
  const endDate = getLastDayOfMonth(date);

  const dailyReports = await DailyReport.findAll({
    where: {
      userId: userId,
      date: {
        [Op.between]: [startDate, endDate]
      }
    }
  });

  if (dailyReports.length === 0) {
    return { meanCalories: 0, meanCarbo: 0, meanProtein: 0, meanFat: 0 };
  }

  const totalValues = dailyReports.reduce((acc, report) => {
    acc.totalCalories += report.totalCalories;
    acc.totalCarbo += report.totalCarbo;
    acc.totalProtein += report.totalProtein;
    acc.totalFat += report.totalFat;
    return acc;
  }, { totalCalories: 0, totalCarbo: 0, totalProtein: 0, totalFat: 0 });

  const reportCount = dailyReports.length;
  const meanValues = {
    meanCalories: reportCount ? totalValues.totalCalories / reportCount : 0,
    meanCarbo: reportCount ? totalValues.totalCarbo / reportCount : 0,
    meanProtein: reportCount ? totalValues.totalProtein / reportCount : 0,
    meanFat: reportCount ? totalValues.totalFat / reportCount : 0
  };

  return meanValues;
};


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

// 직전 월의 데이터를 가져오는 함수
const getPreviousMonthData = async (userId, date) => {
  const currentDate = new Date(date);
  const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

  const latestPreviousData = await UserChanged.findOne({
    where: {
      userId: userId,
      updatedAt: {
        [Op.between]: [previousMonthStart, previousMonthEnd]
      }
    },
    order: [['updatedAt', 'DESC']]
  });

  if (latestPreviousData) {
    return {
      userWeight: latestPreviousData.userWeight,
      userBodyFatPercentage: latestPreviousData.userBodyFatPercentage,
      userBmi: latestPreviousData.userBmi,
      userMuscleMass: latestPreviousData.userMuscleMass
    };
  } else {
    return {
      userWeight: 0,
      userBodyFatPercentage: 0,
      userBmi: 0,
      userMuscleMass: 0
    };
  }
};

// 변화를 계산하는 함수
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

// 일간 분석 수행
async function performDailyAnalysis(userId, date, dietData, userData, dailyAerobics, dailyAnaerobics) {
  const maxRetries = 3;
  let retryCount = 0;

  console.log("userGender: ", userData.userGender);
  console.log("userBirth: ", userData.userBirth);
  console.log("userWeight: ", userData.userWeight);

  while (retryCount < maxRetries) {
    console.log("retryCount: ", retryCount);
    try {
      const analysisResult = await getGPTDailyResponse(dietData, userData, dailyAerobics, dailyAnaerobics);

      
      // 응답 형식 검증
      if (typeof analysisResult !== 'object' || !analysisResult['식단 피드백'] || !analysisResult['운동 피드백']) {
        console.log("Invalid response format. Retrying...");
        retryCount++;
        continue;
      }

      const { isValid: isExerciseDataValid, maxSpeed, maxEndurance } = validateExerciseData(userData, dailyAerobics);

      // 운동 피드백 초기화
      let exerciseFeedback = analysisResult["운동 피드백"];

      if (!isExerciseDataValid) {
        // 유효하지 않은 경우 피드백 설정
        const invalidLog = dailyAerobics.find(log => {
          const speed = log.distance / (log.exerciseTime / 60);
          return log.exerciseTime > maxEndurance || speed > maxSpeed;
        });
      
        if (invalidLog) {
          const speed = invalidLog.distance / (invalidLog.exerciseTime / 60);
          console.log("speed: ", speed);
          exerciseFeedback = JSON.stringify({
            "운동 피드백": `비정상적인 데이터 감지! 속도(${speed.toFixed(2)} km/h) 또는 시간(${invalidLog.exerciseTime} 분)가 비정상적으로 높습니다.`
          });
      
          // JSON 문자열을 파싱하여 원하는 형식으로 저장
          const parsedFeedback = JSON.parse(exerciseFeedback);
          exerciseFeedback = `${parsedFeedback["운동 피드백"]}`;
        }
      }


      // DailyReport 생성
      const newDailyReport = await DailyReport.create({
        userId,
        date,
        totalCalories: dietData.totalCalories,
        totalCarbo: dietData.totalCarbo,
        totalProtein: dietData.totalProtein,
        totalFat: dietData.totalFat,
        dietFeedback: analysisResult["식단 피드백"],
        exerciseFeedback,
        anAeroInfo: dailyAnaerobics,
        aeroInfo: dailyAerobics,
        dietInfo: dietData,
        recommendedCal: userData.userRecommendedCal,
        breakfastLog: dietData.breakfastLog, // 아침 데이터 추가
        breakfastCal: dietData.breakfastCal, // 아침 칼로리 추가
        lunchLog: dietData.lunchLog,         // 점심 데이터 추가
        lunchCal: dietData.lunchCal,         // 점심 칼로리 추가
        dinnerLog: dietData.dinnerLog,       // 저녁 데이터 추가
        dinnerCal: dietData.dinnerCal,       // 저녁 칼로리 추가
        snackLog: dietData.snackLog,         // 간식 데이터 추가
        snackCal: dietData.snackCal,         // 간식 칼로리 추가
      });
      

      console.log(dailyAnaerobics);
      console.log(dailyAerobics);

      console.log("Feedback updated:", newDailyReport);

      return { status: 'completed', newDailyReport };

    } catch (error) {
      console.error('Error during analysis:', error);
      retryCount++;
      if (retryCount >= maxRetries) {
        throw new Error('Maximum retry attempts reached');
      }
    }
  }
}



// 주간 분석 수행
async function performWeeklyAnalysis(userId, date, dietData, userData, weeklyAerobics, weeklyAnaerobics, totalExerciseTime, aerobicRatio, anaerobicRatio) {
  const maxRetries = 3;
  let retryCount = 0;

  console.log("userGender: ", userData.userGender);
  console.log("userBirth: ", userData.userBirth);
  console.log("userWeight: ", userData.userWeight);

// aerobicRatio를 소수점 2째자리까지 반올림하고, NaN이 아닌지 확인
const roundedAerobicRatio = isNaN(aerobicRatio) ? 0 : Math.round(aerobicRatio * 100) / 100;

// anaerobicRatio의 각 값을 소수점 2째자리까지 반올림하고, NaN이 아닌지 확인
const roundedAnaerobicRatio = {};
for (const key in anaerobicRatio) {
  roundedAnaerobicRatio[key] = isNaN(anaerobicRatio[key]) ? 0 : Math.round(anaerobicRatio[key] * 100) / 100;
}
  while (retryCount < maxRetries) {
    console.log("retryCount: ", retryCount);
    try {
      const analysisResult = await getGPTWeeklyResponse(dietData, userData, weeklyAerobics, weeklyAnaerobics);

      
      // 응답 형식 검증
      if (typeof analysisResult !== 'object' || !analysisResult['식단 피드백'] || !analysisResult['운동 피드백']) {
        console.log("Invalid response format. Retrying...");
        retryCount++;
        continue;
      }

      const { meanCalories, meanCarbo, meanProtein, meanFat } = dietData;

      // WeeklyReport 생성
      const newWeeklyReport = await WeeklyReport.create(
        {
          userId,
          date,
          meanCalories,
          meanCarbo,
          meanProtein,
          meanFat,
          dietFeedback: analysisResult['식단 피드백'],
          exerciseFeedback: analysisResult['운동 피드백'],
          anAeroInfo: weeklyAnaerobics,  
          aeroInfo: weeklyAerobics,
          dietInfo: dietData,
          totalTraining: totalExerciseTime,
          aerobicRatio: roundedAerobicRatio, // 반올림된 값
          anaerobicRatio: roundedAnaerobicRatio // 반올림된 값
        }
      );
      

      console.log(weeklyAnaerobics);
      console.log(weeklyAerobics);

      console.log("Feedback updated:", newWeeklyReport);

      return { status: 'completed', newWeeklyReport };

    } catch (error) {
      console.error('Error during analysis:', error);
      retryCount++;
      if (retryCount >= maxRetries) {
        throw new Error('Maximum retry attempts reached');
      }
    }
  }
}

// 월간 분석 수행
async function performMonthlyAnalysis(userId, date, dietData, userData, monthlyAerobics, monthlyAnaerobics, changes) {
  const maxRetries = 3;
  let retryCount = 0;

  console.log("userGender: ", userData.userGender);
  console.log("userBirth: ", userData.userBirth);
  console.log("userWeight: ", userData.userWeight);

  while (retryCount < maxRetries) {
    console.log("retryCount: ", retryCount);
    try {
      const analysisResult = await getGPTmonthlyResponse(dietData, userData, monthlyAerobics, monthlyAnaerobics,);

      
      // 응답 형식 검증
      if (typeof analysisResult !== 'object' || !analysisResult['식단 피드백'] || !analysisResult['운동 피드백']) {
        console.log("Invalid response format. Retrying...");
        retryCount++;
        continue;
      }

      const { meanCalories, meanCarbo, meanProtein, meanFat } = dietData;

      // monthlyReport 생성
      const newMonthlyReport = await MonthlyReport.create(
        {
          userId,
          date,
          meanCalories,
          meanProtein,
          meanFat,
          meanCarbo,
          weeklyCal: dietData.weeklyCal,
          dietFeedback: analysisResult['식단 피드백'],
          exerciseFeedback: analysisResult['운동 피드백'],
          anAeroInfo: monthlyAnaerobics,  
          aeroInfo: monthlyAerobics,
          dietInfo: dietData,
          weightChangeRate: changes.weightChange,
          bodyFatChangeRate: parseFloat(changes.bodyFatChange.toFixed(1)),
          bmiChangeRate: changes.bmiChange,
          muscleMassChangeRate: changes.muscleMassChange,
        }
      );
      

      console.log(monthlyAnaerobics);
      console.log(monthlyAerobics);

      console.log("Feedback updated:", newMonthlyReport);

      return { status: 'completed', newMonthlyReport };

    } catch (error) {
      console.error('Error during analysis:', error);
      retryCount++;
      if (retryCount >= maxRetries) {
        throw new Error('Maximum retry attempts reached');
      }
    }
  }
}


// 일간 레포트 유무
router.post('/daily', async (req, res) => {
  const { userId, date } = req.body;

  try {
    const dietLogs = await DietLog.findAll({
      where: {
        userId: userId,
        dietDate: date,
        dietType: {
          [Op.in]: ['breakfast', 'lunch', 'dinner', 'snack']
        }
      }
    
    });

    const dietTypes = dietLogs.map(log => log.dietType);

    const requiredDietTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

    const isFilled = requiredDietTypes.every(type => dietTypes.includes(type));

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const dailyReport = await DailyReport.findOne({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const isValid = dailyReport ? true : false;

    res.status(200).json({ isFilled, isValid, dailyReport });
  } catch (error) {
    console.error('Error checking diet logs:', error);
    res.status(500).json({ message: 'Error checking diet logs', error: error.message });
  }
});


// 일간 레포트
router.post('/newDaily', async (req, res) => {
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

    // 사용자의 해당 날짜의 다이어트 로그 가져오기
    console.log("생성");
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

    console.log("Diet Logs: ", dietLogs);

    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealData = {
      breakfast: { log: [], cal: 0 },
      lunch: { log: [], cal: 0 },
      dinner: { log: [], cal: 0 },
      snack: { log: [], cal: 0 }
    };

    dietLogs.forEach(dietLog => {
      console.log("dietType: ", dietLog.dietType);
      const mealType = dietLog.dietType;
      dietLog.details.forEach(details => {
        const calories = details.quantity * details.menu.menuCalorie;
        mealData[mealType].log.push(details.menu.menuName);
        mealData[mealType].cal += calories;
      });
    });

    // 해당 날짜에 섭취한 총 칼로리 계산
    let totalCalories = 0;
    let totalCarbo = 0;
    let totalProtein = 0;
    let totalFat = 0;
    dietLogs.forEach(dietLog => {
      dietLog.details.forEach(details => {
        const calories = details.quantity * details.menu.menuCalorie;
        totalCalories += calories;
        totalCarbo += details.menu.menuCarbo * details.quantity;
        totalProtein += details.menu.menuProtein * details.quantity;
        totalFat += details.menu.menuFat * details.quantity;
      });
    });

    const dietData = {
      totalCalories,
      totalCarbo,
      totalProtein,
      totalFat,
      breakfastLog: mealData.breakfast.log,
      breakfastCal: mealData.breakfast.cal,
      lunchLog: mealData.lunch.log,
      lunchCal: mealData.lunch.cal,
      dinnerLog: mealData.dinner.log,
      dinnerCal: mealData.dinner.cal,
      snackLog: mealData.snack.log,
      snackCal: mealData.snack.cal,
    };

    

    // 사용자의 해당 날짜의 운동 로그 가져오기
    const exerciseLogs = await ExerciseLog.findAll({
      where: {
        userId: userId,
        exerciseDate: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    console.log("Exercise Logs: ", exerciseLogs);


    const dailyAerobics = [];
    const dailyAnaerobics = [];
    
    // 비동기 함수에서 전체 로직을 처리합니다.
    await Promise.all(exerciseLogs.map(async log => {
      if (log.exerciseType === 'AerobicExercise') {
        const aerobicExercises = await AerobicExercise.findAll({
          where: { exerciseLogId: log.exerciseLogId }
        });
    
        for (const aerobicExercise of aerobicExercises) {
          const dailyAerobic = {
            exerciseName: '',
            distance: 0,
            exerciseTime: 0,
          };
    
          // 해당 운동 로그에 맞는 운동 정보를 찾습니다.
          const exerciseInfo = await ExerciseList.findOne({
            where: { exerciseId: log.exerciseId }
          });
    
          if (exerciseInfo) {
            dailyAerobic.exerciseName = exerciseInfo.exerciseName;
          }
    
          if (aerobicExercise) {
            dailyAerobic.distance = aerobicExercise.distance;
            dailyAerobic.exerciseTime = aerobicExercise.exerciseTime;
          }
    
          dailyAerobics.push(dailyAerobic);
        }
    
      } else if (log.exerciseType === 'AnaerobicExercise') {
        const anaerobicExercises = await AnaerobicExercise.findAll({
          where: { exerciseLogId: log.exerciseLogId }
        });
    
        for (const anaerobicExercise of anaerobicExercises) {
          const dailyAnaerobic = {
            exerciseName: '',
            exercisePart: '',
            sets: 0,
            weight: [],
            repetitions: [],
            exerciseTime: 0,
          };
    
          // 해당 운동 로그에 맞는 운동 정보를 찾습니다.
          const exerciseInfo = await ExerciseList.findOne({
            where: { exerciseId: log.exerciseId }
          });
    
          if (exerciseInfo) {
            dailyAnaerobic.exerciseName = exerciseInfo.exerciseName;
            dailyAnaerobic.exercisePart = exerciseInfo.exercisePart;
          }
    
          if (anaerobicExercise) {
            dailyAnaerobic.sets = anaerobicExercise.set;
            dailyAnaerobic.weight = anaerobicExercise.weight;
            dailyAnaerobic.repetitions = anaerobicExercise.repetition;
            dailyAnaerobic.exerciseTime = anaerobicExercise.exerciseTime;
          }
    
          dailyAnaerobics.push(dailyAnaerobic);
        }
      }
    }));
    
    console.log("dailyAerobics: ", dailyAerobics);
    console.log("dailyAnaerobics: ", dailyAnaerobics);
    
    console.log("Total Calories: ", totalCalories);
    console.log("Total Carbo: ", totalCarbo);
    console.log("Total Protein: ", totalProtein);
    console.log("Total Fat: ", totalFat);

    const user = await User.findOne({
      where: { userId: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const userData = {
      userGender: user.userGender,
      userBirth: user.userBirth,
      userWeight: user.userWeight,
      userMuscleMass: user.userMuscleMass,
      userBmi: user.userBmi,
      userBodyFatPercentage: user.userBodyFatPercentage,
      userBmr: user.userBmr,
      userRecommendedCal: user.recommendedCal,
      userImage: user.userImage,
    };
    
    if (!user) {
      throw new Error('User not found');
    }
    

    const response = await performDailyAnalysis(userId, date, dietData, userData, dailyAerobics, dailyAnaerobics
    ); 

    res.status(200).json({ 
      breakfastLog: mealData.breakfast.log,
      breakfastCal: mealData.breakfast.cal,
      lunchLog: mealData.lunch.log,
      lunchCal: mealData.lunch.cal,
      dinnerLog: mealData.dinner.log,
      dinnerCal: mealData.dinner.cal,
      snackLog: mealData.snack.log,
      snackCal: mealData.snack.cal,
      totalCalories: response.newDailyReport.dataValues.totalCalories,
      dietFeedback: response.newDailyReport.dataValues.dietFeedback,
      exerciseFeedback: response.newDailyReport.dataValues.exerciseFeedback,
      totalCarbo: response.newDailyReport.dataValues.totalCarbo,
      totalProtein: response.newDailyReport.dataValues.totalProtein,
      totalFat: response.newDailyReport.dataValues.totalFat,
      recommendedCal: userData.userRecommendedCal,
      aeroInfo: dailyAerobics,
      anAeroInfo: dailyAnaerobics,
      userImage: user.userImage,
  });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 주간 레포트 유무
router.post('/weekly', async (req, res) => {
  const { userId, date } = req.body;

  try {
    const startDate = getMonday(date);
    const endDate = getSunday(date);

    const dietLogs = await DietLog.findAll({
      where: {
        userId: userId,
        dietDate: {
          [Op.between]: [startDate, endDate]
        },
        dietType: {
          [Op.in]: ['breackfast', 'lunch', 'dinner', 'snack']
        }
      }
    });

    const dietTypes = dietLogs.map(log => log.dietType);

    const requiredDietTypes = ['breackfast', 'lunch', 'dinner', 'snack'];
    const isFilled = requiredDietTypes.every(type => dietTypes.includes(type));

    // WeeklyReport가 존재하는지 확인합니다.
    const weeklyReport = await WeeklyReport.findOne({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const isValid = weeklyReport ? true : false;

    res.status(200).json({ isFilled, isValid, weeklyReport });
  } catch (error) {
    console.error('Error checking weekly diet logs:', error);
    res.status(500).json({ message: 'Error checking weekly diet logs', error: error.message });
  }
})

// 주간 레포트 생성
router.post('/newWeekly', async (req, res) => {
  const { userId, date } = req.body;

  try {
    // 입력된 date 값 디버깅
    console.log("Received date:", date);

    // date 문자열을 파싱하여 날짜 객체로 변환
    const inputDate = new Date(date);
    if (isNaN(inputDate.getTime())) {
      throw new Error("Invalid date format");
    }

    // 주의 시작(월요일) 계산
    const startDate = new Date(
      Date.UTC(
        inputDate.getFullYear(),
        inputDate.getMonth(),
        inputDate.getDate()
      )
    );
    const day = startDate.getUTCDay();
    const diff = startDate.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    startDate.setUTCDate(diff);
    startDate.setUTCHours(0, 0, 0, 0);

    // 주의 끝(일요일) 계산
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 6);
    endDate.setUTCHours(23, 59, 59, 999);

    // 시작일부터 끝일까지의 날짜 배열을 만듭니다.
    const currentDate = new Date(startDate);
    const dates = [];
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log("Start Date: ", startDate);
    console.log("End Date: ", endDate);

    // 해당 날짜에 이미 WeeklyReport가 있는지 확인
    const existingReport = await WeeklyReport.findOne({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    if (existingReport) {
      console.log("존재!");
      // 이미 존재하는 WeeklyReport가 있으면 해당 데이터를 반환
      existingReport.date = startDate; // 수정된 부분: 응답에 달의 첫 날을 포함하도록 설정
      return res.status(200).json(existingReport);
    }

    // 사용자의 해당 주의 DailyReport 찾기
    const dailyReports = await DailyReport.findAll({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    const weeklyCal = [];

    // 일간 보고서 데이터가 있는 날짜와 없는 날짜를 확인하고, 없는 날짜에는 0을 추가합니다.
    dates.forEach((date) => {
      const report = dailyReports.find(
        (report) => new Date(report.date).toDateString() === date.toDateString()
      );
      if (report) {
        weeklyCal.push(report.totalCalories);
      } else {
        weeklyCal.push(0);
      }
    });

    console.log("Weekly Calories: ", weeklyCal);

    const weeklyAnaerobics = [];
    const weeklyAerobics = [];

    dailyReports.forEach((report) => {
      if (Array.isArray(report.anAeroInfo)) {
        weeklyAnaerobics.push(...report.anAeroInfo);
      }
    });
    dailyReports.forEach((report) => {
      if (Array.isArray(report.aeroInfo)) {
        weeklyAerobics.push(...report.aeroInfo);
      }
    });

    // 유산소 운동과 근력 운동 시간을 저장할 변수
    let totalAerobicTime = 0;
    let totalAnaerobicTime = {
      chest: 0,
      arm: 0, // 팔
      core: 0, // 코어
      shoulder: 0, // 어깨
      back: 0,
      leg: 0,
    };

    // 유산소 운동 시간 계산
    weeklyAerobics.forEach((exercise) => {
      totalAerobicTime += exercise.exerciseTime;
    });

    // 근력 운동 시간 계산 (부위별로)
    weeklyAnaerobics.forEach((exercise) => {
      const exercisePart = exercise.exercisePart.toLowerCase(); // 소문자로 변환하여 부위 비교
      if (totalAnaerobicTime.hasOwnProperty(exercisePart)) {
        totalAnaerobicTime[exercisePart] += exercise.exerciseTime;
      }
    });

    // 전체 근력 운동 시간 계산
    const totalAnaerobicTimeSum = Object.values(totalAnaerobicTime).reduce(
      (sum, time) => sum + time,
      0
    );
    const totalExerciseTime = totalAerobicTime + totalAnaerobicTimeSum;

    // 비율 계산
    const aerobicRatio = totalExerciseTime > 0 ? Math.round((totalAerobicTime / totalExerciseTime) * 10000) / 100 : 0;
    const anaerobicRatio = {
      chest: totalExerciseTime > 0 ? Math.round((totalAnaerobicTime.chest / totalExerciseTime) * 10000) / 100 : 0,
      arm: totalExerciseTime > 0 ? Math.round((totalAnaerobicTime.arm / totalExerciseTime) * 10000) / 100 : 0, // 팔
      core: totalExerciseTime > 0 ? Math.round((totalAnaerobicTime.core / totalExerciseTime) * 10000) / 100 : 0, // 코어
      shoulder: totalExerciseTime > 0 ? Math.round((totalAnaerobicTime.shoulder / totalExerciseTime) * 10000) / 100 : 0, // 어깨
      back: totalExerciseTime > 0 ? Math.round((totalAnaerobicTime.back / totalExerciseTime) * 10000) / 100 : 0,
      leg: totalExerciseTime > 0 ? Math.round((totalAnaerobicTime.leg / totalExerciseTime) * 10000) / 100 : 0,
    };
    // 결과 출력 (디버깅용)
    console.log("Aerobic Ratio: ", aerobicRatio);
    console.log("Anaerobic Ratio: ", anaerobicRatio);

    const meanValues = await calculateWeeklyAverages(userId, date);

    // 객체에서 값 추출
    const { meanCalories, meanCarbo, meanProtein, meanFat } = meanValues;

    // 여기서 meanCalories, meanCarbo, meanProtein, meanFat 변수를 필요에 맞게 사용
    console.log("Mean Calories:", meanCalories);
    console.log("Mean Carbohydrates:", meanCarbo);
    console.log("Mean Protein:", meanProtein);
    console.log("Mean Fat:", meanFat);

    const dietData = {
      meanCalories,
      meanCarbo,
      meanProtein,
      meanFat,
      weeklyCal,
    };

    const user = await User.findOne({
      where: { userId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const userData = {
      userGender: user.userGender,
      userBirth: user.userBirth,
      userWeight: user.userWeight,
      userMuscleMass: user.userMuscleMass,
      userBmi: user.userBmi,
      userBodyFatPercentage: user.userBodyFatPercentage,
      userBmr: user.userBmr,
      userImage: user.userImage,
    };

    console.log("Daily Reports: ", dailyReports);

    const response = await performWeeklyAnalysis(
      userId,
      date,
      dietData,
      userData,
      weeklyAerobics,
      weeklyAnaerobics,
      totalExerciseTime,
      aerobicRatio,
      anaerobicRatio
    );

    // 응답에서 주의 첫 날인 월요일 날짜를 포함
    res.status(200).json({
      meanCalories: response.newWeeklyReport.dataValues.meanCalories,
      dietFeedback: response.newWeeklyReport.dataValues.dietFeedback,
      exerciseFeedback: response.newWeeklyReport.dataValues.exerciseFeedback,
      meanCarbo: response.newWeeklyReport.dataValues.meanCarbo,
      meanProtein: response.newWeeklyReport.dataValues.meanProtein,
      meanFat: response.newWeeklyReport.dataValues.meanFat,
      weeklyCal: weeklyCal,
      totalTraining: totalExerciseTime,
      anaerobicRatio: anaerobicRatio,
      aerobicRatio: aerobicRatio,
      userImage: user.userImage,
    });
  } catch (error) {
    console.error('Error retrieving weekly report:', error);
    res.status(500).json({ message: 'Error retrieving weekly report', error: error.message });
  }
});


// 월간 레포트 유무
router.post('/monthly', async (req, res) => {
  const { userId, date } = req.body;

  try {
    const startDate = getFirstDayOfMonth(date);
    const endDate = getLastDayOfMonth(date);

    const dietLogs = await DietLog.findAll({
      where: {
        userId: userId,
        dietDate: {
          [Op.between]: [startDate, endDate]
        },
        dietType: {
          [Op.in]: ['breackfast', 'lunch', 'dinner', 'snack']
        }
      }
    });

    const dietTypes = dietLogs.map(log => log.dietType);

    const requiredDietTypes = ['breackfast', 'lunch', 'dinner', 'snack'];
    const isFilled = requiredDietTypes.every(type => dietTypes.includes(type));

    // MonthlyReport가 존재하는지 확인합니다.
    const monthlyReport = await MonthlyReport.findOne({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const isValid = monthlyReport ? true : false;

    res.status(200).json({ isFilled, isValid, monthlyReport });
  } catch (error) {
    console.error('Error checking monthly diet logs:', error);
    res.status(500).json({ message: 'Error checking monthly diet logs', error: error.message });
  }
});

// 월간 레포트 생성
router.post('/newMonthly', async (req, res) => {
  const { userId, date } = req.body;

  try {
    const inputDate = new Date(date);
    if (isNaN(inputDate)) {
      throw new Error('Invalid date format');
    }

    const startDate = getFirstDayOfMonth(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = getLastDayOfMonth(date);
    endDate.setUTCHours(23, 59, 59, 999);

    console.log("Start Date: ", startDate);
    console.log("End Date: ", endDate);

    // 사용자의 해당 달의 DailyReport 찾기
    const dailyReports = await DailyReport.findAll({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    //if (dailyReports.length === 0) {
    //  return res.status(400).json({ message: 'No daily reports found for this month' });
    //}

    const monthlyAnaerobics = [];
    const monthlyAerobics = [];

    dailyReports.forEach(report => {
      if (Array.isArray(report.anAeroInfo)) {
        monthlyAnaerobics.push(...report.anAeroInfo);
      }
      if (Array.isArray(report.aeroInfo)) {
        monthlyAerobics.push(...report.aeroInfo);
      }
    });

    let totalExerciseTime = 0;
    monthlyAnaerobics.forEach(exercise => {
      totalExerciseTime += exercise.exerciseTime;
    });
    monthlyAerobics.forEach(exercise => {
      totalExerciseTime += exercise.exerciseTime;
    });

    console.log("Total Exercise Time: ", totalExerciseTime);

    const meanValues = await calculateMonthlyAverages(userId, date);
    const { meanCalories, meanCarbo, meanProtein, meanFat } = meanValues;

    const dietData = {
      meanCalories: parseFloat(meanCalories.toFixed(1)),
      meanCarbo: parseFloat(meanCarbo.toFixed(1)),
      meanProtein: parseFloat(meanProtein.toFixed(1)),
      meanFat: parseFloat(meanFat.toFixed(1))
    };

    const user = await User.findOne({
      where: { userId: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userData = {
      userGender: user.userGender,
      userBirth: user.userBirth,
      userWeight: user.userWeight,
      userMuscleMass: user.userMuscleMass,
      userBmi: user.userBmi,
      userBodyFatPercentage: user.userBodyFatPercentage,
      userBmr: user.userBmr,
      userImage: user.userImage,
    };

    const previousMonthData = await getPreviousMonthData(userId, date);
    const changes = calculateChanges(previousMonthData, userData);

    const response = await performMonthlyAnalysis(userId, date, dietData, userData, monthlyAerobics, monthlyAnaerobics, changes);

    res.status(200).json({
      meanCalories: parseFloat(meanCalories.toFixed(1)),
      dietFeedback: response.newMonthlyReport.dataValues.dietFeedback,
      exerciseFeedback: response.newMonthlyReport.dataValues.exerciseFeedback,
      meanCarbo: parseFloat(meanCarbo.toFixed(1)),
      meanProtein: parseFloat(meanProtein.toFixed(1)),
      meanFat: parseFloat(meanFat.toFixed(1)),
      weightChangeRate: parseFloat(changes.weightChange.toFixed(1)),
      bodyFatChangeRate: parseFloat(changes.bodyFatChange.toFixed(1)),
      bmiChangeRate: parseFloat(changes.bmiChange.toFixed(1)),
      muscleMassChangeRate: parseFloat(changes.muscleMassChange.toFixed(1)),
      totalExerciseTime: parseFloat(totalExerciseTime.toFixed(1)),
      userImage: user.userImage,
    });
  } catch (error) {
    console.error('Error retrieving monthly report:', error);
    res.status(500).json({ message: 'Error retrieving monthly report', error: error.message });
  }
});


router.post('/dailyReportDate', async (req, res) => {
  const { userId, month } = req.body;
  
  console.log('userId:', userId);
  console.log('month:', month);
  
  try {
    const startDate = new Date(month);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    console.log('startDate:', startDate);
    console.log('endDate:', endDate);

    const dailyReports = await DailyReport.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['date'],
      order: [['date', 'ASC']]
    });

    const reportDates = dailyReports.map(report => report.date.toISOString().split('T')[0]);

    console.log('Report Dates:', reportDates);

    res.status(200).json({ date: reportDates });
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; 
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

router.post('/weeklyReportDate', async (req, res) => {
  const { userId, month } = req.body;

  console.log('userId:', userId);
  console.log('month:', month);

  try {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    console.log('startDate:', startDate);
    console.log('endDate:', endDate);

    const dailyReports = await WeeklyReport.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['date'],
      order: [['date', 'ASC']]
    });

    const weeklyReportDates = dailyReports.reduce((acc, report) => {
      const date = new Date(report.date);
      const week = getWeekNumber(date);
      const weekKey = `${date.getUTCFullYear()}-W${week < 10 ? '0' : ''}${week}`;

      if (!acc[weekKey]) {
        acc[weekKey] = report.date.toISOString().split('T')[0];
      }
      return acc;
    }, {});

    const reportDates = Object.values(weeklyReportDates);

    console.log('Report Dates:', reportDates);

    res.status(200).json({ date: reportDates });
  } catch (error) {
    console.error('Error fetching weekly reports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/monthlyReportDate', async (req, res) => {
  const { userId, year } = req.body;
  
  console.log('userId:', userId);
  console.log('year:', year);
  
  try {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    console.log('startDate:', startDate);
    console.log('endDate:', endDate);

    const dailyReports = await MonthlyReport.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['date'],
      order: [['date', 'ASC']]
    });

    const monthlyReportDates = dailyReports.reduce((acc, report) => {
      const month = report.date.toISOString().split('T')[0].substring(0, 7); // Extract 'YYYY-MM'
      if (!acc.includes(month)) {
        acc.push(month);
      }
      return acc;
    }, []);

    console.log('Monthly Report Dates:', monthlyReportDates);

    res.status(200).json({ dates: monthlyReportDates });
  } catch (error) {
    console.error('Error fetching monthly reports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GPT 일간 응답 생성
async function getGPTDailyResponse(dietData, userData, dailyAerobics, dailyAnaerobics) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
  }

  const apiUrl = 'https://api.openai.com/v1/chat/completions';


  const dailyBasePrompt = `
You are an AI specializing in nutrition, food, and exercise analysis. Analyze the report data provided and give a structured summary in the following JSON format:

{
    "식단 피드백": "",
    "운동 피드백": ""
}

Base all analyses on the provided reportData without altering the JSON structure.

reportData will include the following information:

1. User's birth date (age), gender, and weight to provide daily total calorie, protein, and carb intake feedback.
2. Muscle mass, BMI, body fat percentage, and BMR if available.
3. User's daily aerobic and anaerobic exercise data, considering gender and weight.

Instructions:

- If only one type of exercise data (aerobic or anaerobic) is available, provide feedback based on the available data.
- If no exercise data is provided, give brief exercise advice.
- Summarize each feedback within 500 characters.
- Use the following writing style: Informal, Friendly, and Humorous.
- Write in Korean.
  
  Guidelines for feedback:
  - 식단 피드백: 사용자의 성별, 나이, 체중을 고려하여 하루 권장 칼로리, 단백질, 탄수화물 섭취량을 평가하고, 현재 섭취량과 비교하여 조언합니다.
  - 운동 피드백: 사용자의 성별, 체중, 제공된 유산소 및 무산소 운동 데이터를 바탕으로 운동량을 평가하고, 부족하거나 과도한 부분에 대해 조언합니다.
  
  Example feedback:
  {
      "식단 피드백": "오늘 왜이리 많이먹었어!! 이 돼지야! 탄수화물좀 줄이고 단백질 섭취는 아주 훌륭해ㅎ!",
      "운동 피드백": "유산소 운동이 부족해!!. 내일은 30분 정도 가볍게 조깅해보쟈~~ 근력 운동은 아주 잘하고있군 ㅎㅎ! 
      오늘은 가슴, 등 위주로 했으니 내일은 하체, 어깨를 해보는게 어때?"
  }
  
  reportData:
  `;

const reportData = 
{
    // Diet data
    "총 칼로리 섭취량": dietData.totalCalories,
    "총 단백질 섭취량": dietData.totalProtein,
    "총 탄수화물 섭취량": dietData.totalCarbo,
    "총 지방 섭취량": dietData.totalFat,
    "아침 식사 로그": dietData.breakfastLog,
    "아침 식사 칼로리": dietData.breakfastCal,
    "점심 식사 로그": dietData.lunchLog,
    "점심 식사 칼로리": dietData.lunchCal,
    "저녁 식사 로그": dietData.dinnerLog,
    "저녁 식사 칼로리": dietData.dinnerCal,
    "간식 로그": dietData.snackLog,
    "간식 칼로리": dietData.snackCal,

    // User data
    "사용자 성별": userData.userGender,
    "사용자 생년월일": userData.userBirth,
    "사용자 체중": userData.userWeight,
    "사용자 골격근량": userData.userMuscleMass,
    "사용자 BMI": userData.userBmi,
    "사용자 체지방률": userData.userBodyFatPercentage,
    "사용자 기초대사량": userData.userBmr,
    "사용자 권장 칼로리": userData.userRecommendedCal,

    // Exercise data
    "일간 유산소 운동 정보": JSON.stringify(dailyAerobics),
    "일간 무산소 운동 정보": JSON.stringify(dailyAnaerobics)
};

const payload = {
  model: "gpt-4o",
  messages: [
    { role: "system", content: dailyBasePrompt },
    { role: "user", content: JSON.stringify(reportData) }
  ],
  max_tokens: 1000,
  response_format: { type: "json_object" }
};

console.log("payload : ", payload);

  let allResponses = [];

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

      const sanitizedResponse = sanitizeJsonString(allResponses.join(''));
      const parsedContent = parsePartialJson(sanitizedResponse);
      enhancedLogging('Parsed GPT Response:', parsedContent);
      return parsedContent;
  } catch (error) {
    enhancedLogging('Failed to get GPT response:', error.response ? error.response.data : error.message);

    // JSON 오류 발생 시 재요청 시도
    if (error.message.includes('JSON') || error.message.includes('유효한 JSON 객체가 아님')) {
        console.log('JSON 오류 발생, 재요청 시도 중...');
        try {
            let retryResponse = await axios.post(apiUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            });
            const retryContent = retryResponse.data.choices[0].message.content;
            return mergeAndParseResponses([retryContent]);
        } catch (retryError) {
            enhancedLogging('재요청 실패:', retryError.message);
        }
    }

    return getFallbackResponse(error, allResponses.join(''));
  }
}

// GPT 주간 응답 생성
async function getGPTWeeklyResponse(dietData, userData, dailyAerobics, dailyAnaerobics) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
  }

  const apiUrl = 'https://api.openai.com/v1/chat/completions';


  const dailyWeeklyPrompt = `
You are an AI specializing in nutrition, food, and exercise analysis. Analyze the report data and provide a structured summary in the following JSON format:

{
    "식단 피드백": "",
    "운동 피드백": ""
}

You will provide weekly feedback on diet and exercise.

Given the user's info, weekly diet, and exercise data, provide feedback based on reportData. Do not alter the JSON structure.

reportData:

Include muscle mass, BMI, body fat percentage, and BMR if available; otherwise, provide feedback without them.

Consider user's birth date (age), gender, and weight to give daily total calorie, protein, and carb intake feedback.

Provide feedback based on the user's weekly aerobic and anaerobic exercise data, considering gender and weight.

If there's only aerobic or anaerobic exercise data, give feedback based on the available data. If no exercise data, provide brief exercise advice.

Summarize each feedback within 300 characters.

you must following writing style and use Korean!

writing style: Informal, Friendly, Humorous
`;

const reportData = {
  "사용자 성별": userData.userGender,
  "사용자 생년월일": userData.userBirth,
  "사용자 체중": userData.userWeight,
  "사용자 골격근량": userData.userMuscleMass,
  "사용자 BMI": userData.userBmi,
  "사용자 체지방률": userData.userBodyFatPercentage,
  "사용자 기초대사량": userData.userBmr,
  "주간 식단 정보": dietData,
  "일간 유산소 운동 정보": dailyAerobics,
  "일간 무산소 운동 정보": dailyAnaerobics
};

const payload = {
  model: "gpt-4o",
  messages: [
    { role: "system", content: dailyWeeklyPrompt },
    { role: "user", content: JSON.stringify(reportData) }
  ],
  max_tokens: 1000,
  response_format: { type: "json_object" }
};

  let allResponses = [];

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
                  timeout: 30000 // 60 seconds timeout
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

      const sanitizedResponse = sanitizeJsonString(allResponses.join(''));
      const parsedContent = parsePartialJson(sanitizedResponse);
      enhancedLogging('Parsed GPT Response:', parsedContent);
      return parsedContent;
  } catch (error) {
    enhancedLogging('Failed to get GPT response:', error.response ? error.response.data : error.message);

    // JSON 오류 발생 시 재요청 시도
    if (error.message.includes('JSON') || error.message.includes('유효한 JSON 객체가 아님')) {
        console.log('JSON 오류 발생, 재요청 시도 중...');
        try {
            let retryResponse = await axios.post(apiUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            });
            const retryContent = retryResponse.data.choices[0].message.content;
            return mergeAndParseResponses([retryContent]);
        } catch (retryError) {
            enhancedLogging('재요청 실패:', retryError.message);
        }
    }

    return getFallbackResponse(error, allResponses.join(''));
  }
}

// GPT 월간 응답 생성
async function getGPTmonthlyResponse(dietData, userData, dailyAerobics, dailyAnaerobics) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
  }

  const apiUrl = 'https://api.openai.com/v1/chat/completions';


  const dailymonthlyPrompt = `
You are an AI specializing in nutrition, food, and exercise analysis. Analyze the report data and provide a structured summary in the following JSON format:

{
    "식단 피드백": "",
    "운동 피드백": ""
}

You will provide monthly feedback on diet and exercise.

Given the user's info, monthly diet, and exercise data, provide feedback based on reportData. Do not alter the JSON structure.

reportData:

Include muscle mass, BMI, body fat percentage, and BMR if available; otherwise, provide feedback without them.

Consider user's birth date (age), gender, and weight to give daily total calorie, protein, and carb intake feedback.

Provide feedback based on the user's monthly aerobic and anaerobic exercise data, considering gender and weight.

If there's only aerobic or anaerobic exercise data, give feedback based on the available data. If no exercise data, provide brief exercise advice.

Summarize each feedback within 300 characters.

you must following writing style and use Korean!

writing style: Informal, Friendly, Humorous
`;

const reportData = {
  "사용자 성별": userData.userGender,
  "사용자 생년월일": userData.userBirth,
  "사용자 체중": userData.userWeight,
  "사용자 골격근량": userData.userMuscleMass,
  "사용자 BMI": userData.userBmi,
  "사용자 체지방률": userData.userBodyFatPercentage,
  "사용자 기초대사량": userData.userBmr,
  "주간 식단 정보": dietData,
  "일간 유산소 운동 정보": dailyAerobics,
  "일간 무산소 운동 정보": dailyAnaerobics
};

const payload = {
  model: "gpt-4o",
  messages: [
    { role: "system", content: dailymonthlyPrompt },
    { role: "user", content: JSON.stringify(reportData) }
  ],
  max_tokens: 1000,
  response_format: { type: "json_object" }
};

  let allResponses = [];

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
                  timeout: 30000 // 60 seconds timeout
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

      const sanitizedResponse = sanitizeJsonString(allResponses.join(''));
      const parsedContent = parsePartialJson(sanitizedResponse);
      enhancedLogging('Parsed GPT Response:', parsedContent);
      return parsedContent;
  } catch (error) {
    enhancedLogging('Failed to get GPT response:', error.response ? error.response.data : error.message);

    // JSON 오류 발생 시 재요청 시도
    if (error.message.includes('JSON') || error.message.includes('유효한 JSON 객체가 아님')) {
        console.log('JSON 오류 발생, 재요청 시도 중...');
        try {
            let retryResponse = await axios.post(apiUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            });
            const retryContent = retryResponse.data.choices[0].message.content;
            return mergeAndParseResponses([retryContent]);
        } catch (retryError) {
            enhancedLogging('재요청 실패:', retryError.message);
        }
    }

    return getFallbackResponse(error, allResponses.join(''));
  }
}

function calculateMaxSpeedAndEnduranceJogging(user) {
  const { userBirth, userWeight, userGender, userRecommendedCal, userBmi, restingHR = 70 } = user;

  // 생년월일을 바탕으로 나이 계산
  const birthDate = new Date(userBirth);
  const ageDiffMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDiffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  console.log("userData: ", age, userWeight, userGender, userRecommendedCal, restingHR);

  // 최대 심박수 (HRmax)
  const maxHR = 220 - age;

  // VO2 Max 계산 (간단한 추정 공식 사용)
  const vo2Max = 15.3 * (maxHR / restingHR);

  // 최대 MET 값 추정 (VO2 Max의 80% 사용)
  const maxMET = vo2Max * 0.8 / 3.5;

  // 기본 최대 속도와 지구력
  let maxSpeed = 10; // 기본 최대 속도 (km/h)
  let maxEndurance = 60; // 기본 최대 지구력 (분)

  // 나이에 따른 조정
  if (age < 30) {
    maxSpeed += 2;
    maxEndurance += 20;
  } else if (age > 50) {
    maxSpeed -= 2;
    maxEndurance -= 20;
  }

  // 성별에 따른 조정
  if (userGender === 'female') {
    maxSpeed -= 1.5;
    maxEndurance -= 10;
  }

  // BMI에 따른 조정
  if (userBmi > 25) {
    maxSpeed -= 1.5;
    maxEndurance -= 10;
  } else if (userBmi < 18.5) {
    maxSpeed -= 1;
    maxEndurance -= 10;
  }

  // 권장 칼로리에 따른 조정
  if (userRecommendedCal < 1800) {
    maxSpeed -= 1;
    maxEndurance -= 10;
  } else if (userRecommendedCal > 2500) {
    maxSpeed += 1;
    maxEndurance += 10;
  }

  // MET를 사용한 조정
  const maxPossibleSpeed = maxMET * 3.5 * (userWeight / 200); // 단위: km/h
  maxSpeed = Math.min(maxSpeed, maxPossibleSpeed) * 1.3;

  // 최종적으로 최대 지속 시간 계산
  maxEndurance = maxMET * 10 *1.3; // 단위: 분

  return { maxSpeed, maxEndurance };
}

function calculateMaxSpeedAndEnduranceWalking(user) {
  const { userBirth, userWeight, userGender, userRecommendedCal, userBmi, restingHR = 70 } = user;

  // 생년월일을 바탕으로 나이 계산
  const birthDate = new Date(userBirth);
  const ageDiffMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDiffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  console.log("userData: ", age, userWeight, userGender, userRecommendedCal, restingHR);

  // 최대 심박수 (HRmax)
  const maxHR = 220 - age;

  // VO2 Max 계산 (간단한 추정 공식 사용)
  const vo2Max = 15.3 * (maxHR / restingHR);

  // 최대 MET 값 추정 (VO2 Max의 80% 사용)
  const maxMET = vo2Max * 0.8 / 3.5;

  // 최대 속도와 지구력 기본값
  let maxSpeed = 6; // 기본 최대 속도 (km/h)
  let maxEndurance = 120; // 기본 최대 지구력 (분)

  // 나이에 따른 조정
  if (age < 30) {
    maxSpeed += 1;
    maxEndurance += 30;
  } else if (age > 50) {
    maxSpeed -= 1;
    maxEndurance -= 30;
  }

  // 성별에 따른 조정
  if (userGender === 'female') {
    maxSpeed -= 0.5;
    maxEndurance -= 15;
  }

  // BMI에 따른 조정
  if (userBmi > 25) {
    maxSpeed -= 0.5;
    maxEndurance -= 15;
  } else if (userBmi < 18.5) {
    maxSpeed -= 0.5;
    maxEndurance -= 15;
  }

  // 권장 칼로리에 따른 조정
  if (userRecommendedCal < 1800) {
    maxSpeed -= 0.5;
    maxEndurance -= 15;
  } else if (userRecommendedCal > 2500) {
    maxSpeed += 0.5;
    maxEndurance += 15;
  }

  // MET를 사용한 조정
  const maxPossibleSpeed = maxMET * 3.5 * (userWeight / 300); // 단위: km/h
  maxSpeed = Math.min(maxSpeed, maxPossibleSpeed) * 1.3;

  // 최종적으로 최대 지속 시간 계산
  maxEndurance = maxMET * 20 * 1.3; // 단위: 분

  return { maxSpeed, maxEndurance };
}

function calculateMaxSpeedAndEnduranceCycling(user) {
  const { userBirth, userWeight, userGender, userRecommendedCal, userBmi, restingHR = 70 } = user;

  // 생년월일을 바탕으로 나이 계산
  const birthDate = new Date(userBirth);
  const ageDiffMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDiffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  console.log("userData: ", age, userWeight, userGender, userRecommendedCal, restingHR);

  // 최대 심박수 (HRmax)
  const maxHR = 220 - age;

  // VO2 Max 계산 (간단한 추정 공식 사용)
  const vo2Max = 15.3 * (maxHR / restingHR);

  // 최대 MET 값 추정 (VO2 Max의 80% 사용)
  const maxMET = vo2Max * 0.8 / 3.5;

  // 최대 속도와 지구력 기본값
  let maxSpeed = 25; // 기본 최대 속도 (km/h)
  let maxEndurance = 90; // 기본 최대 지구력 (분)

  // 나이에 따른 조정
  if (age < 30) {
    maxSpeed += 5;
    maxEndurance += 30;
  } else if (age > 50) {
    maxSpeed -= 5;
    maxEndurance -= 30;
  }

  // 성별에 따른 조정
  if (userGender === 'female') {
    maxSpeed -= 2.5;
    maxEndurance -= 20;
  }

  // BMI에 따른 조정
  if (userBmi > 25) {
    maxSpeed -= 2.5;
    maxEndurance -= 20;
  } else if (userBmi < 18.5) {
    maxSpeed -= 2.5;
    maxEndurance -= 20;
  }

  // 권장 칼로리에 따른 조정
  if (userRecommendedCal < 1800) {
    maxSpeed -= 2;
    maxEndurance -= 20;
  } else if (userRecommendedCal > 2500) {
    maxSpeed += 2;
    maxEndurance += 20;
  }

  // MET를 사용한 조정
  const maxPossibleSpeed = maxMET * 3.5 * (userWeight / 100); // 단위: km/h
  maxSpeed = Math.min(maxSpeed, maxPossibleSpeed) * 1.3;

  // 최종적으로 최대 지속 시간 계산
  maxEndurance = maxMET * 10 * 1.3; // 단위: 분

  return { maxSpeed, maxEndurance };
}

function calculateMaxSpeedAndEnduranceSwimming(user) {
  const { userBirth, userWeight, userGender, userRecommendedCal, userBmi, restingHR = 70 } = user;

  // 생년월일을 바탕으로 나이 계산
  const birthDate = new Date(userBirth);
  const ageDiffMs = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDiffMs);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  console.log("userData: ", age, userWeight, userGender, userRecommendedCal, restingHR);

  // 최대 심박수 (HRmax)
  const maxHR = 220 - age;

  // VO2 Max 계산 (간단한 추정 공식 사용)
  const vo2Max = 15.3 * (maxHR / restingHR);

  // 최대 MET 값 추정 (VO2 Max의 80% 사용)
  const maxMET = vo2Max * 0.8 / 3.5;

  // 최대 속도와 지구력 기본값
  let maxSpeed = 4; // 기본 최대 속도 (km/h)
  let maxEndurance = 45; // 기본 최대 지구력 (분)

  // 나이에 따른 조정
  if (age < 30) {
    maxSpeed += 1;
    maxEndurance += 15;
  } else if (age > 50) {
    maxSpeed -= 1;
    maxEndurance -= 15;
  }

  // 성별에 따른 조정
  if (userGender === 'female') {
    maxSpeed -= 0.5;
    maxEndurance -= 10;
  }

  // BMI에 따른 조정
  if (userBmi > 25) {
    maxSpeed -= 0.5;
    maxEndurance -= 10;
  } else if (userBmi < 18.5) {
    maxSpeed -= 0.5;
    maxEndurance -= 10;
  }

  // 권장 칼로리에 따른 조정
  if (userRecommendedCal < 1800) {
    maxSpeed -= 0.5;
    maxEndurance -= 10;
  } else if (userRecommendedCal > 2500) {
    maxSpeed += 0.5;
    maxEndurance += 10;
  }

  // MET를 사용한 조정
  const maxPossibleSpeed = maxMET * 3.5 * (userWeight / 400); // 단위: km/h
  maxSpeed = Math.min(maxSpeed, maxPossibleSpeed) * 1.3;

  // 최종적으로 최대 지속 시간 계산
  maxEndurance = maxMET * 5 * 1.3; // 단위: 분

  return { maxSpeed , maxEndurance };
}

// 유효성 검사 함수
function validateExerciseData(user, exerciseLogs) {
  let maxSpeed, maxEndurance;

  if (exerciseLogs.length > 0) {
    const isValid = exerciseLogs.every(log => {
      switch (log.exerciseName) {
        case '조깅':
          ({ maxSpeed, maxEndurance } = calculateMaxSpeedAndEnduranceJogging(user));
          break;
        case '걷기':
          ({ maxSpeed, maxEndurance } = calculateMaxSpeedAndEnduranceWalking(user));
          break;
        case '사이클':
          ({ maxSpeed, maxEndurance } = calculateMaxSpeedAndEnduranceCycling(user));
          break;
        case '수영':
          ({ maxSpeed, maxEndurance } = calculateMaxSpeedAndEnduranceSwimming(user));
          break;
        default:
          throw new Error(`Unsupported exercise type: ${log.exerciseName}`);
      }

      console.log("maxSpeed: ", maxSpeed, " maxEndurance: ", maxEndurance);

      const speed = log.distance / (log.exerciseTime / 60); // km/h 단위로 속력 계산
      if (speed > maxSpeed || log.exerciseTime > maxEndurance) {
        return false; // 비정상적인 데이터 발견
      }
      return true; // 비정상적인 데이터 아님
    });

    return { isValid, maxSpeed, maxEndurance };
  } else {
    return { isValid: true, maxSpeed: null, maxEndurance: null };
  }
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

function getFallbackResponse(error, rawResponse) {
  return {
      error: "응답 파싱 중 오류가 발생했습니다.",
      message: error.message,
      rawResponse: rawResponse
  };
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
      jsonString.replace(/"([^"]+)":\s*("([^"]*)"|[^,}\]]+)/g, (match, key, value) => {
          try {
              partialObject[key.trim().replace(/(^")|("$)/g, '')] = JSON.parse(value); // 수정된 부분: key와 value를 트림하고 양쪽의 따옴표 제거 후 파싱
          } catch (e) {
              partialObject[key.trim().replace(/(^")|("$)/g, '')] = value.trim().replace(/(^")|("$)/g, ''); // 수정된 부분: 파싱 실패 시 value를 트림하고 양쪽의 따옴표 제거
          }
      });

      if (Object.keys(partialObject).length === 0) {
        throw new Error("부분 파싱 실패: 유효한 JSON 객체가 아님");
      }
      return partialObject;
  }
}

module.exports = router;