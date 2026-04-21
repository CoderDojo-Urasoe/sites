const fs = require('fs-extra');
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');

const SCOPES = [
    'https://www.googleapis.com/auth/photoslibrary.readonly',
    'https://www.googleapis.com/auth/photoslibrary',
    'https://www.googleapis.com/auth/photoslibrary.sharing'
];
const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials.json');

async function runAuth() {
  if (!await fs.pathExists(CREDENTIALS_PATH)) {
    console.error('Error: tools/news-gen/config/credentials.json が見つかりません。');
    console.log('Google Cloud Consoleからダウンロードして配置してください。');
    return;
  }

  const client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
    prompt: 'consent', // 強制的に同意画面を表示
    access_type: 'offline',
  });

  if (client.credentials) {
    await fs.writeJSON(TOKEN_PATH, client.credentials);
    console.log('認証成功！トークンを保存しました:', TOKEN_PATH);
  }
}

runAuth().catch(console.error);
