const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');

/**
 * 記事生成メイン処理
 */
async function generateArticle(date, title, content, photos, accessToken) {
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
            const requestOptions = {
                url: photo.url,
                method: 'GET',
                responseType: 'stream'
            };
            if (accessToken) {
                // 画像DL時にアクセストークンを付与する
                requestOptions.headers = {
                    'Authorization': `Bearer ${accessToken}`
                };
            }

            const response = await axios(requestOptions);

            const writer = fs.createWriteStream(filePath);
            // 最大幅1200pxにリサイズし、品質80%のJPEGに変換
            const resizer = sharp().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80 });

            response.data.pipe(resizer).pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
                resizer.on('error', reject);
            });

            photoData.push({
                name: fileName,
                path: `./img/${fileName}`
            });
        } catch (err) {
            console.error(`画像のダウンロードに失敗: ${photo.filename || fileName}`, err.message);
            throw new Error(`画像「${fileName}」の処理中にエラーが発生しました: ${err.message}`);
        }
    }

    // 3. HTMLの生成
    await createHtml(articleDir, date, title, content, photoData);

    return { 
        path: articleDir,
        photoCount: photoData.length 
    };
}

/**
 * HTMLファイルの組み立て
 */
async function createHtml(dir, date, title, content, photoData) {
    const templatePath = path.join(__dirname, '../../templates/default.html');
    let html = await fs.readFile(templatePath, 'utf-8');

    // 置換処理
    const formattedDate = `${date.substring(0,4)}年${date.substring(4,6)}月${date.substring(6,8)}日`;
    
    html = html.replace(/{{TITLE}}/g, title);
    html = html.replace(/{{DATE}}/g, formattedDate);

    // 本文のサニタイズと改行の変換
    const safeContent = content 
        ? content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
        : '';
    html = html.replace(/{{CONTENT}}/g, safeContent);

    // 画像タグの生成（ギャラリー形式）
    const photosHtml = photoData.map(p =>
        `<div class="article-image-wrapper">\n  <img src="${p.path}" alt="${title}" class="article-inline-image">\n</div>`
    ).join('\n');

    html = html.replace(/{{PHOTOS}}/g, photosHtml);

    await fs.writeFile(path.join(dir, 'index.html'), html);
}

module.exports = { generateArticle };
