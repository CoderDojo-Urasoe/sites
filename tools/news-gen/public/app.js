document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('generator-form');
    const btnPickPhotos = document.getElementById('btn-pick-photos');
    const selectedPhotosPreview = document.getElementById('selected-photos-preview');
    const statusMessage = document.getElementById('status-message');
    const btnGenerate = document.getElementById('btn-generate');

    let config = {};
    let accessToken = null;
    let selectedPhotos = [];  // { url, id, mimeType, filename }
    let pollTimer = null;

    // ===========================
    // 1. サーバーから設定取得
    // ===========================
    try {
        const res = await fetch('/api/config');
        config = await res.json();
    } catch (err) {
        showStatus('設定の読み込みに失敗しました。サーバーが起動しているか確認してください。', 'error');
        return;
    }

    // ===========================
    // 2. Google Identity Services (GIS) でOAuth認証
    //    スコープ: photospicker.mediaitems.readonly（新仕様）
    // ===========================
    function getAccessToken() {
        return new Promise((resolve, reject) => {
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: config.clientId,
                scope: 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
                callback: (response) => {
                    if (response.error) {
                        reject(new Error(response.error));
                        return;
                    }
                    resolve(response.access_token);
                },
            });
            tokenClient.requestAccessToken({ prompt: 'consent' });
        });
    }

    // ===========================
    // 3. Picker セッションの作成（バックエンド経由）
    // ===========================
    async function createPickerSession(token) {
        const res = await fetch('/api/picker/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: token })
        });
        if (!res.ok) throw new Error('Pickerセッションの作成に失敗しました。');
        return await res.json();  // { id, pickerUri, ... }
    }

    // ===========================
    // 4. セッションのポーリング（選択完了を待つ）
    // ===========================
    async function pollSession(sessionId, token) {
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/picker/session/${sessionId}?accessToken=${token}`);
                    const data = await res.json();

                    // mediaItemsSet が true になったら選択完了
                    if (data.mediaItemsSet) {
                        clearInterval(interval);
                        resolve(data);
                    }
                } catch (err) {
                    clearInterval(interval);
                    reject(err);
                }
            }, 2000); // 2秒ごとにチェック

            pollTimer = interval;

            // 5分でタイムアウト
            setTimeout(() => {
                clearInterval(interval);
                reject(new Error('写真の選択がタイムアウトしました。'));
            }, 300000);
        });
    }

    // ===========================
    // 5. 選択されたメディアアイテムの取得
    // ===========================
    async function getSelectedMedia(sessionId, token) {
        const res = await fetch(`/api/picker/media/${sessionId}?accessToken=${token}`);
        if (!res.ok) throw new Error('メディアアイテムの取得に失敗しました。');
        const data = await res.json();
        return data.mediaItems || [];
    }

    // ===========================
    // 写真選択ボタンのクリックイベント
    // ===========================
    btnPickPhotos.addEventListener('click', async () => {
        btnPickPhotos.disabled = true;
        btnPickPhotos.textContent = '認証中...';
        showStatus('Googleアカウントで認証しています...', 'info');

        try {
            // 認証
            accessToken = await getAccessToken();

            // Pickerセッション作成
            showStatus('写真選択画面を準備しています...', 'info');
            const session = await createPickerSession(accessToken);

            // 選択画面を新しいタブで開く
            const pickerWin = window.open(session.pickerUri, '_blank', 'width=1080,height=700');

            showStatus('📷 Google Photosで写真を選択し、「完了」を押すと自動で閉じます...', 'info');
            btnPickPhotos.textContent = '選択中...';

            // ポーリング（選択完了待ち）
            await pollSession(session.id, accessToken);

            // 選択されたメディアを取得
            const mediaItems = await getSelectedMedia(session.id, accessToken);

            // フロントエンド用にデータを整形
            selectedPhotos = mediaItems.map(item => ({
                id: item.id,
                url: item.mediaFile?.baseUrl || '',
                filename: item.mediaFile?.filename || item.id,
                mimeType: item.mediaFile?.mimeType || 'image/jpeg'
            }));

            if (pickerWin && !pickerWin.closed) {
                pickerWin.close();
            }

            renderPreview();
            showStatus(`✅ ${selectedPhotos.length} 枚の写真が選択されました。`, 'success');
        } catch (err) {
            console.error('Picker Error:', err);
            showStatus('エラー: ' + err.message, 'error');
        } finally {
            btnPickPhotos.disabled = false;
            btnPickPhotos.textContent = 'Google Photosを開く';
        }
    });

    // ===========================
    // 写真プレビューの描画
    // ===========================
    function renderPreview() {
        selectedPhotosPreview.innerHTML = '';
        selectedPhotos.forEach((photo, i) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-item';

            if (photo.url) {
                const img = document.createElement('img');
                img.src = photo.url + '=w200';  // Googleフォトは=w200でサイズ指定可能
                img.alt = photo.filename;
                img.title = photo.filename;
                wrapper.appendChild(img);
            } else {
                wrapper.innerHTML = `<div class="no-preview">📷 ${i + 1}</div>`;
            }

            selectedPhotosPreview.appendChild(wrapper);
        });
    }

    // ===========================
    // 記事生成フォームの送信
    // ===========================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (selectedPhotos.length === 0) {
            showStatus('⚠️ 写真を1枚以上選択してください。', 'error');
            return;
        }

        const date = document.getElementById('article-date').value;
        const title = document.getElementById('article-title').value;
        const content = document.getElementById('article-content').value;

        if (!/^\d{8}$/.test(date)) {
            showStatus('⚠️ 日付は YYYYMMDD 形式（例: 20190804）で入力してください。', 'error');
            return;
        }

        btnGenerate.disabled = true;
        showStatus('🔄 記事を生成中...', 'info');

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, title, content, photos: selectedPhotos, accessToken })
            });

            const result = await response.json();

            if (result.success) {
                showStatus(`🎉 ${result.message}`, 'success');
                selectedPhotos = [];
                selectedPhotosPreview.innerHTML = '';
                form.reset();
            } else {
                showStatus('❌ ' + (result.error || '生成に失敗しました。'), 'error');
            }
        } catch (err) {
            showStatus('❌ サーバーとの通信に失敗しました: ' + err.message, 'error');
        } finally {
            btnGenerate.disabled = false;
        }
    });

    // ===========================
    // ステータスメッセージの表示
    // ===========================
    function showStatus(text, type) {
        statusMessage.textContent = text;
        statusMessage.className = `status-message ${type}`;
        statusMessage.classList.remove('hidden');
    }
});
