# Gallery 特殊標籤參數化說明

## 📌 概述

Gallery 模組的特殊標籤功能已完全參數化，所有相關配置都在 `config.toml` 中設定，代碼中不再有硬編碼的註解和標籤名稱。

## ⚙️ 配置參數

在 `config.toml` 的 `[gallery]` 區段中，有以下參數：

```toml
[gallery]
# 特殊標籤設定
special_tag_name = "⭐ 精選"  # 特殊標籤名稱（用於篩選按鈕顯示，可包含 emoji）
special_tag_marker = ".special"  # 特殊標籤標記檔案名稱（存在此檔案的資料夾會被標記）
```

### 參數說明

| 參數 | 說明 | 範例 |
|------|------|------|
| `special_tag_name` | 在 UI 上顯示的標籤名稱，支援 emoji 和任意文字 | `"⭐ 精選"`, `"💎 最愛"`, `"🔥 熱門"` |
| `special_tag_marker` | 標記檔案的名稱,帶此檔案的資料夾會被識別為特殊標籤 | `".special"`, `".favorite"`, `".featured"` |

## 🎯 使用方式

### 1. 自訂標籤名稱和圖示

修改 `config.toml`：

```toml
# 範例 1: 改成「最愛」標籤
special_tag_name = "💎 最愛"
special_tag_marker = ".favorite"

# 範例 2: 改成「熱門」標籤
special_tag_name = "🔥 熱門"
special_tag_marker = ".hot"

# 範例 3: 純文字標籤
special_tag_name = "Favorite"
special_tag_marker = ".fav"
```

### 2. 標記作品資料夾

在想要標記的作品資料夾中，創建一個與 `special_tag_marker` 同名的空檔案：

**Windows PowerShell:**
```powershell
# 進入作品資料夾
cd "E:\test\pixiv\作品名稱"

# 創建標記檔案（使用你在 config.toml 中設定的名稱）
New-Item -ItemType File -Name ".special"
```

**Linux/Mac:**
```bash
# 進入作品資料夾
cd /path/to/gallery/作品名稱

# 創建標記檔案（使用你在 config.toml 中設定的名稱）
touch .special
```

### 3. 重啟服務器

修改配置後，重啟服務器使變更生效：

```bash
# 停止服務器 (Ctrl+C)
# 重新啟動
python src/app.py
```

## 🔧 技術實現

### 後端 (Service 層)

`src/modules/gallery/service.py`:
```python
def has_marker_file(self, work_path, marker_name=None):
    """檢查作品資料夾內是否含有指定的標記檔案"""
    if marker_name is None:
        # 從配置讀取
        marker_name = self.config.get('gallery', {}).get('special_tag_marker', '.gallery神')
    work_path = Path(work_path)
    marker_file = work_path / marker_name
    return marker_file.exists()
```

### 路由層

`src/modules/gallery/routes.py`:
```python
@gallery_bp.route('/')
def index():
    """Gallery 列表頁面"""
    ui_config = gallery_service.config.get('ui', {})
    gallery_config = gallery_service.config.get('gallery', {})
    return render_template(
        'gallery/index.html',
        category='gallery',
        title='Gallery作品閱讀器',
        ui_config=ui_config,
        gallery_config=gallery_config  # 傳遞 Gallery 配置到模板
    )
```

### 前端 (Template)

`src/modules/gallery/templates/gallery/index.html`:
```html
<div class="filter-tags">
    <button id="filterAll" class="filter-btn active" onclick="setFilter(null)">全部</button>
    <button id="filterGod" class="filter-btn" 
            onclick="setFilter('{{ gallery_config.get('special_tag_marker', '.gallery神') }}')">
        {{ gallery_config.get('special_tag_name', '⭐ gallery神') }}
    </button>
</div>
```

## ✅ 優點

1. **靈活性**：可以隨時更改標籤名稱和圖示，無需修改代碼
2. **可維護性**：所有配置集中在 `config.toml`，易於管理
3. **國際化**：可以輕鬆切換不同語言的標籤名稱
4. **無硬編碼**：代碼中沒有寫死的標籤名稱，符合最佳實踐
5. **向後兼容**：使用預設值確保即使配置缺失也能正常運作

## 📝 注意事項

1. 修改 `special_tag_marker` 後，需要在資料夾中創建新的標記檔案
2. 舊的標記檔案不會自動刪除，需要手動清理
3. `special_tag_name` 支援 emoji，但請確保使用 UTF-8 編碼
4. 標記檔案可以是空檔案，系統只檢查檔案是否存在

## 🛠️ 管理工具

專案根目錄提供了 `manage_gallery_tags.ps1` 腳本來管理標籤：

```powershell
# 列出所有已標記的作品
.\manage_gallery_tags.ps1 list

# 為作品添加標記
.\manage_gallery_tags.ps1 add "作品名稱"

# 移除作品標記
.\manage_gallery_tags.ps1 remove "作品名稱"
```

## 🐛 故障排除

### 問題：點擊精選按鈕沒有反應

**解決方法：**
1. 確認配置文件中的 `special_tag_marker` 值正確
2. 確認資料夾中有對應的標記檔案
3. 重啟服務器

**測試指令：**
```powershell
# 檢查是否有標記檔案（使用你的標記檔案名稱）
Get-ChildItem -Path "E:\test\pixiv" -Filter ".special" -Recurse -Force

# 測試 API（使用你的標記檔案名稱）
curl "http://127.0.0.1:5000/gallery/api/list?page=1&per_page=6&filter_tag=.special"
```

### 問題：按鈕顯示錯誤的名稱

**解決方法：**
1. 檢查 `config.toml` 中的 `special_tag_name` 值
2. 確認使用 UTF-8 編碼儲存配置文件
3. 重啟服務器

