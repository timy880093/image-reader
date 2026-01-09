# 快速遷移指南

## 當前狀態

✅ **後端重構完成** (100%)
- 核心模組、服務層、路由層全部完成
- Blueprint 架構已就緒
- 可以立即啟動測試

✅ **前端框架完成** (60%)
- 基礎模板和共用資源完成
- 漫畫列表頁面完成
- PIXIV 和閱讀器頁面待完成

---

## 🚀 立即運行新架構

### 方式一：直接運行新版本（推薦測試）

```bash
# 進入項目目錄
cd e:\_code\vibe\rouman-grapper\manga_reader

# 運行新版本應用程式
python app_new.py

# 瀏覽器訪問
# http://127.0.0.1:5000/manga
```

### 方式二：完全遷移（建議先測試再執行）

```bash
# 1. 備份舊文件
mv app.py app_old.py
mkdir templates_old
mv templates/index.html templates_old/
mv templates/reader.html templates_old/

# 2. 啟用新版本
mv app_new.py app.py

# 3. 運行
python app.py
```

---

## 📋 完成 reader.html 的步驟

由於 reader.html 文件較大且複雜，建議分步完成：

### 步驟 1：提取並創建 manga-reader.css

從原 `templates/reader.html` 中的 `<style>` 區塊（第7-316行）複製所有 CSS 到新文件：

```bash
# 創建文件：static/css/manga-reader.css
# 複製原 reader.html 第 7-316 行的內容
```

### 步驟 2：創建 manga/reader.html 模板

```html
{% extends "base.html" %}

{% block title %}漫畫閱讀器{% endblock %}

{% block styles %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/manga-reader.css') }}">
{% endblock %}

{% block content %}
<!-- 從原 reader.html 的 <body> 區塊複製 HTML 結構 -->
<!-- 移除所有 {{ category }} 相關的條件判斷 -->
{% endblock %}

{% block scripts %}
<script src="{{ url_for('static', filename='js/manga/reader.js') }}"></script>
{% endblock %}
```

### 步驟 3：創建 manga/reader.js

從原 `templates/reader.html` 中的 `<script>` 區塊（第358-1080行）複製 JavaScript：

```javascript
// 文件：static/js/manga/reader.js

// 移除以下代碼片段：
// const pathParts = window.location.pathname.split('/');
// this.category = pathParts[1]; // 'manga' 或 'pixiv'

// 替換為：
const CATEGORY = 'manga';
const API_CHAPTER_ENDPOINT = '/manga/api/chapter/';
const IMAGE_PREFIX = '/manga/image/';
const READER_PREFIX = '/manga/reader/';

// 其餘邏輯保持不變，但移除所有 category 相關的條件判斷
```

---

## 🎨 完成 PIXIV 模組的步驟

PIXIV 模組與漫畫模組類似，主要差異：

### 差異點

1. **列表頁每頁顯示數量**：6 個（vs 漫畫的 50 個）
2. **圖片載入策略**：懶加載 + 分頁（vs 漫畫的順序載入）
3. **API 路徑**：`/pixiv/api/*` （vs `/manga/api/*`）

### 快速方法

```bash
# 1. 複製漫畫模組的前端文件
cp static/css/manga.css static/css/pixiv.css
cp static/css/manga-reader.css static/css/pixiv-reader.css
cp modules/manga/templates/manga/index.html modules/pixiv/templates/pixiv/index.html
cp static/js/manga/index.js static/js/pixiv/index.js

# 2. 在每個複製的文件中執行搜尋替換
# - 將 /manga/ 替換為 /pixiv/
# - 將 manga 替換為 pixiv
# - 調整 per_page 從 50 改為 6
# - 調整圖片載入邏輯（reader.js）
```

---

## 🧪 測試清單

### 後端測試

```bash
# 測試漫畫 API
curl http://127.0.0.1:5000/manga/api/list?page=1&per_page=10

# 測試 PIXIV API
curl http://127.0.0.1:5000/pixiv/api/list?page=1&per_page=6

# 測試配置 API
curl http://127.0.0.1:5000/api/config
```

### 前端測試

1. ✅ 漫畫列表頁面載入
2. ✅ 搜尋功能
3. ✅ 無限滾動
4. ⏸️ 漫畫閱讀器
5. ⏸️ PIXIV 列表頁面
6. ⏸️ PIXIV 閱讀器

---

## 🔍 故障排除

### 問題 1：Import 錯誤

```python
# 確保所有 __init__.py 文件存在
touch core/__init__.py
touch modules/__init__.py
touch modules/manga/__init__.py
touch modules/pixiv/__init__.py
```

### 問題 2：模板找不到

```python
# 確保模板路徑正確
# Blueprint 會在 template_folder 參數指定的目錄中查找
# 例如：template_folder='templates' 會在 modules/manga/templates/ 中查找
```

### 問題 3：靜態文件 404

```python
# 確保靜態文件路徑正確
# Flask 會在項目根目錄的 static/ 文件夾中查找
# 例如：url_for('static', filename='css/common.css')
# 會映射到：manga_reader/static/css/common.css
```

---

## 💡 進階優化建議

### 1. 添加單元測試

```python
# tests/test_manga_service.py
import unittest
from modules.manga.service import MangaService

class TestMangaService(unittest.TestCase):
    def test_get_manga_list(self):
        # 測試代碼
        pass
```

### 2. 添加 API 文檔

使用 Flask-RESTX 或 Swagger 自動生成 API 文檔

### 3. 添加緩存層

使用 Redis 或 Flask-Caching 提升性能

### 4. 添加用戶認證

如果需要多用戶支持，可以添加 Flask-Login

---

## 📞 需要幫助？

如果在遷移過程中遇到問題，可以：

1. 查看 `REFACTORING_REPORT.md` 了解完整架構
2. 檢查 `app_new.py` 了解 Blueprint 註冊方式
3. 參考已完成的漫畫列表頁面 (`modules/manga/templates/manga/index.html`)
4. 運行 `python app_new.py` 測試後端 API 是否正常

---

## ✨ 新架構的好處

1. **獨立開發**：可以同時開發漫畫和 PIXIV 功能而不互相干擾
2. **易於測試**：每個模組可以獨立測試
3. **易於擴展**：新增其他類型（如小說、音樂等）只需創建新模組
4. **代碼複用**：共用邏輯統一管理，減少重複代碼
5. **性能優化**：靜態資源分離，可以單獨優化和緩存

開始享受新架構帶來的便利吧！🎉
