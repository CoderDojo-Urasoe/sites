const fs = require('fs-extra');
const path = require('path');
const { authorize } = require('./auth');
const axios = require('axios'); // ダウンロード用にaxiosを追加します

async function listMediaItemsByDate(auth, dateStr) {
    // dateStr: "20190804" -> year: 2019, month: 8, day: 4
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));

    const url = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
    const token = await auth.getAccessToken();

    try {
        const response = await axios.post(url, {
            filters: {
                dateFilter: {
                    dates: [{ year, month, day }]
                }
            }
        }, {
            headers: {
                Authorization: `Bearer ${token.token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.mediaItems || [];
    } catch (error) {
        if (error.response && error.response.data) {
            console.error('API Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

async function downloadPhoto(item, destFolder, fileName) {
    // baseUrl はそのままでは閲覧用。画像データとして取得するには =w###-h### を付与
    // 最高画質に近い形で取得するために元のサイズを指定（または =d でダウンロード用）
    const downloadUrl = `${item.baseUrl}=d`;
    const destPath = path.join(destFolder, fileName);

    const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(destPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

module.exports = { listMediaItemsByDate, downloadPhoto };
