# 🐛 修復：無法打開漫畫的問題

## 問題描述
點擊漫畫資料夾後，彈出「無法打開此漫畫」的錯誤提示。

## 🔍 根本原因

發現了 **兩個錯誤**：

### 錯誤 1: 缺少 `apiPrefix` 變數
**位置**: `index.html` 第 306 行附近

**問題**:
```javascript
// 缺少 apiPrefix 定義
const apiEndpoint = currentCategory === 'pixiv' ? '/api/pixiv/list' : '/api/manga/list';
```

**修復**:
```javascript
const apiPrefix = currentCategory === 'pixiv' ? '/api/pixiv' : '/api/manga';
const apiEndpoint = currentCategory === 'pixiv' ? '/api/pixiv/list' : '/api/manga/list';
```

### 錯誤 2: URL 路徑重複
**位置**: `index.html` 第 477 行的 `openManga` 函數

**問題**:
```javascript
// apiPrefix 已經是 '/api/manga'
// 這樣會變成 '/api/manga/manga/detail/...'
const response = await fetch(`${apiPrefix}/manga/detail/${encodeURIComponent(mangaPath)}`);
```

**修復**:
```javascript
// 正確的路徑：'/api/manga/detail/...'
const response = await fetch(`${apiPrefix}/detail/${encodeURIComponent(mangaPath)}`);
```

## ✅ 修復後的完整代碼

### 變數定義部分
```javascript
let allMangas = [];
let config = {};
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
const currentCategory = '{{ category }}';
const apiPrefix = currentCategory === 'pixiv' ? '/api/pixiv' : '/api/manga';  // ✅ 新增
const apiEndpoint = currentCategory === 'pixiv' ? '/api/pixiv/list' : '/api/manga/list';
const imagePrefix = currentCategory === 'pixiv' ? '/pixiv/image/' : '/manga/image/';
const readerPrefix = currentCategory === 'pixiv' ? '/pixiv/reader/' : '/manga/reader/';
```

### openManga 函數
```javascript
async function openManga(mangaPath) {
    const manga = allMangas.find(m => m.path === mangaPath);
    if (!manga) return;
    
    // 如果已經有章節列表，直接打開第一個章節
    if (manga.chapters && manga.chapters.length > 0) {
        openChapter(manga.chapters[0].path);
        return;
    }
    
    // 如果沒有章節列表，先獲取章節信息
    try {
        // ✅ 修正：直接使用 ${apiPrefix}/detail/
        const response = await fetch(`${apiPrefix}/detail/${encodeURIComponent(mangaPath)}`);
        if (!response.ok) throw new Error('無法獲取章節信息');
        
        const detail = await response.json();
        if (detail.chapters && detail.chapters.length > 0) {
            openChapter(detail.chapters[0].path);
        } else {
            alert('此漫畫沒有可用的章節');
        }
    } catch (error) {
        console.error('獲取章節信息失敗:', error);
        alert('無法打開此漫畫，請稍後再試');
    }
}
```

## 📊 URL 路徑對照表

### 修復前（錯誤）
| 分類 | apiPrefix | 調用 | 最終 URL | 結果 |
|------|-----------|------|----------|------|
| manga | `/api/manga` | `${apiPrefix}/manga/detail/測試` | `/api/manga/manga/detail/測試` | ❌ 404 |
| pixiv | `/api/pixiv` | `${apiPrefix}/pixiv/detail/測試` | `/api/pixiv/pixiv/detail/測試` | ❌ 404 |

### 修復後（正確）
| 分類 | apiPrefix | 調用 | 最終 URL | 結果 |
|------|-----------|------|----------|------|
| manga | `/api/manga` | `${apiPrefix}/detail/測試` | `/api/manga/detail/測試` | ✅ 200 |
| pixiv | `/api/pixiv` | `${apiPrefix}/detail/測試` | `/api/pixiv/detail/測試` | ✅ 200 |

## 🧪 測試驗證

### 1. 瀏覽器測試
```javascript
// 在瀏覽器 Console 中執行
console.log('apiPrefix:', apiPrefix);  // 應該顯示 '/api/manga' 或 '/api/pixiv'

// 測試 API 調用
fetch(`${apiPrefix}/detail/測試漫畫`)
  .then(r => r.json())
  .then(d => console.log('詳情:', d))
  .catch(e => console.error('錯誤:', e));
```

### 2. 手動測試
1. 訪問 `http://localhost:5000/manga`
2. 點擊任意漫畫資料夾
3. 應該能正常進入閱讀器

### 3. 檢查 Network 標籤
在開發者工具的 Network 標籤中，應該看到：
- ✅ `/api/manga/detail/漫畫名稱` 返回 200
- ❌ 不應該看到 `/api/manga/manga/detail/...` 的請求

## 🎯 預期行為

### 點擊漫畫資料夾後
1. 執行 `openManga('漫畫名稱')`
2. 檢查是否有章節列表
3. 如果沒有，調用 `/api/manga/detail/漫畫名稱`
4. 獲取章節列表
5. 跳轉到第一個章節的閱讀器頁面

### API 響應示例
```json
{
  "name": "測試漫畫",
  "path": "測試漫畫",
  "chapters": [
    {
      "name": "第1話",
      "path": "測試漫畫/第1話",
      "image_count": 20
    },
    {
      "name": "第2話",
      "path": "測試漫畫/第2話",
      "image_count": 18
    }
  ]
}
```

## 📝 相關文件

- ✅ `manga_reader/templates/index.html` - 已修復
- ✅ `manga_reader/app.py` - API 端點已存在

## 🚀 現在應該可以正常使用了！

如果還有問題，請：
1. 清除瀏覽器緩存（Ctrl + F5）
2. 重啟應用
3. 查看瀏覽器 Console 的錯誤訊息
