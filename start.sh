#!/bin/bash

echo "正在啟動本地漫畫閱讀器..."
echo

# 檢查是否安裝了 Python
if ! command -v python3 &> /dev/null; then
    echo "錯誤：未找到 Python3，請先安裝 Python 3.7 或更高版本"
    exit 1
fi

# 檢查是否存在虛擬環境
if [ ! -d "venv" ]; then
    echo "正在創建虛擬環境..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "錯誤：無法創建虛擬環境"
        exit 1
    fi
fi

# 激活虛擬環境
echo "正在激活虛擬環境..."
source venv/bin/activate

# 安裝依賴
echo "正在安裝依賴套件..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "錯誤：安裝依賴失敗"
    exit 1
fi

# 啟動應用程式
echo
echo "正在啟動漫畫閱讀器..."
echo "請在瀏覽器中開啟: http://localhost:5000"
echo "按 Ctrl+C 可停止服務器"
echo
cd src
python app.py
