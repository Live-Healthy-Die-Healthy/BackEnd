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
      const resultJson = analysis.result_json;
      let exampleImages = [];

      if (resultJson && resultJson.음식상세) {
        const foodNames = resultJson.음식상세.map(food => food.음식명);
        exampleImages = await getExampleImages(foodNames);
      }
      console.log("exampleImages: ", exampleImages);
      res.json({
        status: 'completed',
        dietInfo: resultJson,
        dietDetailLogIds: analysis.dietDetailLogIds,
        exampleImages
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
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    console.log("retryCount: ", retryCount);
    try {
      const analysisResult = await getGPTResponse("Analyze this meal image", dietImage);

      // 응답 형식 검증
      if (typeof analysisResult !== 'object' || !Array.isArray(analysisResult.음식상세)) {
        console.log("Invalid response format. Retrying...");
        retryCount++;
        continue;
      }

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
            menuGI: food.영양정보.GI지수 ,
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
      retryCount++;
      if (retryCount >= maxRetries) {
        throw new Error('Maximum retry attempts reached');
      }
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






const basePrompt = `
당신은 영양학과 식품과학 분야의 전문가인 AI 영양사입니다. 사용자가 업로드한 식단 이미지를 분석하여 종합적이고 구조화된 식단 정보를 제공합니다. 반드시 다음 JSON 형식에 따라 분석 결과를 출력하세요. 다른 텍스트는 포함하지 말고 오직 JSON 형식의 응답만 제공하세요:

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
                "지방": 0,
                "GI지수": 0
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
        content: [
            { type: "text", text: "Analyze this image:" },
            { type: "image_url", image_url: { url: imageBase64 } }
        ]
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

      // 음식명과 매칭되는 예시 이미지를 찾기
      if (parsedContent && parsedContent.음식상세) {
        const foodNames = parsedContent.음식상세.map(food => food.음식명);
        const exampleImages = await getExampleImages(foodNames);
        parsedContent.예시이미지 = exampleImages;
    }

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

module.exports = router;
