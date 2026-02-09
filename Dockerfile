# 使用 Python 3.11 slim 版本作為基礎映像
FROM python:3.11-slim

# 設定工作目錄
WORKDIR /app

# 複製依賴文件
COPY requirements.txt .

# 安裝 Python 依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用程式代碼
COPY src/ ./src/
COPY config.toml.example ./config.toml.example

# 創建數據目錄
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 5000

# 設定環境變數
ENV PYTHONUNBUFFERED=1

# 啟動命令
CMD ["python", "src/app.py"]
