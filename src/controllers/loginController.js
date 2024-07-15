const axios = require("axios");

module.exports = { kakaoAccessToken: async (req, res) => {
    try {
      const { code } = req.body;
      console.log(code);
      const accessToken = await axios({
        url: "https://kauth.kakao.com/oauth/token",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        params: {
          grant_type: "authorization_code",
          client_id: process.env.KAKAO_CLIENT_ID,
          redirect_uri: process.env.KAKAO_REDIRECT_URL,
          client_secret: process.env.KAKAO_CLIENT_SECRET,
          code: code,
        }
      });
      console.log("hi");

      const item = accessToken.data;
      res.status(200).json(item);
    } catch (error) {
      console.error(error);
      res.status(500).json(error);
    }
  }
}