# 設定檢查清單

## Docker 部署（推薦新用戶）

### ✅ 必須完成
- [ ] 安裝 Docker Desktop
- [ ] 複製 `config.docker.toml` 為 `config.toml`
- [ ] 修改 `config.toml` 中的 `secret_key`
- [ ] 編輯 `docker-compose.yml` 設定漫畫目錄路徑
- [ ] 執行 `docker-compose up -d`
- [ ] 開啟 http://localhost:5000

### 📝 配置範例

**config.toml**
```toml
[server]
secret_key = "my-random-secret-key-2025"  # 改成你的隨機字串
```

**docker-compose.yml**
```yaml
volumes:
  - E:/test/manga:/manga:ro        # 改成你的漫畫路徑
  - E:/test/gallery:/gallery:ro    # 改成你的 Gallery 路徑
```

---

## 本地運行（開發者）

### ✅ 必須完成
- [ ] 安裝 Python 3.7+
- [ ] 複製 `config.toml.example` 為 `config.toml`
- [ ] 修改 `config.toml` 中的路徑和密鑰
- [ ] 執行 `.\start.bat` (Windows) 或 `./start.sh` (Linux/Mac)
- [ ] 開啟 http://localhost:5000

### 📝 配置範例

**config.toml**
```toml
[server]
secret_key = "my-random-secret-key-2025"

[manga]
root_path = "E:/test/manga"
gallery_root_path = "E:/test/gallery"
```

---

## 常見問題

**Q: 如何生成安全的 secret_key？**
```powershell
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Q: Docker 容器無法啟動？**
- 檢查 Docker Desktop 是否運行
- 確認端口 5000 未被佔用
- 查看日誌：`docker-compose logs`

**Q: 找不到漫畫？**
- 確認 docker-compose.yml 中的路徑正確
- 確認目錄結構符合要求（見 README）
- 檢查目錄權限

**Q: 修改配置後如何生效？**
```powershell
docker-compose restart  # 重啟容器
```
