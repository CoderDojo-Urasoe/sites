const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

async function checkToken() {
    const tokenPath = path.join(__dirname, '../config/token.json');
    if (!await fs.pathExists(tokenPath)) {
        console.log('token.json が見つかりません。');
        return;
    }

    const token = await fs.readJSON(tokenPath);
    const accessToken = token.access_token;

    try {
        const response = await axios.get(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
        console.log('現在のトークン情報:');
        console.log(JSON.stringify(response.data, null, 2));

        if (!response.data.scope.includes('photoslibrary')) {
            console.error('\n【致命的】Googleフォトの権限（photoslibrary）がトークンに含まれていません。');
            console.error('解決策: token.jsonを削除し、再認証時にすべてのチェックボックスをオンにしてください。');
        }
    } catch (error) {
        console.error('トークン情報の取得に失敗しました。期限切れの可能性があります。');
    }
}

checkToken();
