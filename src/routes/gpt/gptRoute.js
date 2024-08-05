const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { parseISO, isValid } = require('date-fns');
const { User, DietLog, DietLogDetail, MenuList, Analysis } = require('../../index');
const { Op, Sequelize } = require('sequelize'); 
const { v4: uuidv4 } = require('uuid');

// 이미지 분석 및 식단 기록 추가 라우트
router.post('/dietImage' , async (req, res) => {
  const { userId, dietType, dietDate, dietImage } = req.body;
  console.log("dietDate: ", dietDate);

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
    userCarbo: user.userCarbo,
    userProtein: user.userProtein,
    userFat: user.userFat,
  };
  
  if (!user) {
    throw new Error('User not found');
  }

  try {
    // 분석 ID 생성
    const analysisId = uuidv4();

    // 분석 ID 반환
    res.json({ analysisId });

    // 비동기적으로 이미지 분석 시작
    performImageAnalysis(analysisId, dietImage, userId, dietType, dietDate, userData);

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
      const resultJson = analysis.result_json;
      if (resultJson && resultJson.음식상세) {
        const foodNames = resultJson.음식상세.map(food => food.음식명);
        const exampleImages = await getExampleImages(foodNames);
        resultJson.예시이미지 = exampleImages;
      }
      res.json({
        status: 'completed',
        dietInfo: resultJson,
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

async function performImageAnalysis(analysisId, dietImage, userId, dietType, dietDate, userData) {
  const maxRetries = 3;

  // 각 파트별로 성공 여부를 저장하는 변수 추가
  let part1Success = false;
  let part2Success = false;
  let part3Success = false;

  let part1Result, part2Result, part3Result;

  for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
    try {
      if (!part1Success) {
        // Part 1 응답 확인
        part1Result = await getGPTResponse(part1Prompt, dietImage, userData, "총칼로리", "영양소비율");
        console.log("Part 1 Result:", part1Result); // Part 1 응답 확인
        part1Success = true; // 파싱 성공 시 플래그 업데이트
      }

      if (!part2Success) {
        // Part 2 응답 확인
        part2Result = await getGPTResponse(part2Prompt, dietImage, userData, "음식상세");
        console.log("Part 2 Result:", part2Result); // Part 2 응답 확인
        
        // JSON 파싱 확인
        if (Array.isArray(part2Result.음식상세)) {
          part2Success = true; // 파싱 성공 시 플래그 업데이트
        } else {
          console.error("Invalid format for 음식상세. Expected an array.");

          // 수정된 부분: 오류 발생 시 fixPrompt를 사용하여 재요청
          part2Result = await getGPTResponse(fixPrompt, dietImage, userData, "음식상세");
          console.log("Fixed Part 2 Result:", part2Result); // 수정된 Part 2 응답 확인
          
          // 다시 JSON 파싱 확인
          if (Array.isArray(part2Result.음식상세)) {
            part2Success = true; // 파싱 성공 시 플래그 업데이트
          } else {
            throw new Error("Invalid format for 음식상세 after fix attempt.");
          }
        }
      }
      if (!part3Success) {
        // Part 3 응답 확인
        part3Result = await getGPTResponse(part3Prompt, dietImage, userData, "영양분석", "권장사항", "주의사항");
        console.log("Part 3 Result:", part3Result); // Part 3 응답 확인
        part3Success = true; // 파싱 성공 시 플래그 업데이트
      }

      // 모든 파트가 성공적으로 파싱되었는지 확인
      if (part1Success && part2Success && part3Success) {
        // 세 개의 결과를 하나의 JSON으로 병합
        const analysisResult = {
          ...part1Result,
          ...part2Result,
          ...part3Result,
        };
        console.log("analysisResult: ", analysisResult); // 병합된 결과 확인

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
              menuImage: Buffer.from([]),
              menuCarbo: food.영양정보.탄수화물 / 100,
              menuProtein: food.영양정보.단백질 / 100,
              menuFat: food.영양정보.지방 / 100,
              menuGI: food.영양정보.GI지수,
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
      }
    } catch (error) {
      console.error('Error during image analysis:', error);

      // 수정된 부분: 재시도 횟수 도달 시 오류를 던지지 않고 로그만 남김
      if (retryCount >= maxRetries - 1) {
        console.error('Maximum retry attempts reached');
        return { status: 'error', message: 'Maximum retry attempts reached' };
      }
      console.log(`Retrying... (${retryCount + 1}/${maxRetries})`);
    }
  }
}


router.put('/updateDietDetail/:analysisId', async (req, res) => {
  const { analysisId } = req.params;
  const { updatedDetails } = req.body;

  try {
    // 1. analysisId로 Analysis 찾기
    const analysis = await Analysis.findByPk(analysisId);
    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    // 2. 프론트에서 받은 dietDetailLogIds
    const receivedDetailLogIds = updatedDetails.map(detail => detail.dietDetailLogId);

    // 3. Analysis에 저장된 모든 dietDetailLogIds
    const storedDetailLogIds = analysis.dietDetailLogIds;

    // 4. 삭제해야 할 dietDetailLogIds 찾기
    const idsToDelete = storedDetailLogIds.filter(id => !receivedDetailLogIds.includes(id));

    // 5. 삭제 실행
    if (idsToDelete.length > 0) {
      await DietLogDetail.destroy({
        where: {
          dietDetailLogId: idsToDelete
        }
      });
    }

    // 6. 남은 항목 업데이트
    for (const detail of updatedDetails) {
      const { dietDetailLogId, quantity } = detail;
      await DietLogDetail.update(
        { quantity },
        { where: { dietDetailLogId } }
      );
    }

    // 7. Analysis의 dietDetailLogIds 업데이트
    await Analysis.update(
      { dietDetailLogIds: receivedDetailLogIds },
      { where: { analysisId } }
    );

    res.status(200).json({ message: 'Diet details updated and deleted successfully' });
  } catch (error) {
    console.error('Error updating diet details:', error);
    res.status(500).json({ message: 'Error updating diet details', error: error.message });
  }
});


const part1Prompt = `
You are an AI nutritionist with expertise in nutrition and food science.

Ensure that:
1. The fields "영양소비율" are properly formatted as JSON objects, not strings.
2. All JSON objects and arrays are correctly closed.
3. Avoid duplicate keys within the same JSON object.
4. Check for and remove any bad control characters in JSON strings.

Analyze the uploaded meal image to provide comprehensive and structured dietary information in the following JSON format:

{
    "총칼로리": 0,
    "영양소비율": {
        "탄수화물": 0,
        "단백질": 0,
        "지방": 0
    }
}

All analysis of food information, detailed data, and nutritional analysis is based solely on the food image.
Write the recommendations and precautions based on the food image, its data, and the user information provided as reportData.
`;

const part2Prompt = `
You are an AI nutritionist with expertise in nutrition and food science.

Ensure the following:
1. The field "음식상세" is properly formatted as a JSON array, not a string.
2. All JSON objects and arrays are correctly closed.
3. Avoid duplicate keys within the same JSON object.
4. Check for and remove any bad control characters in JSON strings.
5. Even if the number of food items increases, maintain the existing JSON format.
6. "음식명" should be written in Korean.

Analyze the uploaded meal image to provide comprehensive and structured dietary information in the following JSON format:

{
    "음식상세": [
        {
            "음식명": "",
            "예상양": 0,
            "칼로리": 0,
            "영양정보": {
                "칼로리": 0,
                "탄수화물": 0,
                "단백질": 0,
                "지방": 0,
                "GI지수": 0
            }
        }
    ]
}

Each food detail should consist of a single food item, such as "spicy chicken with vegetables" or "lobster and seafood." Do not group multiple food items into one food detail. Write recommendations and precautions based on the food image, its data, and the user information provided as reportData.
`;

const fixPrompt = `
Do not change the JSON structure! Strictly follow the JSON format given below.
Do not add any content other than the structure below.

{
    "음식상세": [
        {
            "음식명": "",
            "예상양": 0,
            "칼로리": 0,
            "영양정보": {
                "칼로리": 0,
                "탄수화물": 0,
                "단백질": 0,
                "지방": 0,
                "GI지수": 0
            }
        }
    ]
}


Ensure the following:
1. The field "음식상세" is properly formatted as a JSON array, not a string.
2. All JSON objects and arrays are correctly closed.
3. Avoid duplicate keys within the same JSON object.
4. Check for and remove any bad control characters in JSON strings.
5. Even if the number of food items increases, maintain the existing JSON format.
6. "음식명" should be written in Korean.
`;

const part3Prompt = `
You are an AI nutritionist with expertise in nutrition and food science.

Ensure that:
1. All JSON objects and arrays are correctly closed.
2. Avoid duplicate keys within the same JSON object.
3. Check for and remove any bad control characters in JSON strings.

Analyze the uploaded meal image to provide comprehensive and structured dietary information in the following JSON format:

{
    "영양분석": {
        "장점": [],
        "개선점": []
    },
    "권장사항": [],
    "주의사항": ""
}

All analysis of food information, detailed data, and nutritional analysis is based solely on the food image. Write recommendations and precautions considering the user's basal metabolic rate, recommended calories, and recommended intake of carbohydrates, proteins, and fats.
`;



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

// 이미지 파일 경로를 설정하는 함수
async function getExampleImages(foodNames) {
  const exampleImages = {};
  for (const foodName of foodNames) {
      const menuItem = await MenuList.findOne({ where: { menuName: foodName } });
      if (menuItem && menuItem.menuImage) {
          exampleImages[foodName] = `data:image/jpeg;base64,${menuItem.menuImage.toString('base64')}`;
      }
  }
  return exampleImages;
}

async function getGPTResponse(prompt, imageBase64, userData, ...jsonKeys) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
  }

  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  const reportData = 
{
    // User data
    "사용자 성별": userData.userGender,
    "사용자 생년월일": userData.userBirth,
    "사용자 체중": userData.userWeight,
    "사용자 골격근량": userData.userMuscleMass,
    "사용자 BMI": userData.userBmi,
    "사용자 체지방률": userData.userBodyFatPercentage,
    "사용자 기초대사량": userData.userBmr,
    "사용자 권장 칼로리": userData.userRecommendedCal,
    "사용자 권장 탄수화물": userData.userCarbo,
    "사용자 권장 단백질": userData.userProtein,
    "사용자 권장 지방": userData.userFat,
};

  let messages = [
    { role: "system", content: prompt },
    { role: "user", content: JSON.stringify(reportData) }
  ];

  if (imageBase64) {
    messages.push({
        role: "user",
        content: [
            { type: "text", text: "Analyze this image:" },
            { type: "image_url", image_url: { url: imageBase64 } }
        ]
    });
  }

  const payload = {
      model: "gpt-4o",
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

      // 특정 JSON 키들만 반환
      const filteredContent = jsonKeys.reduce((result, key) => {
          if (parsedContent[key]) {
              result[key] = parsedContent[key];
          }
          return result;
      }, {});

      return filteredContent;
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

module.exports = router;
