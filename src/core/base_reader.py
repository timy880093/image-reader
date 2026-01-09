"""
基礎閱讀器類別
提供通用的圖片和章節管理功能
"""

import os
import re
from pathlib import Path
from .utils import parsePath, formatPathForUrl


class BaseReader:
    """基礎閱讀器類別"""
    
    def __init__(self, root_path, image_extensions, config=None):
        """
        初始化閱讀器
        
        Args:
            root_path: 根目錄路徑
            image_extensions: 支援的圖片格式集合
            config: 配置字典（可選）
        """
        self.root_path = Path(root_path)
        self.image_extensions = image_extensions
        self.config = config or {}  # 儲存配置
        self.cache = {}  # 簡單的內存緩存
    
    def natural_sort_key(self, text):
        """
        自然排序鍵，用於正確排序包含數字的字串
        
        Args:
            text: 要排序的文字
            
        Returns:
            list: 排序鍵
        """
        return [int(s) if s.isdigit() else s.lower() for s in re.split(r'(\d+)', text)]
    
    def get_images_in_dir(self, dir_path):
        """
        獲取目錄中的所有圖片檔案 - 高性能版本（帶快取）
        
        Args:
            dir_path: 目錄路徑
            
        Returns:
            list: 圖片相對路徑列表
        """
        dir_path = Path(dir_path)
        
        if not dir_path.exists():
            return []
        
        # 檢查快取
        cache_key = f"images_{dir_path}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # 使用 os.listdir 比 Path.iterdir() 快很多
            all_files = os.listdir(dir_path)
            
            # 篩選圖片文件
            images = [
                formatPathForUrl((dir_path / f).relative_to(self.root_path))
                for f in all_files
                if Path(f).suffix.lower() in self.image_extensions
            ]
            
            # 簡單排序
            images = sorted(images, key=self.natural_sort_key)
            
            # 快取結果（最多 200 個目錄）
            if len(self.cache) < 200:
                self.cache[cache_key] = images
            
            return images
        except Exception as e:
            print(f"讀取圖片列表錯誤: {e}")
            return []
    
    def get_images_in_dir_paginated(self, dir_path, offset=0, limit=50):
        """
        分頁獲取目錄中的圖片檔案 - 用於大型資料夾（快速版）
        
        Args:
            dir_path: 目錄路徑
            offset: 起始位置
            limit: 數量限制
            
        Returns:
            tuple: (圖片列表, 總數)
        """
        dir_path = Path(dir_path)
        
        if not dir_path.exists():
            return [], 0
        
        try:
            # 快速模式：只收集需要的圖片數量，不掃描全部
            image_files = []
            needed_count = offset + limit
            
            # 使用 os.scandir（比 listdir 更快）
            with os.scandir(dir_path) as entries:
                for entry in entries:
                    if entry.is_file():
                        ext = Path(entry.name).suffix.lower()
                        if ext in self.image_extensions:
                            image_files.append(entry.name)
                            # 如果已經收集到足夠的圖片（offset + limit），可以提前停止
                            if len(image_files) >= needed_count:
                                break
            
            # 排序（只排序我們需要的部分）
            image_files.sort(key=self.natural_sort_key)
            
            # 分頁
            page_files = image_files[offset:offset + limit]
            
            # 轉換為完整路徑
            images = [
                formatPathForUrl((dir_path / f).relative_to(self.root_path))
                for f in page_files
            ]
            
            # 返回 -1 表示總數未知（首次載入時不統計，提升速度）
            return images, -1
        except Exception as e:
            print(f"讀取圖片列表錯誤: {e}")
            return [], 0
    
    def get_cover_image(self, manga_path):
        """
        獲取封面圖片（第一張找到的圖片）
        
        Args:
            manga_path: 漫畫目錄路徑
            
        Returns:
            str: 封面圖片相對路徑，如果沒有則返回 None
        """
        manga_path = Path(manga_path)
        
        # 優先搜尋的圖片格式（按優先級排序）
        priority_formats = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff']
        
        # 先檢查根目錄下是否有圖片
        for format_ext in priority_formats:
            for file_path in manga_path.iterdir():
                if file_path.is_file() and file_path.suffix.lower() == format_ext:
                    return formatPathForUrl(file_path.relative_to(self.root_path))
        
        # 如果根目錄沒有圖片，檢查第一個章節目錄
        subdirs = [d for d in manga_path.iterdir() if d.is_dir()]
        if subdirs:
            # 按自然排序找第一個章節
            first_chapter = sorted(subdirs, key=lambda x: self.natural_sort_key(x.name))[0]
            for format_ext in priority_formats:
                for file_path in first_chapter.iterdir():
                    if file_path.is_file() and file_path.suffix.lower() == format_ext:
                        return formatPathForUrl(file_path.relative_to(self.root_path))
        
        return None  # 沒有找到封面圖片
    
    def _count_images_fast(self, manga_path):
        """
        快速統計圖片數量
        
        Args:
            manga_path: 漫畫目錄路徑
            
        Returns:
            int: 圖片數量
        """
        try:
            count = sum(
                1 for f in manga_path.iterdir() 
                if f.is_file() and f.suffix.lower() in self.image_extensions
            )
            return count
        except:
            return 0
