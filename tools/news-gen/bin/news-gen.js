#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { authorize } = require('../src/auth');
const { listMediaItemsByDate, downloadPhoto } = require('../src/google-photos');

const NEWS_ROOT = path.join(__dirname, '../../../work/news');
const TEMPLATE_PATH = path.join(__dirname, '../templates/default.html');

async function generateArticle(dateStr, title, content = '') {
    const auth = await authorize();
    const folderPath = path.join(NEWS_ROOT, dateStr);
    const imagesPath = path.join(folderPath, 'images');

    // 1. フォルダ作成
    await fs.ensureDir(imagesPath);

    // 2. Googleフォトから写真取得
    console.log(`${dateStr} の写真を検索中...`);
    const items = await listMediaItemsByDate(auth, dateStr);
    console.log(`${items.length} 枚の写真が見つかりました。`);

    const imageTags = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const ext = item.mimeType === 'image/png' ? 'png' : 'jpg';
        const fileName = `photo_${String(i + 1).padStart(2, '0')}.${ext}`;
        
        console.log(`ダウンロード中: ${fileName}`);
        await downloadPhoto(item, imagesPath, fileName);
        
        imageTags.push(`<img src="images/${fileName}" alt="開催の様子">`);
    }

    // 3. HTML生成
    let template = await fs.readFile(TEMPLATE_PATH, 'utf8');
    
    // 日付フォーマット (YYYY/MM/DD)
    const dateFormatted = `${dateStr.substring(0, 4)}/${dateStr.substring(4, 6)}/${dateStr.substring(6, 8)}`;

    const html = template
        .replace(/{{title}}/g, title)
        .replace(/{{date_formatted}}/g, dateFormatted)
        .replace(/{{content}}/g, content)
        .replace(/{{image_tags}}/g, imageTags.join('\n            '));

    const htmlPath = path.join(folderPath, 'index.html');
    await fs.writeFile(htmlPath, html);
    console.log(`記事を生成しました: ${htmlPath}`);
}

async function main() {
    const args = process.argv.slice(2);
    const dateIdx = args.indexOf('--date');
    const titleIdx = args.indexOf('--title');

    if (dateIdx !== -1 && titleIdx !== -1) {
        const date = args[dateIdx + 1];
        const title = args[titleIdx + 1];
        await generateArticle(date, title);
    } else {
        console.log('使用法: node bin/news-gen.js --date YYYYMMDD --title "記事タイトル"');
    }
}

main().catch(console.error);
