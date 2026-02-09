# Docker 部署文件說明

本專案已完成 Docker 化，以下是新增的文件及其用途。

## 📁 新增文件清單

### Docker 核心文件
| 文件名 | 用途 | 是否需要修改 |
|--------|------|-------------|
| `Dockerfile` | Docker 映像構建配置 | ❌ 不需要 |
| `docker-compose.yml` | Docker 服務編排配置 | ✅ **必須修改路徑** |
| `docker-compose.example.yml` | 配置範例參考 | ❌ 僅供參考 |
| `.dockerignore` | Docker 構建忽略文件 | ❌ 不需要 |

### 配置文件
| 文件名 | 用途 | 是否需要修改 |
|--------|------|-------------|
| `config.docker.toml` | Docker 環境配置範本 | ✅ 複製後修改 secret_key |

### 啟動腳本
| 文件名 | 用途 | 平台 |
|--------|------|------|
| `docker-start.ps1` | 自動化啟動腳本 | Windows PowerShell |

### 文檔
| 文件名 | 用途 |
|--------|------|
| `DOCKER_QUICKSTART.md` | Docker 快速啟動指南 |
| `SETUP_CHECKLIST.md` | 設定檢查清單 |
| `DOCKER_FILES.md` | 本文件 |

## 🚀 快速開始

### 最快方式（Windows）
```powershell
.\docker-start.ps1
```

### 手動方式
```powershell
# 1. 準備配置
Copy-Item config.docker.toml config.toml

# 2. 編輯 config.toml 修改 secret_key

# 3. 編輯 docker-compose.yml 修改路徑

# 4. 啟動
docker-compose up -d
```

## 📝 必須修改的配置

### 1. config.toml
```toml
[server]
secret_key = "請改成你的隨機字串"  # 必須修改
```

### 2. docker-compose.yml
```yaml
volumes:
  # 修改冒號左側為你的本地路徑
  - E:/test/manga:/manga:ro
  - E:/test/gallery:/gallery:ro
```

## 🔒 安全性說明

所有敏感配置已參數化：
- ✅ `config.toml` 已加入 `.gitignore`
- ✅ `secret_key` 需手動設定
- ✅ 本地路徑在 `docker-compose.yml` 中配置
- ✅ 容器內使用固定路徑 `/manga` 和 `/gallery`

## 📚 詳細文檔

- 完整功能說明：`README.md`
- Docker 快速指南：`DOCKER_QUICKSTART.md`
- 設定檢查清單：`SETUP_CHECKLIST.md`

## 🆘 需要幫助？

查看 `SETUP_CHECKLIST.md` 中的常見問題部分。
