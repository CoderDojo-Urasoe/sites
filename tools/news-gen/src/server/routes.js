const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authorize } = require('../auth');
const { generateArticle } = require('./generator');

// ========================================================
// 設定エンドポイント（フロントエンド用・クライアントIDのみ渡す）
// APIキーはサーバーで使うため渡さない
// ========================================================
router.get('/config', (req, res) => {
    res.json({
        clientId: process.env.GOOGLE_CLIENT_ID
    });
});

// ========================================================
// テスト用エンドポイント
// ========================================================
router.get('/status', (req, res) => {
    res.json({ status: 'OK', message: 'API is running' });
});

// ========================================================
// [新仕様] Pickerセッション作成エンドポイント
// フロントエンドがアクセストークンを渡し、サーバーがセッションURLを返す
// ========================================================
router.post('/picker/session', async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) {
        return res.status(400).json({ error: 'accessToken は必須です。' });
    }

    try {
        const response = await axios.post(
            'https://photospicker.googleapis.com/v1/sessions',
            {},  // リクエストボディは空
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        // pickerUri と id が返ってくる
        res.json(response.data);
    } catch (err) {
        const errData = err.response?.data || err.message;
        console.error('Pickerセッション作成エラー:', errData);
        res.status(500).json({ error: errData });
    }
});

// ========================================================
// [新仕様] Pickerセッションポーリングエンドポイント
// フロントエンドが定期的に呼び出し、選択完了を確認する
// ========================================================
router.get('/picker/session/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const { accessToken } = req.query;

    if (!accessToken) {
        return res.status(400).json({ error: 'accessToken は必須です。' });
    }

    try {
        const response = await axios.get(
            `https://photospicker.googleapis.com/v1/sessions/${sessionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        res.json(response.data);
    } catch (err) {
        const errData = err.response?.data || err.message;
        console.error('セッションポーリングエラー:', errData);
        res.status(500).json({ error: errData });
    }
});

// ========================================================
// [新仕様] 選択されたメディアアイテム取得エンドポイント
// ========================================================
router.get('/picker/media/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const { accessToken } = req.query;

    if (!accessToken) {
        return res.status(400).json({ error: 'accessToken は必須です。' });
    }

    try {
        const response = await axios.get(
            `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        res.json(response.data);
    } catch (err) {
        const errData = err.response?.data || err.message;
        console.error('メディアアイテム取得エラー:', errData);
        res.status(500).json({ error: errData });
    }
});

// ========================================================
// 記事生成エンドポイント
// ========================================================
router.post('/generate', async (req, res) => {
    try {
        const { date, title, content, photos, accessToken } = req.body;

        if (!date || !title) {
            return res.status(400).json({ error: '日付とタイトルは必須です。' });
        }

        if (!photos || photos.length === 0) {
            return res.status(400).json({ error: '写真を1枚以上選択してください。' });
        }

        console.log(`生成リクエスト: 日付=${date}, タイトル=${title}, 写真数=${photos.length}`);
        const result = await generateArticle(date, title, content, photos, accessToken);

        res.json({
            success: true,
            message: `記事を生成しました！（写真 ${result.photoCount} 枚）`,
            path: result.path
        });
    } catch (error) {
        console.error('記事生成エラー:', error);
        res.status(500).json({ error: '記事の生成に失敗しました: ' + error.message });
    }
});

module.exports = router;
