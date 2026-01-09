# 本地漫畫閱讀器

一個簡單且功能豐富的本地漫畫閱讀網站，使用 Flask 構建，支援在本地運行。

## 專案結構

```
manga-reader/
├── .gitignore              # Git 忽略檔案
├── README.md               # 主要文檔
├── requirements.txt        # Python 依賴
├── config.toml             # 配置檔案
├── start.bat               # Windows 啟動腳本
├── start.sh                # Linux/Mac 啟動腳本
├── docs/                   # 開發文檔
├── tests/                  # 測試檔案
├── prompt/                 # AI 提示詞
└── src/                    # 源碼目錄
    ├── app.py              # 主程式入口
    ├── config.py           # 配置管理
    ├── core/               # 核心模組
    ├── modules/            # 功能模組
    │   ├── manga/          # 漫畫模組
    │   └── gallery/          # Gallery 模組
    ├── static/             # 靜態資源 (CSS, JS)
    └── templates/          # HTML 模板
```

## 功能特色

### 📚 漫畫管理
- 自動掃描指定目錄下的漫畫資料夾
- 支援巢狀目錄結構（漫畫/章節/圖片）
- 智能識別章節和頁數
- 即時搜尋功能

### 🖼️ 閱讀體驗
- **一頁式顯示**：專注的閱讀體驗
- **鍵盤導航**：方向鍵翻頁，空白鍵下一頁
- **滑鼠操作**：點擊左右側翻頁
- **觸控支援**：適配平板和手機
- **縮放功能**：滾輪縮放，拖曳移動
- **縮圖預覽**：快速跳轉到任意頁面

### 🎨 界面設計
- 現代化響應式設計
- 深色主題，護眼舒適
- 自動隱藏工具列
- 美觀的漸變背景
- 移動裝置優化

## 系統需求

- Python 3.7+
- 現代網頁瀏覽器（Chrome、Firefox、Edge、Safari）

## 安裝和使用

### 方式一：使用啟動腳本（推薦）

**Windows:**
```bash
# 雙擊 start.bat 或在命令列執行
.\start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### 方式二：手動啟動

```bash
# 1. 建立虛擬環境
python -m venv venv

# 2. 啟用虛擬環境
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. 安裝依賴
pip install -r requirements.txt

# 4. 進入 src 目錄並啟動
cd src
python app.py
```

### 配置漫畫路徑

**首次使用請先配置：**

1. 複製 `config.toml.example` 為 `config.toml`
   ```bash
   # Windows PowerShell
   Copy-Item config.toml.example config.toml
   
   # Linux/Mac
   cp config.toml.example config.toml
   ```

2. 編輯 `config.toml` 設定你的路徑和密鑰：

   ```toml
   [server]
   secret_key = "your-unique-secret-key-here"  # 請更改為唯一密鑰
   
   [manga]
   root_path = "E:/test/manga"                # 你的漫畫根目錄
   gallery_root_path = "E:/test/pixiv"        # 你的 Gallery 作品目錄
   ```

> ⚠️ **注意**：`config.toml` 包含本地路徑和密鑰，已加入 `.gitignore`，不會被推送到 Git。

### 開啟瀏覽器

訪問 http://localhost:5000 開始使用

## 目錄結構要求

您的漫畫資料夾應該按照以下結構組織：

```
E:\test\manga\
├── 漫畫A\
│   ├── 第01話\
│   │   ├── 001.jpg
│   │   ├── 002.jpg
│   │   └── ...
│   ├── 第02話\
│   │   ├── 001.jpg
│   │   └── ...
│   └── ...
├── 漫畫B\
│   ├── Ch001\
│   │   ├── page01.png
│   │   └── ...
│   └── ...
└── 單行本漫畫\
    ├── 001.jpg
    ├── 002.jpg
    └── ...
```

### 支援的格式
- **圖片格式**：JPG、JPEG、PNG、GIF、WebP、BMP
- **目錄結構**：
  - 有章節：漫畫名稱/章節名稱/圖片檔案
  - 單行本：漫畫名稱/圖片檔案

## 操作指南

### 主頁操作
- **搜尋**：在搜尋框輸入關鍵字過濾漫畫
- **選擇漫畫**：點擊漫畫卡片開啟第一章
- **選擇章節**：點擊特定章節開啟

### 閱讀器操作
- **翻頁**：
  - 鍵盤：← → 方向鍵、空白鍵
  - 滑鼠：點擊圖片左右兩側
  - 導航按鈕：點擊 ‹ › 按鈕
- **縮放**：
  - 滑鼠滾輪放大縮小
  - 放大後可拖曳移動
  - 按 ESC 或點擊圖片重置縮放
- **縮圖**：點擊「縮圖」按鈕顯示頁面預覽
- **返回**：點擊「← 返回」回到主頁

### 快捷鍵
- `→` 或 `Space`：下一頁
- `←`：上一頁
- `Home`：跳到第一頁
- `End`：跳到最後一頁
- `ESC`：重置縮放

## 技術架構

### 後端
- **Flask**：輕量級 Web 框架
- **Python 3**：後端邏輯處理
- **Pathlib**：檔案路徑處理
- **自然排序**：正確排序包含數字的檔案名

### 前端
- **原生 JavaScript**：無依賴的客戶端邏輯
- **CSS3**：現代化樣式和動畫
- **響應式設計**：適配各種螢幕尺寸
- **PWA 特性**：流暢的使用體驗

### API 端點
- `GET /`：主頁
- `GET /api/mangas`：取得所有漫畫列表
- `GET /api/manga/<path>`：取得特定漫畫詳情
- `GET /api/chapter/<path>`：取得章節圖片列表
- `GET /image/<path>`：提供圖片檔案
- `GET /reader/<path>`：閱讀器頁面

## 自定義配置

### 修改連接埠
在 `app.py` 的最後一行修改：
```python
app.run(debug=True, host='127.0.0.1', port=5000)  # 修改 port 值
```

### 修改支援的圖片格式
在 `app.py` 中修改 `IMAGE_EXTENSIONS`：
```python
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
```

### 安全性設定
生產環境部署時，請修改 `SECRET_KEY` 為隨機字串：
```python
app.config['SECRET_KEY'] = 'your-secret-key-here'
```

## 故障排除

### 常見問題

1. **無法載入漫畫**
   - 檢查漫畫路徑是否正確
   - 確認資料夾結構符合要求
   - 檢查檔案權限

2. **圖片無法顯示**
   - 確認圖片格式在支援列表中
   - 檢查檔案是否損壞
   - 確認路徑中沒有特殊字符

3. **頁面載入緩慢**
   - 考慮壓縮大圖片
   - 檢查硬碟讀取速度
   - 關閉不必要的背景程式

### 日誌查看
應用程式會在終端機顯示運行資訊，包括錯誤和存取記錄。

## 開發和擴展

### 添加新功能
1. 修改 Flask 路由（`app.py`）
2. 更新前端介面（`templates/` 目錄）
3. 添加必要的 CSS 和 JavaScript

### 資料庫支援
如需添加書籤、閱讀記錄等功能，可集成 SQLite 資料庫：
```bash
pip install flask-sqlalchemy
```

## 授權

本專案採用 MIT 授權條款。您可以自由使用、修改和分發。

## 支援

如果您遇到問題或有功能建議，歡迎建立 Issue 或 Pull Request。

---

享受您的漫畫閱讀時光！ 📖✨

## 啟動指令

```bash
# 從專案根目錄啟動
cd src && python app.py

# 或使用啟動腳本
.\start.bat      # Windows
./start.sh       # Linux/Mac
```