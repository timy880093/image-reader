#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地漫畫閱讀器 Web 應用程序
支援從指定目錄讀取漫畫資料並提供 Web 介面閱讀

重構版本：採用 Blueprint 模組化架構
- 漫畫和 Gallery 模組完全隔離
- 易於擴展和維護
"""

from flask import Flask, redirect, jsonify
from pathlib import Path

# 導入配置管理
from config import load_config, get_frontend_config

# 導入漫畫模組
from modules.manga.routes import manga_bp, init_service as init_manga_service
from modules.manga.service import MangaService

# 導入 Gallery 模組
from modules.gallery.routes import gallery_bp, init_service as init_gallery_service
from modules.gallery.service import GalleryService

# 創建 Flask 應用
app = Flask(__name__)

# 載入配置
config = load_config()

# 應用程式配置
app.config['SECRET_KEY'] = config['server'].get('secret_key', 'manga-reader-2025')

# 支援的圖片格式
IMAGE_EXTENSIONS = set(config['manga'].get('supported_formats', ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']))

# 初始化服務
MANGA_ROOT = Path(config['manga'].get('root_path', './test_manga'))
Gallery_ROOT = Path(config['manga'].get('gallery_root_path', './test_gallery'))

manga_service = MangaService(MANGA_ROOT, IMAGE_EXTENSIONS)
gallery_service = GalleryService(Gallery_ROOT, IMAGE_EXTENSIONS)

# 初始化各模組的服務
init_manga_service(manga_service)
init_gallery_service(gallery_service, config.get('gallery', {}))

# 註冊 Blueprint
app.register_blueprint(manga_bp)
app.register_blueprint(gallery_bp)


# 全局路由
@app.route('/')
def index():
    """首頁：重定向到漫畫列表"""
    return redirect('/manga')


@app.route('/api/config')
def get_config():
    """API：獲取前端配置"""
    return jsonify(get_frontend_config(config))


if __name__ == '__main__':
    print("=" * 50)
    print("🎌 本地漫畫閱讀器")
    print("=" * 50)
    print(f"📁 漫畫資料夾: {MANGA_ROOT}")
    print(f"🎨 Gallery 資料夾: {Gallery_ROOT}")
    print(f"🌐 服務器地址: http://{config['server'].get('host', '127.0.0.1')}:{config['server'].get('port', 5000)}")
    print(f"🎨 主題: {config['reader'].get('theme', 'dark')}")
    print(f"🌍 語言: {config['ui'].get('language', 'zh-TW')}")
    print("=" * 50)
    print("📖 請在瀏覽器中開啟上方地址開始使用")
    print("🔧 配置文件位置: ../config.toml")
    print("⏹️  按 Ctrl+C 停止服務器")
    print("=" * 50)
    
    app.run(
        debug=config['server'].get('debug', True), 
        host=config['server'].get('host', '127.0.0.1'), 
        port=config['server'].get('port', 5000)
    )
