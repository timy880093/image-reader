# Docker 快速啟動指南

## 三步啟動

### 1️⃣ 準備配置
```bash
# 複製配置範本
copy config.docker.toml config.toml  # Windows
cp config.docker.toml config.toml    # Linux/Mac
```

編輯 `config.toml`，修改密鑰：
```toml
[server]
secret_key = "請改成你的隨機字串"
```

### 2️⃣ 設定路徑

編輯 `docker-compose.yml`，修改你的漫畫目錄：

```yaml
volumes:
  # 修改冒號左側為你的本地路徑
  - E:/test/manga:/manga:ro          # Windows
  - E:/test/gallery:/gallery:ro      # Windows
  
  # 或
  - /home/user/manga:/manga:ro       # Linux/Mac
  - /home/user/gallery:/gallery:ro   # Linux/Mac
```

### 3️⃣ 啟動
```bash
docker-compose up -d
```

開啟瀏覽器：http://localhost:5000

## 常用命令

```bash
# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down

# 重啟服務
docker-compose restart

# 更新並重啟
docker-compose up -d --build
```

## 路徑說明

| 本地路徑 | 容器內路徑 | 說明 |
|---------|-----------|------|
| 你的漫畫目錄 | `/manga` | 只讀掛載 |
| 你的 Gallery 目錄 | `/gallery` | 只讀掛載 |
| `./config.toml` | `/app/config.toml` | 配置文件 |
| `./data` | `/app/data` | 數據目錄（收藏等） |

## 故障排除

**無法啟動？**
- 檢查 Docker 是否運行
- 確認端口 5000 未被佔用
- 查看日誌：`docker-compose logs`

**找不到漫畫？**
- 確認 docker-compose.yml 中的路徑正確
- 確認目錄有讀取權限
- 重啟容器：`docker-compose restart`

**修改配置後？**
- 重啟容器：`docker-compose restart`
- 或重新構建：`docker-compose up -d --build`
