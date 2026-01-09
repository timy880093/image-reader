"""
配置管理模組
"""

import toml
from pathlib import Path


def load_config():
    """
    載入配置文件
    
    Returns:
        dict: 配置字典
    """
    # 嘗試多個可能的配置文件路徑
    possible_paths = [
        Path('../config.toml'),          # 相對於 manga_reader 目錄
        Path('./config.toml'),           # 當前目錄
        Path('config.toml'),             # 同目錄
        Path(__file__).parent.parent / 'config.toml'  # 使用絕對路徑
    ]
    
    config_path = None
    for path in possible_paths:
        if path.exists():
            config_path = path
            break
    
    if not config_path:
        print("⚠️  未找到配置文件，使用預設配置")
        return get_default_config()
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config_data = toml.load(f)
            print(f"✅ 配置文件載入成功: {config_path}")
            return config_data
    except ImportError:
        print("⚠️  未安裝 toml 庫，使用預設配置")
        return get_default_config()
    except Exception as e:
        print(f"❌ 載入配置文件失敗: {e}")
        print("使用預設配置...")
        return get_default_config()


def get_default_config():
    """
    獲取預設配置
    
    Returns:
        dict: 預設配置字典
    """
    return {
        'server': {
            'host': '127.0.0.1',
            'port': 5000,
            'debug': True,
            'secret_key': 'manga-reader-2025'
        },
        'manga': {
            'root_path': './test_manga',
            'pixiv_root_path': './test_pixiv',
            'supported_formats': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
        },
        'pixiv': {
            'per_page': 6,
            'search_debounce_ms': 300,
            'skip_chapters_on_list': True,
            'default_filter': ''
        },
        'reader': {
            'theme': 'dark',
            'auto_hide_toolbar': True,
            'default_zoom': 1.0
        },
        'ui': {
            'language': 'zh-TW',
            'search_placeholder': '搜尋漫畫名稱...'
        },
        'performance': {
            'image_cache': True,
            'preload_pages': 2
        },
        'security': {
            'allow_external_access': False
        }
    }


def get_frontend_config(config):
    """
    獲取前端配置（只包含前端需要的配置）
    
    Args:
        config: 完整配置字典
        
    Returns:
        dict: 前端配置字典
    """
    return {
        'reader': config.get('reader', {}),
        'ui': config.get('ui', {}),
        'performance': config.get('performance', {}),
        'mobile': config.get('mobile', {}),
        'features': config.get('features', {}),
        'pixiv': config.get('pixiv', {})
    }
