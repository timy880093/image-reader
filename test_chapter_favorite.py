"""測試章節收藏功能"""
import sys
from pathlib import Path

# 添加 src 到路徑
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from core.status_manager import StatusManager
from modules.manga.service import MangaService
from core.utils import formatPathForUrl

# 初始化
status_manager = StatusManager('./data/status.json')
image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff']
manga_service = MangaService('E:/test/manga', image_extensions)

# 測試漫畫
manga_name = '下一顫，性福'
manga_path = Path('E:/test/manga') / manga_name

print(f"=== 測試漫畫: {manga_name} ===\n")

# 1. 檢查漫畫路徑
print(f"1. 漫畫路徑: {manga_path}")
print(f"   路徑存在: {manga_path.exists()}\n")

# 2. 獲取所有章節
all_chapters = manga_service.get_chapters(manga_path, favorite_only=False, status_manager=status_manager)
print(f"2. 所有章節數量: {len(all_chapters)}")
if all_chapters:
    print(f"   前3個章節:")
    for ch in all_chapters[:3]:
        print(f"   - {ch['name']} (path: {ch['path']})")
print()

# 3. 獲取收藏章節
favorite_chapters = manga_service.get_chapters(manga_path, favorite_only=True, status_manager=status_manager)
print(f"3. 收藏章節數量: {len(favorite_chapters)}")
if favorite_chapters:
    print(f"   前3個收藏章節:")
    for ch in favorite_chapters[:3]:
        print(f"   - {ch['name']} (path: {ch['path']})")
else:
    print("   ❌ 沒有找到收藏章節！")
print()

# 4. 檢查 status.json 中的收藏記錄
favorite_list = status_manager.get_items_by_status('manga', 'favorite')
manga_favorites = [f for f in favorite_list if manga_name in f]
print(f"4. status.json 中的收藏記錄 (包含 '{manga_name}'):")
print(f"   數量: {len(manga_favorites)}")
if manga_favorites:
    print(f"   前3個:")
    for f in manga_favorites[:3]:
        print(f"   - {f}")
print()

# 5. 測試路徑匹配
if all_chapters:
    test_chapter = all_chapters[0]
    chapter_path = test_chapter['path']
    status = status_manager.get_status('manga', chapter_path)
    print(f"5. 測試第一個章節的狀態:")
    print(f"   章節名稱: {test_chapter['name']}")
    print(f"   章節路徑: {chapter_path}")
    print(f"   狀態: {status}")
    
    # 檢查是否在收藏列表中
    in_favorite_list = chapter_path in favorite_list
    print(f"   在收藏列表中: {in_favorite_list}")
    
    # 如果不在，檢查可能的匹配
    if not in_favorite_list:
        print(f"\n   可能的匹配:")
        for fav in manga_favorites[:3]:
            print(f"   - status.json: '{fav}'")
            print(f"   - 章節路徑:    '{chapter_path}'")
            print(f"   - 相等: {fav == chapter_path}")
