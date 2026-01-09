#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新架構測試腳本
測試後端 API 是否正常工作
"""

import sys
from pathlib import Path

# 添加當前目錄到 Python 路徑
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """測試所有模組是否能正常導入"""
    print("=" * 50)
    print("測試 1: 模組導入")
    print("=" * 50)
    
    try:
        from config import load_config, get_frontend_config
        print("✅ config 模組導入成功")
        
        from core.base_reader import BaseReader
        from core.utils import parsePath, formatPathForUrl
        print("✅ core 模組導入成功")
        
        from modules.manga.service import MangaService
        from modules.manga.routes import manga_bp
        print("✅ manga 模組導入成功")
        
        from modules.gallery.service import GalleryService
        from modules.gallery.routes import gallery_bp
        print("✅ gallery 模組導入成功")
        
        return True
    except Exception as e:
        print(f"❌ 導入失敗: {e}")
        return False


def test_config():
    """測試配置載入"""
    print("\n" + "=" * 50)
    print("測試 2: 配置載入")
    print("=" * 50)
    
    try:
        from config import load_config, get_frontend_config
        
        config = load_config()
        print(f"✅ 配置載入成功")
        print(f"   服務器: {config['server']['host']}:{config['server']['port']}")
        print(f"   漫畫路徑: {config['manga']['root_path']}")
        print(f"   Gallery路徑: {config['manga']['gallery_root_path']}")
        
        frontend_config = get_frontend_config(config)
        print(f"✅ 前端配置提取成功")
        print(f"   主題: {frontend_config.get('reader', {}).get('theme', 'N/A')}")
        print(f"   語言: {frontend_config.get('ui', {}).get('language', 'N/A')}")
        
        return True
    except Exception as e:
        print(f"❌ 配置測試失敗: {e}")
        return False


def test_services():
    """測試服務層"""
    print("\n" + "=" * 50)
    print("測試 3: 服務層")
    print("=" * 50)
    
    try:
        from config import load_config
        from modules.manga.service import MangaService
        from modules.gallery.service import GalleryService
        from pathlib import Path
        
        config = load_config()
        IMAGE_EXTENSIONS = set(config['manga'].get('supported_formats', ['.jpg', '.jpeg', '.png']))
        
        # 測試漫畫服務
        manga_root = Path(config['manga']['root_path'])
        manga_service = MangaService(manga_root, IMAGE_EXTENSIONS)
        print(f"✅ MangaService 初始化成功")
        print(f"   根路徑: {manga_service.root_path}")
        print(f"   路徑存在: {manga_service.root_path.exists()}")
        
        # 測試獲取列表
        result = manga_service.get_manga_list(page=1, per_page=5, skip_chapters=True)
        print(f"✅ 漫畫列表獲取成功")
        print(f"   總數: {result['total']}")
        print(f"   當前頁: {result['page']}")
        print(f"   項目數: {len(result['mangas'])}")
        
        # 測試 Gallery 服務
        gallery_root = Path(config['manga']['gallery_root_path'])
        gallery_service = GalleryService(gallery_root, IMAGE_EXTENSIONS)
        print(f"✅ GalleryService 初始化成功")
        print(f"   根路徑: {gallery_service.root_path}")
        print(f"   路徑存在: {gallery_service.root_path.exists()}")
        
        # 測試獲取列表
        result = gallery_service.get_gallery_list(page=1, per_page=5, skip_chapters=True)
        print(f"✅ Gallery 列表獲取成功")
        print(f"   總數: {result['total']}")
        print(f"   當前頁: {result['page']}")
        print(f"   項目數: {len(result['mangas'])}")
        
        return True
    except Exception as e:
        print(f"❌ 服務層測試失敗: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_app_creation():
    """測試 Flask 應用創建"""
    print("\n" + "=" * 50)
    print("測試 4: Flask 應用創建")
    print("=" * 50)
    
    try:
        # 臨時導入來測試
        from flask import Flask
        from config import load_config
        from modules.manga.routes import manga_bp
        from modules.gallery.routes import gallery_bp
        
        app = Flask(__name__)
        config = load_config()
        app.config['SECRET_KEY'] = config['server']['secret_key']
        
        # 註冊 Blueprint
        app.register_blueprint(manga_bp)
        app.register_blueprint(gallery_bp)
        
        print(f"✅ Flask 應用創建成功")
        print(f"   已註冊的 Blueprint:")
        for bp_name in app.blueprints:
            print(f"     - {bp_name}")
        
        # 列出所有路由
        print(f"\n   已註冊的路由:")
        for rule in app.url_map.iter_rules():
            if not rule.endpoint.startswith('static'):
                print(f"     {rule.endpoint:40s} {rule.rule}")
        
        return True
    except Exception as e:
        print(f"❌ 應用創建測試失敗: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """運行所有測試"""
    print("\n🧪 新架構測試開始\n")
    
    results = []
    
    # 運行測試
    results.append(("模組導入", test_imports()))
    results.append(("配置載入", test_config()))
    results.append(("服務層", test_services()))
    results.append(("Flask應用", test_app_creation()))
    
    # 總結
    print("\n" + "=" * 50)
    print("測試總結")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ 通過" if result else "❌ 失敗"
        print(f"{name:20s} {status}")
    
    print(f"\n總計: {passed}/{total} 測試通過")
    
    if passed == total:
        print("\n🎉 所有測試通過！新架構後端運作正常！")
        print("\n下一步:")
        print("1. 運行 'python app_new.py' 啟動服務器")
        print("2. 訪問 http://127.0.0.1:5000/manga 查看漫畫列表")
        print("3. 訪問 http://127.0.0.1:5000/gallery 查看 Gallery 列表（前端待完成）")
    else:
        print("\n⚠️ 部分測試失敗，請檢查錯誤信息")
    
    return passed == total


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
