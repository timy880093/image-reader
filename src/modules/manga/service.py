"""
漫畫服務層
處理漫畫相關的業務邏輯
"""

from pathlib import Path
from core.base_reader import BaseReader
from core.utils import parsePath, formatPathForUrl


class MangaService(BaseReader):
    """漫畫服務類別，繼承自 BaseReader"""
    
    def get_manga_list(self, page=1, per_page=6, skip_chapters=False, status_filter=None, status_manager=None):
        """
        獲取所有漫畫列表
        
        Args:
            page: 頁碼（從1開始）
            per_page: 每頁顯示數量（預設6個）
            skip_chapters: 是否跳過章節信息載入（預設載入章節）
            status_filter: 狀態篩選 (favorite/unreviewed/reviewed)
            status_manager: 狀態管理器實例
            
        Returns:
            dict: 包含漫畫列表和分頁信息的字典
        """
        mangas = []
        if not self.root_path.exists():
            return self._empty_result(page, per_page)
        
        try:
            # 獲取所有漫畫目錄
            all_dirs = [d for d in self.root_path.iterdir() if d.is_dir()]
            
            # 應用狀態篩選
            if status_filter and status_manager:
                all_dirs = status_manager.filter_by_status('manga', all_dirs, status_filter)
            
            total_count = len(all_dirs)
            
            # 排序
            all_dirs.sort(key=lambda x: self.natural_sort_key(x.name))
            
            # 分頁
            start_idx = (page - 1) * per_page
            end_idx = start_idx + per_page
            page_dirs = all_dirs[start_idx:end_idx]
            
            for manga_dir in page_dirs:
                try:
                    # 使用緩存鍵
                    cache_key = f"manga_{manga_dir}_{skip_chapters}"
                    
                    if cache_key in self.cache:
                        manga_info = self.cache[cache_key]
                    else:
                        if skip_chapters:
                            # 快速模式：不載入章節詳情
                            chapters = []
                            # 檢查是否有子資料夾
                            subdirs = [d for d in manga_dir.iterdir() if d.is_dir()]
                            chapter_count = len(subdirs) if subdirs else 0
                        else:
                            # 完整模式：載入章節詳情
                            chapters = self.get_chapters(manga_dir)
                            chapter_count = len(chapters)
                        
                        cover_image = self.get_cover_image(manga_dir)
                        
                        manga_info = {
                            'name': manga_dir.name,
                            'path': formatPathForUrl(manga_dir.relative_to(self.root_path)),
                            'chapters': chapters,
                            'chapter_count': chapter_count,
                            'cover_image': cover_image
                        }
                        
                        # 緩存結果（最多緩存100個）
                        if len(self.cache) < 100:
                            self.cache[cache_key] = manga_info
                    
                    # 添加狀態信息（不緩存，因為會變動）
                    if status_manager:
                        manga_info_copy = manga_info.copy()
                        manga_info_copy['status'] = status_manager.get_status('manga', manga_dir.name)
                        mangas.append(manga_info_copy)
                    else:
                        mangas.append(manga_info)
                except Exception as e:
                    print(f"處理漫畫 {manga_dir.name} 時出錯: {e}")
                    continue
            
            return {
                'mangas': mangas,
                'total': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
        except Exception as e:
            print(f"獲取漫畫列表時出錯: {e}")
            return self._empty_result(page, per_page)
    
    def get_chapters(self, manga_path):
        """
        獲取漫畫的章節列表
        
        Args:
            manga_path: 漫畫目錄路徑
            
        Returns:
            list: 章節列表
        """
        chapters = []
        manga_path = Path(manga_path)
        
        # 檢查是否有子資料夾（章節）
        subdirs = [d for d in manga_path.iterdir() if d.is_dir()]
        
        if subdirs:
            # 有章節資料夾
            for chapter_dir in subdirs:
                images = self.get_images_in_dir(chapter_dir)
                if images:
                    chapters.append({
                        'name': chapter_dir.name,
                        'path': formatPathForUrl(chapter_dir.relative_to(self.root_path)),
                        'image_count': len(images)
                    })
        
        return sorted(chapters, key=lambda x: self.natural_sort_key(x['name']))
    
    def get_chapter_images(self, chapter_path):
        """
        獲取章節的所有圖片
        
        Args:
            chapter_path: 章節路徑（相對路徑）
            
        Returns:
            list: 圖片路徑列表
        """
        print(f"[DEBUG] 請求章節圖片: {chapter_path}")
        # 使用 parsePath 解析路徑
        parsed_path = parsePath(chapter_path)
        full_path = self.root_path / parsed_path
        print(f"[DEBUG] 解析後路徑: {parsed_path}")
        print(f"[DEBUG] 完整路徑: {full_path}")
        print(f"[DEBUG] 路徑是否存在: {full_path.exists()}")
        images = self.get_images_in_dir(full_path)
        print(f"[DEBUG] 找到圖片數量: {len(images)}")
        for img in images[:5]:  # 只顯示前5張
            print(f"[DEBUG] 圖片: {img}")
        return images
    
    def get_chapter_navigation(self, chapter_path):
        """
        獲取章節導航信息（上一話、下一話）
        
        Args:
            chapter_path: 章節路徑（相對路徑）
            
        Returns:
            dict: 導航信息
        """
        parsed_path = parsePath(chapter_path)
        full_path = self.root_path / parsed_path
        
        # 獲取漫畫目錄（章節的父目錄）
        manga_path = full_path.parent
        manga_name = manga_path.name
        
        # 獲取該漫畫的所有章節
        all_chapters = self.get_chapters(manga_path)
        if not all_chapters:
            return {'prev': None, 'next': None, 'manga_name': manga_name}
        
        # 找到當前章節的索引
        current_index = -1
        for i, chapter in enumerate(all_chapters):
            if parsePath(chapter['path']) == parsed_path:
                current_index = i
                break
        
        if current_index == -1:
            return {'prev': None, 'next': None, 'manga_name': manga_name}
        
        # 計算上一話和下一話
        prev_chapter = all_chapters[current_index - 1] if current_index > 0 else None
        next_chapter = all_chapters[current_index + 1] if current_index < len(all_chapters) - 1 else None
        
        return {
            'prev': prev_chapter,
            'next': next_chapter,
            'manga_name': manga_name,
            'current_chapter': all_chapters[current_index],
            'total_chapters': len(all_chapters),
            'current_index': current_index + 1  # 顯示時從1開始
        }
    
    def _empty_result(self, page, per_page):
        """返回空結果"""
        return {
            'mangas': [],
            'total': 0,
            'page': page,
            'per_page': per_page,
            'total_pages': 0
        }
