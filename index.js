const express = require('express');
const multer = require('multer');
const fs = require('fs');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const app = express();
const upload = multer({ dest: 'uploads/' }); // 업로드된 파일을 'uploads/' 디렉토리에 저장

const PORT = 3000;
const MODEL_NAME = "gemini-1.0-pro-vision-latest";
const API_KEY = ""; // 실제 API 키로 변경해야 합니다.

// 클라이언트 파일을 위한 정적 디렉터리 설정
app.use(express.static('public'));

// 이미지 분석을 위한 POST 요청 처리
app.post('/analyze-image', upload.single('image'), async (req, res) => {
  if (req.file) {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 4096,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      // 추가적인 안전 설정 가능
    ];

    const parts = [
      {text: "첨부된 이미지는 얼굴입니다. 얼굴을 보고 이 사람의 특징을 알려주세요. 특히, 좋아하는 것, 싫어할 것이 무엇인지 알려주세요.\n"},
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: Buffer.from(fs.readFileSync(req.file.path)).toString("base64")
        }
      },
      {text: "\n"},
    ];

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig,
        safetySettings,
      });

      // 업로드된 이미지 파일 삭제
      fs.unlinkSync(req.file.path);

      // 생성된 텍스트 내용을 클라이언트에게 전송
      res.send({ message: result.response.text() });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "내부 서버 오류가 발생했습니다." });
    }
  } else {
    res.status(400).send({ error: "이미지 파일이 없습니다." });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
