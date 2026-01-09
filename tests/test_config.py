#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
測試配置讀取功能
"""

import sys
from pathlib import Path

def test_config_loading():
    """測試配置載入功能"""
    print("🧪 測試配置讀取功能")
    print("=" * 40)
    
    # 添加父目錄到路徑，以便導入 app.py
    sys.path.append(str(Path(__file__).parent))
    
    try:
        # 導入應用程式模組
        import app
        
        # 測試配置載入
        config = app.config
        manga_root = app.MANGA_ROOT
        image_extensions = app.IMAGE_EXTENSIONS
        
        print(f"✅ 配置載入成功")
        print(f"📁 漫畫路徑: {manga_root}")
        print(f"🖼️  支援格式: {list(image_extensions)}")
        print(f"🔧 密鑰設定: {'已設定' if app.app.config.get('SECRET_KEY') else '未設定'}")
        
        # 檢查路徑是否存在
        if manga_root.exists():
            print(f"✅ 漫畫目錄存在")
            
            # 列出目錄內容
            try:
                items = list(manga_root.iterdir())
                print(f"📂 目錄包含 {len(items)} 個項目")
                for item in items[:5]:  # 只顯示前5個
                    item_type = "📁" if item.is_dir() else "📄"
                    print(f"   {item_type} {item.name}")
                if len(items) > 5:
                    print(f"   ... 還有 {len(items) - 5} 個項目")
            except PermissionError:
                print("⚠️  無權限讀取目錄內容")
        else:
            print(f"⚠️  漫畫目錄不存在: {manga_root}")
            print("   建議:")
            print("   1. 創建目錄")
            print("   2. 或修改 config.toml 中的 root_path")
        
        # 測試 MangaReader 類
        manga_reader = app.manga_reader
        print(f"\n🔍 掃描漫畫...")
        mangas = manga_reader.get_manga_list()
        print(f"📚 找到 {len(mangas)} 部漫畫")
        
        for manga in mangas[:3]:  # 只顯示前3部
            print(f"   📖 {manga['name']} ({len(manga['chapters'])} 章節)")
        
        if len(mangas) > 3:
            print(f"   ... 還有 {len(mangas) - 3} 部漫畫")
            
    except ImportError as e:
        print(f"❌ 導入失敗: {e}")
    except Exception as e:
        print(f"❌ 測試失敗: {e}")
        import traceback
        traceback.print_exc()

def test_direct_config():
    """直接測試配置文件讀取"""
    print("\n🔧 直接測試配置文件")
    print("=" * 40)
    
    config_path = Path('../config.toml')
    
    if not config_path.exists():
        print(f"❌ 配置文件不存在: {config_path}")
        return
    
    try:
        import toml
        with open(config_path, 'r', encoding='utf-8') as f:
            config = toml.load(f)
        
        print("✅ 配置文件載入成功")
        
        # 顯示主要配置
        if 'manga' in config:
            root_path = config['manga'].get('root_path', 'N/A')
            print(f"📁 root_path: {root_path}")
            
            supported_formats = config['manga'].get('supported_formats', [])
            print(f"🖼️  supported_formats: {supported_formats}")
        
        if 'server' in config:
            host = config['server'].get('host', 'N/A')
            port = config['server'].get('port', 'N/A')
            print(f"🌐 server: {host}:{port}")
        
        if 'reader' in config:
            theme = config['reader'].get('theme', 'N/A')
            print(f"🎨 theme: {theme}")
            
    except ImportError:
        print("❌ 未安裝 toml 庫")
    except Exception as e:
        print(f"❌ 讀取配置失敗: {e}")

if __name__ == '__main__':
    test_direct_config()
    test_config_loading()
