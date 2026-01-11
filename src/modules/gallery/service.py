"""
Gallery 服務層
處理 Gallery 相關的業務邏輯
"""

from pathlib import Path
from core.base_reader import BaseReader
from core.utils import parsePath, formatPathForUrl


class GalleryService(BaseReader):
    """Gallery 服務類別，繼承自 BaseReader"""
    
    def get_gallery_list(self, page=1, per_page=6, skip_chapters=False, status_filter=None, status_manager=None, search_keyword=None):
        """
        獲取所有 Gallery 作品列表
        
        Args:
            page: 頁碼（從1開始）
            per_page: 每頁顯示數量
            skip_chapters: 是否跳過章節信息載入（加快初始載入速度）
            status_filter: 狀態篩選 (favorite/unreviewed/reviewed)
            status_manager: 狀態管理器實例
            search_keyword: 搜尋關鍵字（用於名稱模糊搜尋）
            
        Returns:
            dict: 包含作品列表和分頁信息的字典
        """
        works = []
        if not self.root_path.exists():
            return self._empty_result(page, per_page)
        
        try:
            # 獲取所有作品目錄
            all_dirs = [d for d in self.root_path.iterdir() if d.is_dir()]
            
            # 應用狀態篩選
            if status_filter and status_manager:
                all_dirs = status_manager.filter_by_status('gallery', all_dirs, status_filter)
            
            # 如果有搜尋關鍵字，先在全部資料中搜尋
            if search_keyword:
                search_keyword_lower = search_keyword.lower()
                all_dirs = [d for d in all_dirs if search_keyword_lower in d.name.lower()]
            
            total_count = len(all_dirs)
            
            # 排序
            all_dirs.sort(key=lambda x: self.natural_sort_key(x.name))
            
            # 分頁
            start_idx = (page - 1) * per_page
            end_idx = start_idx + per_page
            page_dirs = all_dirs[start_idx:end_idx]
            
            for work_dir in page_dirs:
                try:
                    # 使用緩存鍵
                    cache_key = f"gallery_{work_dir}_{skip_chapters}"
                    
                    if cache_key in self.cache:
                        work_info = self.cache[cache_key]
                    else:
                        if skip_chapters:
                            # 快速模式：不載入章節詳情，直接統計圖片數
                            chapters = []
                            chapter_count = self._count_images_fast(work_dir)
                        else:
                            # 完整模式：載入章節詳情
                            chapters = self.get_chapters(work_dir)
                            chapter_count = len(chapters)
                        
                        cover_image = self.get_cover_image(work_dir)
                        
                        work_info = {
                            'name': work_dir.name,
                            'path': formatPathForUrl(work_dir.relative_to(self.root_path)),
                            'chapters': chapters,
                            'chapter_count': chapter_count,
                            'cover_image': cover_image
                        }
                        
                        # 緩存結果（最多緩存100個）
                        if len(self.cache) < 100:
                            self.cache[cache_key] = work_info
                    
                    works.append(work_info)
                except Exception as e:
                    print(f"處理 Gallery 作品 {work_dir.name} 時出錯: {e}")
                    continue
            
            return {
                'mangas': works,  # 保持 API 兼容性
                'total': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
        except Exception as e:
            print(f"獲取 Gallery 列表時出錯: {e}")
            return self._empty_result(page, per_page)
    
    def get_chapters(self, work_path):
        """
        獲取 Gallery 作品的章節列表
        Gallery 通常沒有章節概念，直接包含圖片
        
        Args:
            work_path: 作品目錄路徑
            
        Returns:
            list: 章節列表（通常只有一個）
        """
        chapters = []
        work_path = Path(work_path)
        
        # 檢查是否有子資料夾
        subdirs = [d for d in work_path.iterdir() if d.is_dir()]
        
        if subdirs:
            # 有子資料夾（不常見）
            for subdir in subdirs:
                images = self.get_images_in_dir(subdir)
                if images:
                    chapters.append({
                        'name': subdir.name,
                        'path': formatPathForUrl(subdir.relative_to(self.root_path)),
                        'image_count': len(images)
                    })
        else:
            # 沒有子資料夾，直接檢查圖片（Gallery 典型模式）
            images = self.get_images_in_dir(work_path)
            if images:
                chapters.append({
                    'name': work_path.name,  # 使用資料夾名稱
                    'path': formatPathForUrl(work_path.relative_to(self.root_path)),
                    'image_count': len(images)
                })
        
        return sorted(chapters, key=lambda x: self.natural_sort_key(x['name']))
    
    def get_chapter_images(self, chapter_path):
        """
        獲取章節的所有圖片（帶快取）
        
        Args:
            chapter_path: 章節路徑（相對路徑）
            
        Returns:
            list: 圖片路徑列表
        """
        parsed_path = parsePath(chapter_path)
        full_path = self.root_path / parsed_path
        
        if not full_path.exists():
            return []
        
        # get_images_in_dir 已內建快取
        return self.get_images_in_dir(full_path)
    
    def get_chapter_images_paginated(self, chapter_path, offset=0, limit=20):
        """
        分頁獲取章節圖片（Gallery 專用）
        
        Args:
            chapter_path: 章節路徑（相對路徑）
            offset: 起始位置
            limit: 數量限制
            
        Returns:
            tuple: (圖片列表, 總數)
        """
        parsed_path = parsePath(chapter_path)
        full_path = self.root_path / parsed_path
        return self.get_images_in_dir_paginated(full_path, offset=offset, limit=limit)
    
    def get_chapter_navigation(self, chapter_path):
        """
        獲取章節導航信息（上一話、下一話）- 帶快取
        
        Args:
            chapter_path: 章節路徑（相對路徑）
            
        Returns:
            dict: 導航信息
        """
        # 檢查快取
        cache_key = f"nav_{chapter_path}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        parsed_path = parsePath(chapter_path)
        full_path = self.root_path / parsed_path
        
        # 獲取作品目錄（章節的父目錄）
        work_path = full_path.parent
        work_name = work_path.name
        
        # 對於 Gallery，大多數情況下沒有章節（直接就是作品資料夾）
        # 快速檢查：如果父目錄就是根目錄，則沒有導航
        if work_path == self.root_path:
            result = {
                'prev': None, 
                'next': None, 
                'manga_name': full_path.name,
                'current_chapter': {'name': full_path.name, 'path': chapter_path},
                'total_chapters': 1,
                'current_index': 1
            }
            self.cache[cache_key] = result
            return result
        
        # 獲取該作品的所有章節
        all_chapters = self.get_chapters(work_path)
        if not all_chapters:
            result = {'prev': None, 'next': None, 'manga_name': work_name}
            self.cache[cache_key] = result
            return result
        
        # 找到當前章節的索引
        current_index = -1
        for i, chapter in enumerate(all_chapters):
            if parsePath(chapter['path']) == parsed_path:
                current_index = i
                break
        
        if current_index == -1:
            result = {'prev': None, 'next': None, 'manga_name': work_name}
            self.cache[cache_key] = result
            return result
        
        # 計算上一話和下一話
        prev_chapter = all_chapters[current_index - 1] if current_index > 0 else None
        next_chapter = all_chapters[current_index + 1] if current_index < len(all_chapters) - 1 else None
        
        result = {
            'prev': prev_chapter,
            'next': next_chapter,
            'manga_name': work_name,
            'current_chapter': all_chapters[current_index],
            'total_chapters': len(all_chapters),
            'current_index': current_index + 1  # 顯示時從1開始
        }
        
        # 快取結果
        if len(self.cache) < 100:
            self.cache[cache_key] = result
        
        return result
    
    def _empty_result(self, page, per_page):
        """返回空結果"""
        return {
            'mangas': [],
            'total': 0,
            'page': page,
            'per_page': per_page,
            'total_pages': 0
        }
