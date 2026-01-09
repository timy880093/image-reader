# Gallery 精選標籤設定腳本
# 用於批量為作品添加或移除精選標記

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "list",  # list, add, remove
    
    [Parameter(Mandatory=$false)]
    [string]$WorkPath = "",
    
    [Parameter(Mandatory=$false)]
    [string]$MarkerFile = ".special"  # 預設值，應與 config.toml 一致
)

$GalleryRoot = "E:\test\pixiv"

function Show-Help {
    Write-Host "=" * 60
    Write-Host "Gallery 精選標籤管理工具" -ForegroundColor Cyan
    Write-Host "=" * 60
    Write-Host ""
    Write-Host "使用方式:" -ForegroundColor Yellow
    Write-Host "  .\manage_gallery_tags.ps1 list                    # 列出所有已標記的作品"
    Write-Host "  .\manage_gallery_tags.ps1 add '作品名稱'          # 為作品添加標記"
    Write-Host "  .\manage_gallery_tags.ps1 remove '作品名稱'       # 移除作品標記"
    Write-Host ""
    Write-Host "範例:" -ForegroundColor Yellow
    Write-Host "  .\manage_gallery_tags.ps1 add '109314222-Nalunel'"
    Write-Host "  .\manage_gallery_tags.ps1 list"
    Write-Host ""
}

function List-MarkedWorks {
    Write-Host "搜尋已標記的作品..." -ForegroundColor Cyan
    $marked = Get-ChildItem -Path $GalleryRoot -Filter $MarkerFile -Recurse -Force | ForEach-Object {
        $_.Directory.Name
    }
    
    if ($marked.Count -eq 0) {
        Write-Host "目前沒有任何作品被標記為精選" -ForegroundColor Yellow
    } else {
        Write-Host "`n找到 $($marked.Count) 個精選作品:" -ForegroundColor Green
        $marked | ForEach-Object {
            Write-Host "  ⭐ $_" -ForegroundColor White
        }
    }
    Write-Host ""
}

function Add-Marker {
    param([string]$WorkName)
    
    $workDir = Join-Path $GalleryRoot $WorkName
    if (-not (Test-Path $workDir)) {
        Write-Host "❌ 錯誤: 找不到作品資料夾 '$WorkName'" -ForegroundColor Red
        return
    }
    
    $markerPath = Join-Path $workDir $MarkerFile
    if (Test-Path $markerPath) {
        Write-Host "⚠️  作品 '$WorkName' 已經被標記為精選" -ForegroundColor Yellow
        return
    }
    
    New-Item -ItemType File -Path $markerPath -Force | Out-Null
    Write-Host "✅ 成功: 作品 '$WorkName' 已標記為精選" -ForegroundColor Green
}

function Remove-Marker {
    param([string]$WorkName)
    
    $workDir = Join-Path $GalleryRoot $WorkName
    if (-not (Test-Path $workDir)) {
        Write-Host "❌ 錯誤: 找不到作品資料夾 '$WorkName'" -ForegroundColor Red
        return
    }
    
    $markerPath = Join-Path $workDir $MarkerFile
    if (-not (Test-Path $markerPath)) {
        Write-Host "⚠️  作品 '$WorkName' 沒有精選標記" -ForegroundColor Yellow
        return
    }
    
    Remove-Item -Path $markerPath -Force
    Write-Host "✅ 成功: 已移除作品 '$WorkName' 的精選標記" -ForegroundColor Green
}

# 主程序
switch ($Action.ToLower()) {
    "list" {
        List-MarkedWorks
    }
    "add" {
        if ([string]::IsNullOrEmpty($WorkPath)) {
            Write-Host "❌ 錯誤: 請指定作品名稱" -ForegroundColor Red
            Show-Help
            exit 1
        }
        Add-Marker -WorkName $WorkPath
    }
    "remove" {
        if ([string]::IsNullOrEmpty($WorkPath)) {
            Write-Host "❌ 錯誤: 請指定作品名稱" -ForegroundColor Red
            Show-Help
            exit 1
        }
        Remove-Marker -WorkName $WorkPath
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "❌ 錯誤: 無效的操作 '$Action'" -ForegroundColor Red
        Show-Help
        exit 1
    }
}
