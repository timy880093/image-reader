# Docker 快速啟動腳本 (PowerShell)
# 用於 Windows 環境

Write-Host "🐳 本地漫畫閱讀器 - Docker 啟動" -ForegroundColor Cyan
Write-Host "=" * 50

# 檢查 Docker 是否運行
Write-Host "`n📋 檢查 Docker 環境..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "❌ Docker 未運行，請先啟動 Docker Desktop" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker 運行中" -ForegroundColor Green

# 檢查配置文件
Write-Host "`n📋 檢查配置文件..." -ForegroundColor Yellow
if (-not (Test-Path "config.toml")) {
    Write-Host "⚠️  未找到 config.toml，正在從範本創建..." -ForegroundColor Yellow
    Copy-Item "config.docker.toml" "config.toml"
    Write-Host "✅ 已創建 config.toml" -ForegroundColor Green
    Write-Host "⚠️  請編輯 config.toml 修改 secret_key！" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "是否繼續啟動？(y/n)"
    if ($continue -ne "y") {
        exit 0
    }
}

# 檢查 docker-compose.yml
Write-Host "`n📋 檢查 docker-compose.yml..." -ForegroundColor Yellow
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ 未找到 docker-compose.yml" -ForegroundColor Red
    exit 1
}

# 檢查是否需要修改路徑
$composeContent = Get-Content "docker-compose.yml" -Raw
if ($composeContent -match "/path/to/your/") {
    Write-Host "⚠️  docker-compose.yml 中的路徑尚未設定！" -ForegroundColor Yellow
    Write-Host "請編輯 docker-compose.yml，修改 volumes 部分的本地路徑" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "是否繼續啟動？(y/n)"
    if ($continue -ne "y") {
        exit 0
    }
}

# 啟動服務
Write-Host "`n🚀 啟動 Docker 容器..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ 啟動成功！" -ForegroundColor Green
    Write-Host "=" * 50
    Write-Host "🌐 請在瀏覽器開啟: http://localhost:5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "常用命令:" -ForegroundColor Yellow
    Write-Host "  查看日誌: docker-compose logs -f"
    Write-Host "  停止服務: docker-compose down"
    Write-Host "  重啟服務: docker-compose restart"
    Write-Host "=" * 50
} else {
    Write-Host "`n❌ 啟動失敗，請查看錯誤訊息" -ForegroundColor Red
    exit 1
}
