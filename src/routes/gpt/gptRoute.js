const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { parseISO, isValid } = require('date-fns');
const { User, DietLog, DietLogDetail, MenuList, Analysis } = require('../../index');
const { Op, Sequelize } = require('sequelize'); 
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