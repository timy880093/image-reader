# Home 按鈕功能說明

## 📋 功能概述

在所有頁面的左上角添加一個固定的 Home 按鈕，點擊後可以快速返回首頁。

## ✨ 功能特點

### 1. 固定位置
- 位於左上角（距離頂部 20px，距離左側 20px）
- 使用 `position: fixed` 固定在視窗上
- `z-index: 9999` 確保在最上層

### 2. 視覺設計
- 圓形按鈕（50x50 像素）
- 紫藍色漸變背景（`rgba(102, 126, 234, 0.9)`）
- 白色房子圖標（SVG）
- 半透明背景 + 毛玻璃效果（`backdrop-filter: blur(10px)`）
- 陰影效果增強立體感

### 3. 互動效果
- **Hover**：背景變為不透明，按鈕放大 1.1 倍，陰影增強
- **Active**：按鈕縮小至 0.95 倍
- **Tooltip**：滑鼠懸停顯示「回到首頁」

### 4. 響應式設計
- 桌面版：50x50 像素，圖標 28x28 像素
- 移動版：45x45 像素，圖標 24x24 像素

## 🔧 技術實現

### 1. `src/templates/base.html`

在 `<body>` 標籤後立即添加 Home 按鈕：

```html
<body>
    <!-- Home 按鈕 -->
    <a href="/" class="home-button" title="回到首頁">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
    </a>
    
    {% block content %}{% endblock %}
    ...
</body>
```

**說明：**
- 使用 `<a>` 標籤，`href="/"` 指向首頁
- SVG 圖標使用 Material Design 的 Home 圖標
- `title` 屬性提供 tooltip

### 2. `src/static/css/common.css`

添加 Home 按鈕樣式：

```css
/* Home 按鈕 */
.home-button {
    position: fixed;
    top: 20px;
    left: 20px;
    width: 50px;
    height: 50px;
    background: rgba(102, 126, 234, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    z-index: 9999;
    backdrop-filter: blur(10px);
}

.home-button:hover {
    background: rgba(102, 126, 234, 1);
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.home-button:active {
    transform: scale(0.95);
}

.home-button svg {
    width: 28px;
    height: 28px;
}

/* 響應式調整 */
@media (max-width: 768px) {
    .home-button {
        width: 45px;
        height: 45px;
        top: 15px;
        left: 15px;
    }
    
    .home-button svg {
        width: 24px;
        height: 24px;
    }
}
```

### 3. `src/app.py`

首頁路由已存在：

```python
@app.route('/')
def index():
    """首頁：重定向到漫畫列表"""
    return redirect('/manga')
```

## 🎨 設計細節

### 顏色方案

| 狀態 | 背景色 | 透明度 | 陰影 |
|------|--------|--------|------|
| 正常 | `#667eea` | 0.9 | `0 4px 12px rgba(0,0,0,0.3)` |
| Hover | `#667eea` | 1.0 | `0 6px 20px rgba(102,126,234,0.5)` |
| Active | `#667eea` | 1.0 | 同 Hover |

### 尺寸規格

| 設備 | 按鈕大小 | 圖標大小 | 位置 |
|------|---------|---------|------|
| 桌面 | 50x50px | 28x28px | top:20px, left:20px |
| 移動 | 45x45px | 24x24px | top:15px, left:15px |

### 動畫效果

| 效果 | 屬性 | 值 | 時長 |
|------|------|-----|------|
| Hover 放大 | `transform: scale()` | 1.1 | 0.3s |
| Active 縮小 | `transform: scale()` | 0.95 | 0.3s |
| 背景變化 | `background` | 透明度變化 | 0.3s |
| 陰影變化 | `box-shadow` | 擴散增強 | 0.3s |

## 📱 各頁面效果

### 1. 漫畫列表頁 (`/manga`)
- Home 按鈕顯示在左上角
- 不影響現有的導航選單
- 點擊返回首頁（重新載入漫畫列表）

### 2. Gallery 列表頁 (`/gallery`)
- Home 按鈕顯示在左上角
- 點擊返回首頁（跳轉到漫畫列表）

### 3. 漫畫閱讀器 (`/manga/reader/...`)
- Home 按鈕顯示在左上角
- 不與工具列的「回到目錄」按鈕衝突
- 點擊直接返回首頁

### 4. Gallery 閱讀器 (`/gallery/reader/...`)
- Home 按鈕顯示在左上角
- 不與工具列的「回到目錄」按鈕衝突
- 點擊直接返回首頁

## 🎯 使用場景

### 場景 1：從閱讀器快速返回
用戶在閱讀漫畫時，想要返回首頁查看其他漫畫：
1. 點擊左上角 Home 按鈕
2. 直接跳轉到首頁（漫畫列表）

### 場景 2：從 Gallery 返回漫畫列表
用戶在瀏覽 Gallery 時，想要切換到漫畫：
1. 點擊左上角 Home 按鈕
2. 返回首頁（漫畫列表）
3. 或使用導航選單切換

### 場景 3：深層頁面快速返回
用戶在多層導航後，想要快速返回起點：
1. 點擊 Home 按鈕
2. 一鍵返回首頁

## 🔍 與現有功能的關係

### 不衝突的元素

1. **導航選單**（`/manga` 和 `/gallery` 頁面）
   - 位於頁面中央
   - Home 按鈕在左上角
   - 互不干擾

2. **工具列按鈕**（Reader 頁面）
   - 工具列在頂部中央
   - Home 按鈕在左上角
   - 功能互補：
     - 「回到目錄」= 返回當前模組列表
     - Home 按鈕 = 返回首頁

3. **收藏按鈕**（Reader 頁面）
   - 位於右上角
   - Home 按鈕在左上角
   - 位置對稱

4. **篩選按鈕**（列表頁面）
   - 位於搜尋框下方
   - Home 按鈕在左上角
   - 不重疊

## 🎨 視覺層級

```
z-index 層級：
┌─────────────────────────────────┐
│ 9999: Home 按鈕（最上層）        │
├─────────────────────────────────┤
│ 1000: Reader 工具列              │
├─────────────────────────────────┤
│ 100: 收藏按鈕                    │
├─────────────────────────────────┤
│ 10: 漫畫卡片                     │
├─────────────────────────────────┤
│ 1: 背景                          │
└─────────────────────────────────┘
```

## 🐛 潛在問題和解決方案

### 問題 1：與左上角內容重疊

**情況：** 某些頁面左上角有其他元素

**解決方案：**
- Home 按鈕使用 `position: fixed`，脫離文檔流
- `z-index: 9999` 確保在最上層
- 如需調整位置，修改 `top` 和 `left` 值

### 問題 2：移動設備上按鈕太小

**解決方案：**
- 已實現響應式設計
- 移動設備上按鈕為 45x45px（符合觸控標準）
- 可進一步調整 `@media` 查詢

### 問題 3：顏色與背景衝突

**解決方案：**
- 使用半透明背景 + 毛玻璃效果
- 白色圖標在任何背景上都清晰可見
- 陰影增強對比度

### 問題 4：點擊區域太小

**解決方案：**
- 整個圓形按鈕都是可點擊區域（50x50px）
- 符合 WCAG 可訪問性標準（最小 44x44px）

## ✅ 測試檢查清單

### 視覺測試
- [ ] Home 按鈕顯示在左上角
- [ ] 圓形按鈕，紫藍色背景
- [ ] 白色房子圖標清晰可見
- [ ] 陰影效果正常

### 互動測試
- [ ] Hover 時按鈕放大
- [ ] Hover 時背景變為不透明
- [ ] Hover 時陰影增強
- [ ] Active 時按鈕縮小
- [ ] Tooltip 顯示「回到首頁」

### 功能測試
- [ ] 點擊後跳轉到首頁（`/manga`）
- [ ] 在漫畫列表頁點擊正常
- [ ] 在 Gallery 列表頁點擊正常
- [ ] 在漫畫閱讀器點擊正常
- [ ] 在 Gallery 閱讀器點擊正常

### 響應式測試
- [ ] 桌面版（>768px）：50x50px
- [ ] 移動版（≤768px）：45x45px
- [ ] 平板版正常顯示
- [ ] 不與其他元素重疊

### 瀏覽器兼容性
- [ ] Chrome/Edge 正常
- [ ] Firefox 正常
- [ ] Safari 正常
- [ ] 移動瀏覽器正常

### 可訪問性
- [ ] 鍵盤可訪問（Tab 鍵）
- [ ] Tooltip 正確顯示
- [ ] 對比度符合 WCAG 標準
- [ ] 觸控區域足夠大

## 🎉 完成狀態

功能已完整實現：
- ✅ 在 base.html 添加 Home 按鈕
- ✅ 使用 SVG 圖標
- ✅ 固定在左上角
- ✅ 響應式設計
- ✅ Hover 和 Active 效果
- ✅ 所有頁面通用
- ✅ 不與現有功能衝突

## 📚 相關文件

- `src/templates/base.html` - 基礎模板
- `src/static/css/common.css` - 共用樣式
- `src/app.py` - 首頁路由

## 🔄 未來優化建議

1. **添加動畫**
   - 頁面載入時從左側滑入
   - 點擊時波紋效果

2. **自定義圖標**
   - 支援配置不同的圖標
   - 支援上傳自定義圖片

3. **位置可配置**
   - 允許用戶選擇左上/右上/左下/右下
   - 在配置文件中設定

4. **快捷鍵支援**
   - 按 `H` 鍵返回首頁
   - 按 `Esc` 鍵返回上一頁

5. **麵包屑導航**
   - 顯示當前位置
   - 點擊可跳轉到任意層級
