const express = require('express');
const router = express.Router();
const { DailyReport, WeeklyReport, MonthlyReport } = require('../../index');
const { Op } = require('sequelize');
const axios = require('axios');

// 일간 base prompt
const dailyBasePrompt = `
당신은 영양학과 식품가확 분야의 분석 전문가 AI 분석가이다. 시스템에서 불러온 레포트를 분석해서 종합적이고 구조화된 레포트를 제공한다. 다음 JSON 형식에 따라 분석 결과를 출력하라.

{
    "총 칼로리": 0,
    "총 운동시간": 0,
    "영양소비율": {
        "탄수화물": 0,
        "단백질": 0,
        "지방": 0
    },
    "식단 피드백": ""
    "운동 피드백": ""
}

모든 분석은 불러온 레포트 기반으로 하며, 정확한 개인별 분석을 위해서 사용자의 성별, 나이, 체중, 활동 수준 등의 추가 정보를 바탕으로 분석 결과를 작성하라.
위의 형식을 임의로 조정하지 말고 절대로 위 JSON 구조를 유지하라.
총 칼로리의 단위는 (kcal), 운동  시간의 단위는 (분), 영양소 비율은 (%) 이다.
`;

// 주간 base prompt
const weeklyBasePrompt = `
당신은 영양학과 식품가확 분야의 분석 전문가 AI 분석가이다. 시스템에서 불러온 레포트를 분석해서 종합적이고 구조화된 레포트를 제공한다. 다음 JSON 형식에 따라 분석 결과를 출력하라.

{
    "일일 평균 소모 칼로리": 0,
    "일일 평균 운동시간": 0,
    "일일 평균 영양소비율": {
        "탄수화물": 0,
        "단백질": 0,
        "지방": 0
    },
    "식단 피드백": ""
    "운동 피드백": ""

    "다음 주 권장 식단": ""
    "다음 주 권장 운동": ""
}

모든 분석은 불러온 레포트 기반으로 하며, 정확한 개인별 분석을 위해서 사용자의 성별, 나이, 체중, 활동 수준 등의 추가 정보를 바탕으로 분석 결과를 작성하라.
위의 형식을 임의로 조정하지 말고 절대로 위 JSON 구조를 유지하라.
총 칼로리의 단위는 (kcal), 운동  시간의 단위는 (분), 영양소 비율은 (%) 이다.
`;

// 월간 base prompt
const monthlyBasePrompt = `
당신은 영양학과 식품가확 분야의 분석 전문가 AI 분석가이다. 시스템에서 불러온 레포트를 분석해서 종합적이고 구조화된 레포트를 제공한다. 다음 JSON 형식에 따라 분석 결과를 출력하라.

{
    "주간 평균 소모 칼로리": 0,
    "주간 평균 운동시간": 0,
    "주간 평균 영양소비율": {
        "탄수화물": 0,
        "단백질": 0,
        "지방": 0
    },
    "식단 피드백": ""
    "운동 피드백": ""

    "다음 달 권장 식단": ""
    "다음 달 권장 운동": ""
}

모든 분석은 불러온 레포트 기반으로 하며, 정확한 개인별 분석을 위해서 사용자의 성별, 나이, 체중, 활동 수준 등의 추가 정보를 바탕으로 분석 결과를 작성하라.
위의 형식을 임의로 조정하지 말고 절대로 위 JSON 구조를 유지하라.
총 칼로리의 단위는 (kcal), 운동  시간의 단위는 (분), 영양소 비율은 (%) 이다.
`;

// GPT 응답 함수 생성
async function getGPTResponse(basePrompt, reportData) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: 'gpt-4',
    messages: [
      { role: 'system', content: basePrompt },
      { role: 'user', content: JSON.stringify(reportData) }
    ],
    max_tokens: 1000,
    response_format: { type: 'json_object' }
  };

  const response = await axios.post(apiUrl, payload, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content;
}

// 일간 레포트 라우트
router.post('/daily', async (req, res) => {
  const { userId, date } = req.body;

  try {
    const dailyReport = await DailyReport.findOne({
      where: {
        userId,
        date: {
          [Op.eq]: date
        }
      }
    });

    if (!dailyReport) {
      return res.status(404).json({ message: 'Daily report not found' });
    }

    const reportData = {
      총칼로리: dailyReport.totalCalories,
      총운동시간: dailyReport.totalTraining,
      영양소비율: {
        탄수화물: 0,
        단백질: 0,
        지방: 0
      },
      식단피드백: dailyReport.dietFeedback,
      운동피드백: dailyReport.exerciseFeedback
    };

    const gptResponse = await getGPTResponse(dailyBasePrompt, reportData);
    res.json(JSON.parse(gptResponse));
  } catch (error) {
    console.error('Error processing daily report:', error);
    res.status(500).json({ message: 'Error processing daily report', error: error.message });
  }
});

// 주간 레포트 라우트
router.post('/weekly', async (req, res) => {
  const { userId, date } = req.body;

  try {
    const weeklyReport = await WeeklyReport.findOne({
      where: {
        userId,
        date: {
          [Op.eq]: date
        }
      }
    });

    if (!weeklyReport) {
      return res.status(404).json({ message: 'Weekly report not found' });
    }

    const reportData = {
      일일평균소모칼로리: weeklyReport.meanCalories,
      일일평균운동시간: weeklyReport.meanTraining,
      일일평균영양소비율: {
        탄수화물: 0,
        단백질: 0,
        지방: 0
      },
      식단피드백: weeklyReport.dietFeedback,
      운동피드백: weeklyReport.exerciseFeedback,
      다음주권장식단: weeklyReport.nextDiet,
      다음주권장운동: weeklyReport.nextExercise
    };

    const gptResponse = await getGPTResponse(weeklyBasePrompt, reportData);
    res.json(JSON.parse(gptResponse));
  } catch (error) {
    console.error('Error processing weekly report:', error);
    res.status(500).json({ message: 'Error processing weekly report', error: error.message });
  }
});

// 월간 레포트 라우트
router.post('/monthly', async (req, res) => {
  const { userId, date } = req.body;

  try {
    const monthlyReport = await MonthlyReport.findOne({
      where: {
        userId,
        date: {
          [Op.eq]: date
        }
      }
    });

    if (!monthlyReport) {
      return res.status(404).json({ message: 'Monthly report not found' });
    }

    const reportData = {
      주간평균소모칼로리: monthlyReport.meanCalories,
      주간평균운동시간: monthlyReport.meanTraining,
      주간평균영양소비율: {
        탄수화물: 0,
        단백질: 0,
        지방: 0
      },
      식단피드백: monthlyReport.dietFeedback,
      운동피드백: monthlyReport.exerciseFeedback,
      다음달권장식단: monthlyReport.nextDiet,
      다음달권장운동: monthlyReport.nextExercise
    };

    const gptResponse = await getGPTResponse(monthlyBasePrompt, reportData);
    res.json(JSON.parse(gptResponse));
  } catch (error) {
    console.error('Error processing monthly report:', error);
    res.status(500).json({ message: 'Error processing monthly report', error: error.message });
  }
});

module.exports = router;
