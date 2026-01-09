@echo off
echo 正在啟動本地漫畫閱讀器...
echo.

REM 檢查是否安裝了 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo 錯誤：未找到 Python，請先安裝 Python 3.7 或更高版本
    echo 下載地址：https://www.python.org/downloads/
    pause
    exit /b 1
)

REM 安裝依賴（直接使用系統 Python）
echo 正在安裝依賴套件...
pip install -r requirements.txt
if errorlevel 1 (
    echo 錯誤：安裝依賴失敗
    pause
    exit /b 1
)

REM 啟動應用程式
echo.
echo 正在啟動漫畫閱讀器...
echo 請在瀏覽器中開啟: http://localhost:5000
echo 按 Ctrl+C 可停止服務器
echo.
cd src
python app.py

pause
