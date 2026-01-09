"""
共用工具函數
"""

import os
import urllib.parse
from pathlib import Path


def parsePath(path_str):
    """
    解析路徑字符串，處理不同操作系統的路徑格式
    支持 URL 編碼的路徑和跨平台路徑分隔符
    
    Args:
        path_str: 路徑字符串
        
    Returns:
        Path: 解析後的 Path 對象
    """
    if not path_str:
        return Path()
    
    # URL 解碼
    decoded_path = urllib.parse.unquote(path_str)
    
    # 將所有路徑分隔符統一轉換為當前系統的分隔符
    # 處理混合的路徑分隔符（/和\）
    normalized_path = decoded_path.replace('/', os.sep).replace('\\', os.sep)
    
    # 創建 Path 對象，會自動處理當前系統的路徑格式
    return Path(normalized_path)


def formatPathForUrl(path_obj):
    """
    將 Path 對象格式化為 URL 友好的格式
    統一使用正斜線作為分隔符
    
    Args:
        path_obj: Path 對象
        
    Returns:
        str: URL 格式的路徑字符串
    """
    if not path_obj:
        return ""
    
    # 將路徑轉換為字符串並統一使用正斜線
    path_str = str(path_obj).replace(os.sep, '/')
    return path_str
