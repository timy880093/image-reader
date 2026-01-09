#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
創建測試用的漫畫資料夾結構
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import random

def create_test_manga_structure():
    """創建測試用的漫畫資料夾結構"""
    
    # 測試用的漫畫根目錄
    manga_root = Path("test_manga")
    
    # 創建測試漫畫
    test_mangas = [
        {
            "name": "測試漫畫A",
            "chapters": ["第01話", "第02話", "第03話"]
        },
        {
            "name": "測試漫畫B",
            "chapters": ["Chapter 01", "Chapter 02"]
        },
        {
            "name": "單行本漫畫",
            "chapters": [""]  # 空字串表示沒有章節資料夾
        }
    ]
    
    # 創建資料夾結構和測試圖片
    for manga in test_mangas:
        manga_path = manga_root / manga["name"]
        manga_path.mkdir(parents=True, exist_ok=True)
        
        for chapter in manga["chapters"]:
            if chapter:
                chapter_path = manga_path / chapter
            else:
                chapter_path = manga_path
            
            chapter_path.mkdir(parents=True, exist_ok=True)
            
            # 為每個章節創建 5-8 張測試圖片
            page_count = random.randint(5, 8)
            for page in range(1, page_count + 1):
                create_test_image(chapter_path, f"{page:03d}.jpg", page, chapter or "單行本")

def create_test_image(folder_path, filename, page_num, chapter_name):
    """創建測試用的圖片"""
    try:
        # 創建圖片 (600x800 像素)
        width, height = 600, 800
        image = Image.new('RGB', (width, height), color=(255, 255, 255))
        draw = ImageDraw.Draw(image)
        
        # 繪製背景
        colors = ['lightblue', 'lightgreen', 'lightyellow', 'lightpink', 'lightgray']
        bg_color = random.choice(colors)
        draw.rectangle([0, 0, width, height], fill=bg_color)
        
        # 嘗試使用系統字體，如果失敗則使用預設字體
        try:
            font_large = ImageFont.truetype("arial.ttf", 40)
            font_medium = ImageFont.truetype("arial.ttf", 24)
            font_small = ImageFont.truetype("arial.ttf", 16)
        except:
            font_large = ImageFont.load_default()
            font_medium = ImageFont.load_default()
            font_small = ImageFont.load_default()
        
        # 繪製文字
        draw.text((width//2, 100), f"頁面 {page_num}", font=font_large, 
                 anchor="mm", fill='black')
        draw.text((width//2, 200), chapter_name, font=font_medium, 
                 anchor="mm", fill='darkblue')
        draw.text((width//2, 300), "這是測試用的漫畫頁面", font=font_small, 
                 anchor="mm", fill='gray')
        
        # 繪製一些簡單的圖形
        draw.rectangle([50, 400, width-50, height-100], outline='black', width=3)
        draw.ellipse([100, 450, 200, 550], fill='red', outline='black')
        draw.polygon([(300, 450), (350, 500), (400, 450), (375, 520), (325, 520)], 
                    fill='yellow', outline='black')
        
        # 保存圖片
        image.save(folder_path / filename, "JPEG", quality=85)
        print(f"已創建: {folder_path / filename}")
        
    except Exception as e:
        print(f"創建圖片失敗: {e}")
        # 創建一個簡單的純色圖片作為備選
        image = Image.new('RGB', (600, 800), color=(200, 200, 200))
        image.save(folder_path / filename, "JPEG")

if __name__ == "__main__":
    print("正在創建測試用漫畫資料夾結構...")
    
    try:
        create_test_manga_structure()
        print("\n✅ 測試資料夾結構創建完成！")
        print("📁 測試漫畫位於: ./test_manga/")
        print("\n請將 app.py 中的 MANGA_ROOT 路徑修改為:")
        print("MANGA_ROOT = Path('./test_manga')")
        
    except ImportError:
        print("❌ 未安裝 Pillow 庫，正在創建簡單的資料夾結構...")
        # 不使用 PIL 創建簡單結構
        manga_root = Path("test_manga")
        test_mangas = [
            {"name": "測試漫畫A", "chapters": ["第01話", "第02話"]},
            {"name": "測試漫畫B", "chapters": ["Chapter 01"]},
            {"name": "單行本漫畫", "chapters": [""]}
        ]
        
        for manga in test_mangas:
            manga_path = manga_root / manga["name"]
            manga_path.mkdir(parents=True, exist_ok=True)
            
            for chapter in manga["chapters"]:
                if chapter:
                    chapter_path = manga_path / chapter
                else:
                    chapter_path = manga_path
                chapter_path.mkdir(parents=True, exist_ok=True)
                
                # 創建空的 .jpg 檔案
                for i in range(1, 4):
                    (chapter_path / f"{i:03d}.jpg").touch()
        
        print("✅ 簡單資料夾結構創建完成！")
        print("⚠️  圖片檔案為空，建議安裝 Pillow 庫以創建測試圖片:")
        print("pip install Pillow")
    
    except Exception as e:
        print(f"❌ 創建失敗: {e}")
