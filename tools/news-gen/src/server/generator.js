const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

/**
 * 記事生成メイン処理
 */
async function generateArticle(date, title, photos) {
    const articleDir = path.join(__dirname, '../../../../news', date);
    const imgDir = path.join(articleDir, 'img');

    // 1. フォルダ準備
    await fs.ensureDir(articleDir);
    await fs.ensureDir(imgDir);

    // 2. 写真のダウンロード処理
    const photoData = [];
    console.log(`${photos.length} 枚の写真を処理中...`);

    for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const ext = '.jpg'; // Pickerのサムネイルなどは基本的にjpg
        const fileName = `photo_${i + 1}${ext}`;
        const filePath = path.join(imgDir, fileName);

        try {
            // NOTE: Pickerから取得できるURLはサムネイルの場合が多いですが、
            // 記事用には十分なサイズであることが多いです。
            const response = await axios({
                url: photo.url,
                method: 'GET',
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            photoData.push({
                name: fileName,
                path: `./img/${fileName}`
            });
        } catch (err) {
            console.error(`画像のダウンロードに失敗: ${photo.name}`, err.message);
        }
    }

    // 3. HTMLの生成
    await createHtml(articleDir, date, title, photoData);

    return { 
        path: articleDir,
        photoCount: photoData.length 
    };
}

/**
 * HTMLファイルの組み立て
 */
async function createHtml(dir, date, title, photoData) {
    const templatePath = path.join(__dirname, '../../templates/default.html');
    let html = await fs.readFile(templatePath, 'utf-8');

    // 置換処理
    const formattedDate = `${date.substring(0,4)}年${date.substring(4,6)}月${date.substring(6,8)}日`;
    
    html = html.replace(/{{TITLE}}/g, title);
    html = html.replace(/{{DATE}}/g, formattedDate);

    // 画像タグの生成（ギャラリー形式）
    const photosHtml = photoData.map(p =>
        `<div class="article-image-wrapper">\n  <img src="${p.path}" alt="${title}" class="article-inline-image">\n</div>`
    ).join('\n');

    html = html.replace(/{{PHOTOS}}/g, photosHtml);

    await fs.writeFile(path.join(dir, 'index.html'), html);
}

module.exports = { generateArticle };
