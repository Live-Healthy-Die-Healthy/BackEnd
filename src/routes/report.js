const express = require('express');
const axios = require('axios');
const router = express.Router();
const { parseISO, isValid } = require('date-fns');
const { User, AerobicExercise, AnaerobicExercise, ExerciseLog, DietLogDetail, DietLog, DailyReport, MonthlyReport, MenuList, Sequelize, WeeklyReport } = require('../index');
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

async function performDailyAnalysis(userId, date, totalCalories, totalCarbo, 
  totalProtein, totalFat, userGender, userBirth, userWeight, dailyAerobics, dailyAnaerobics) {
  const maxRetries = 3;
  let retryCount = 0;

  console.log("userGender: ", userGender);
  console.log("userBirth: ", userBirth);
  console.log("userWeight: ", userWeight);

  while (retryCount < maxRetries) {
    console.log("retryCount: ", retryCount);
    try {
      const analysisResult = await getGPTResponse(userId, date, totalCalories, totalCarbo, 
        totalProtein, totalFat, userGender, userBirth, userWeight, dailyAerobics, dailyAnaerobics);

      
      // 응답 형식 검증
      if (typeof analysisResult !== 'object' || !analysisResult['식단 피드백'] || !analysisResult['운동 피드백']) {
        console.log("Invalid response format. Retrying...");
        retryCount++;
        continue;
      }

      // DailyReport 생성
      const newDailyReport = await DailyReport.create(
        {
          userId,
          date,
          totalCalories,
          totalTraining,
          totalCarbo,
          totalProtein,
          totalFat,
          dietFeedback: analysisResult['식단 피드백'],
          exerciseFeedback: analysisResult['운동 피드백']
        }
      );

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

    // 해당 날짜에 이미 DailyReport가 있는지 확인
    const existingReport = await DailyReport.findOne({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    if (existingReport) {
      console.log("존재!");
      // 이미 존재하는 DailyReport가 있으면 해당 데이터를 반환
      return res.status(200).json({
        totalCalories: existingReport.totalCalories,
        totalTraining: existingReport.totalTraining,
        dietFeedback: existingReport.dietFeedback,
        exerciseFeedback: existingReport.exerciseFeedback,
        totalCarbo: existingReport.totalCarbo,
        totalProtein: existingReport.totalProtein,
        totalFat: existingReport.totalFat
      });
    }

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

    // 총 운동 시간 계산
    let totalTraining = 0;
    let totalDistance = 0; 
    let totalWeight = 0; 
    let totalSets = 0; 
    let totalRepetitions = 0;

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

    userGender = user.userGender;
    userBirth = user.userBirth;
    userWeight = user.userWeight;
    
    if (!user) {
      throw new Error('User not found');
    }
    

    const response = await performDailyAnalysis(userId, date, totalCalories, totalCarbo, 
      totalProtein, totalFat, userGender, userBirth, userWeight, dailyAerobics, dailyAnaerobics
    ); 

    res.status(200).json({ 
        totalCalories: response.totalCalories,
        totalTraining: response.totalTraining,
        dietFeedback: response.dietFeedback,
        exerciseFeedback: response.exerciseFeedback,
        totalCarbo: response.totalCarbo,
        totalProtein: response.totalProtein,
        totalFat: response.totalFat
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

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
    // 입력된 날짜를 기준으로 주의 시작(월요일)과 끝(일요일) 설정
    const inputDate = new Date(date);
    if (isNaN(inputDate)) {
      throw new Error('Invalid date format');
    }

    // 주의 시작(월요일) 계산
    const startDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate()));
    const day = startDate.getUTCDay();
    const diff = startDate.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    startDate.setUTCDate(diff);
    startDate.setUTCHours(0, 0, 0, 0);

    // 주의 끝(일요일) 계산
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 6);
    endDate.setUTCHours(23, 59, 59, 999);

    console.log("Start Date: ", startDate);
    console.log("End Date: ", endDate);

    // 해당 날짜에 이미 WeeklyReport가 있는지 확인
    const existingReport = await WeeklyReport.findOne({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    if (existingReport) {
      console.log("존재!");
      // 이미 존재하는 WeeklyReport가 있으면 해당 데이터를 반환
      existingReport.date = startDate;  // 수정된 부분: 응답에 달의 첫 날을 포함하도록 설정
      return res.status(200).json(existingReport);
    }

    // 사용자의 해당 주의 DailyReport 찾기
    const dailyReports = await DailyReport.findAll({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    console.log("Daily Reports: ", dailyReports);

    // 일별 총 칼로리를 더해 평균 구함
    let totalCalories = 0;
    let totalTraining = 0;
    dailyReports.forEach(report => {
      totalCalories += report.totalCalories;
      totalTraining += report.totalTraining;
    });

    const meanCalories = (totalCalories / 7).toFixed(2);
    const meanTraining = (totalTraining / 7).toFixed(2);

    // WeeklyReport 생성
    const newWeeklyReport = await WeeklyReport.create({
      userId,
      date: startDate, // 주의 시작 날짜만 사용
      nextExercise: '운동하세요',
      nextDiet: '먹으세요',
      dietFeedback: '잘하셨네요',
      exerciseFeedback: '좀 치네요',
      meanCalories,
      meanTraining,
    });

    // 응답에서 주의 첫 날인 월요일 날짜를 포함
    res.status(200).json({
      weeklyReportId: newWeeklyReport.weeklyReportId,
      userId: newWeeklyReport.userId,
      date: startDate,
      nextExercise: newWeeklyReport.nextExercise,
      nextDiet: newWeeklyReport.nextDiet,
      dietFeedback: newWeeklyReport.dietFeedback,
      exerciseFeedback: newWeeklyReport.exerciseFeedback,
      meanCalories: newWeeklyReport.meanCalories,
      meanTraining: newWeeklyReport.meanTraining,
    });
  } catch (error) {
    console.error('Error retrieving weekly report:', error);
    res.status(500).json({ message: 'Error retrieving weekly report', error: error.message });
  }
});

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
    // 입력된 날짜를 기준으로 달의 시작과 끝 설정
    const inputDate = new Date(date);
    if (isNaN(inputDate)) {
      throw new Error('Invalid date format');
    }

    // 달의 시작 계산
    const startDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), 1));
    startDate.setUTCHours(0, 0, 0, 0);

    // 달의 끝 계산
    const endDate = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth() + 1, 0));
    endDate.setUTCHours(23, 59, 59, 999);

    console.log("Start Date: ", startDate);
    console.log("End Date: ", endDate);

    const existingReport = await MonthlyReport.findOne({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    if (existingReport) {
      console.log("존재!");
      // 이미 존재하는 MonthlyReport가 있으면 해당 데이터를 반환
      existingReport.date = startDate;  // 수정된 부분: 응답에 달의 첫 날을 포함하도록 설정
      return res.status(200).json(existingReport);
    }

    // 사용자의 해당 달의 DailyReport 찾기
    const dailyReports = await DailyReport.findAll({
      where: {
        userId: userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    console.log("Daily Reports: ", dailyReports);

    // 일별 총 칼로리를 더해 평균 구함
    let totalCalories = 0;
    let totalTraining = 0;
    dailyReports.forEach(report => {
      totalCalories += report.totalCalories;
      totalTraining += report.totalTraining;
    });

    const meanCalories = (totalCalories / dailyReports.length).toFixed(2);
    const meanTraining = (totalTraining / dailyReports.length).toFixed(2);

    // MonthlyReport 생성
    const newMonthlyReport = await MonthlyReport.create({
      userId,
      date: startDate, // 달의 시작 날짜만 사용
      nextExercise: '운동하세요',
      nextDiet: '먹으세요',
      dietFeedback: '잘하셨네요',
      exerciseFeedback: '좀 치네요',
      meanCalories,
      meanTraining,
    });

    // 응답에서 달의 첫 날인 1일 날짜를 포함
    res.status(200).json({
      monthlyReportId: newMonthlyReport.monthlyReportId,
      userId: newMonthlyReport.userId,
      date: startDate,
      nextExercise: newMonthlyReport.nextExercise,
      nextDiet: newMonthlyReport.nextDiet,
      dietFeedback: newMonthlyReport.dietFeedback,
      exerciseFeedback: newMonthlyReport.exerciseFeedback,
      meanCalories: newMonthlyReport.meanCalories,
      meanTraining: newMonthlyReport.meanTraining,
    });
  } catch (error) {
    console.error('Error retrieving monthly report:', error);
    res.status(500).json({ message: 'Error retrieving monthly report', error: error.message });
  }
});


async function getGPTResponse(userId, date, totalCalories, totalCarbo, 
  totalProtein, totalFat, userGender, userBirth, userWeight, dailyAerobics, dailyAnaerobics) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
  }

  const apiUrl = 'https://api.openai.com/v1/chat/completions';


  const dailyBasePrompt = `
당신은 영양, 식품, 운동분야의 분석 전문 AI 이다. 시스템에서 불러온 레포트를 분석해서 종합적이고 구조화된 레포트를 제공한다. 다음 JSON 형식에 따라 분석 결과를 출력하라.

{
    "식단 피드백": ""
    "운동 피드백": ""
}

모든 분석은 불러온 reportData 기반으로 하며, 위의 형식을 임의로 조정하지 말고 절대로 위 JSON 구조를 유지하라.

reportData:

사용자 생년월일(나이), 성별, 체중을 고려해 일간 총 칼로리, 단백질, 탄수화물 섭취량에 대해 식단 피드백을 작성하라.

사용자의 일간 유산소, 무산소 운동 정보, 성별, 체중, 

피드백 1개당 200자 이내로 요약해서 작성하라.
`;

const reportData = `
{
    "총 칼로리 섭취량": ${totalCalories},
    "총 단백질 섭취량": ${totalProtein},
    "총 탄수화물 섭취량": ${totalCarbo},
    "총 지방 섭취량": ${totalFat},
    "사용자 성별": "${userGender}",
    "사용자 생년월일": ${userBirth},
    "사용자 체중": ${userWeight},
    "일간 유산소 운동 정보": ${JSON.stringify(dailyAerobics)},
    "일간 무산소 운동 정보": ${JSON.stringify(dailyAnaerobics)}
}
`;

  const message = `${dailyBasePrompt}\n분석 데이터:\n${reportData}`;

  const payload = {
      model: "gpt-4",
      messages: [
        { role: "system", content: dailyBasePrompt },
        { role: "user", content: message }
      ],
      max_tokens: 1000,
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
      jsonString.replace(/("[^"]+"):([^,}\]]+)/g, (match, key, value) => {
          try {
              partialObject[JSON.parse(key)] = JSON.parse(value);
          } catch (e) {
              partialObject[JSON.parse(key)] = value.trim();
          }
      });

      if (Object.keys(partialObject).length === 0) {
        throw new Error("부분 파싱 실패: 유효한 JSON 객체가 아님");
    }
      return partialObject;
  }
}

module.exports = router;