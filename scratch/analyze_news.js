const fs = require('fs');
const path = require('path');

const baseDir = '/Users/mitsushiyamaguchi/Documents/Dev/coderdojo-urasoe-websites/work/news';
const outputFilePath = '/Users/mitsushiyamaguchi/Documents/Dev/coderdojo-urasoe-websites/work/過去記事一覧.csv';

function extractTitle(html) {
    const match = html.match(/<title>(.*?)<\/title>/i);
    return match ? match[1].trim() : '';
}

function extractArticleContent(html) {
    const startTagMatch = html.match(/<article[^>]*>/i);
    const endTagMatch = html.match(/<\/article>/i);
    
    if (!startTagMatch || !endTagMatch) return '';
    
    const startPos = startTagMatch.index + startTagMatch[0].length;
    const endPos = endTagMatch.index;
    
    let content = html.substring(startPos, endPos);
    
    // Remove tags except a, img, video
    // This regex matches any tag that is not a, /a, img, video, /video
    content = content.replace(/<(?!\/?(?:a|img|video)\b)[^>]+>/gi, '');
    
    // Cleanup whitespace
    content = content.replace(/\s+/g, ' ').trim();
    
    return content;
}

function escapeCsv(str) {
    if (!str) return '""';
    return '"' + str.replace(/"/g, '""') + '"';
}

function main() {
    const directories = fs.readdirSync(baseDir).filter(name => {
        return fs.statSync(path.join(baseDir, name)).isDirectory();
    }).sort();

    const csvLines = [];
    csvLines.push('連番,フォルダ名,ページタイトル,記事内容');

    let count = 1;
    directories.forEach((dir) => {
        const filePath = path.join(baseDir, dir, 'index.html');
        if (fs.existsSync(filePath)) {
            const html = fs.readFileSync(filePath, 'utf8');
            const title = extractTitle(html);
            const content = extractArticleContent(html);
            
            csvLines.push(`${count},${dir},${escapeCsv(title)},${escapeCsv(content)}`);
            count++;
        }
    });

    fs.writeFileSync(outputFilePath, '\uFEFF' + csvLines.join('\n'), 'utf8'); // Added BOM for Excel/Google Sheets Japanese support
    console.log(`Successfully created: ${outputFilePath}`);
}

main();
