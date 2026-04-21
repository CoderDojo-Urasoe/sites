const fs = require('fs-extra');
const path = require('path');
const { google } = require('googleapis');

const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials.json');

async function authorize() {
  if (!await fs.pathExists(CREDENTIALS_PATH)) {
    throw new Error('credentials.json が見つかりません。');
  }
  if (!await fs.pathExists(TOKEN_PATH)) {
    throw new Error('token.json が見つかりません。node src/setup-auth.js を実行してください。');
  }

  const credentials = await fs.readJSON(CREDENTIALS_PATH);
  const token = await fs.readJSON(TOKEN_PATH);

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

module.exports = { authorize };
