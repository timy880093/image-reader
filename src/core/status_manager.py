"""
狀態管理模組
管理漫畫和 Gallery 的狀態（收藏、已審核）
"""

import json
from pathlib import Path
from typing import Dict, List


class StatusManager:
    """狀態管理器"""
    
    # 狀態類型
    STATUS_FAVORITE = "favorite"      # 收藏
    STATUS_REVIEWED = "reviewed"      # 已審核
    STATUS_UNREVIEWED = "unreviewed"  # 未審核（虛擬狀態，表示不在任何列表中）
    
    # 類別
    CATEGORY_MANGA = "manga"
    CATEGORY_GALLERY = "gallery"
    
    def __init__(self, storage_path: str = "./data/status.json"):
        """
        初始化狀態管理器
        
        Args:
            storage_path: JSON 儲存檔案路徑
        """
        self.storage_path = Path(storage_path)
        self.data = self._load()
    
    def _load(self) -> Dict:
        """載入狀態資料"""
        if self.storage_path.exists():
            try:
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # 遷移舊數據：移除 unreviewed，保留 favorite 和 reviewed
                    for category in [self.CATEGORY_MANGA, self.CATEGORY_GALLERY]:
                        if category in data:
                            if 'unreviewed' in data[category]:
                                del data[category]['unreviewed']
                            if self.STATUS_REVIEWED not in data[category]:
                                data[category][self.STATUS_REVIEWED] = []
                    return data
            except Exception as e:
                print(f"載入狀態檔案失敗: {e}")
                return self._get_empty_structure()
        else:
            return self._get_empty_structure()
    
    def _get_empty_structure(self) -> Dict:
        """獲取空的資料結構"""
        return {
            self.CATEGORY_MANGA: {
                self.STATUS_FAVORITE: [],
                self.STATUS_REVIEWED: []
            },
            self.CATEGORY_GALLERY: {
                self.STATUS_FAVORITE: [],
                self.STATUS_REVIEWED: []
            }
        }
    
    def _save(self):
        """儲存狀態資料"""
        try:
            # 確保目錄存在
            self.storage_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"儲存狀態檔案失敗: {e}")
    
    def get_status(self, category: str, item_path: str) -> str:
        """
        獲取項目的狀態
        
        Args:
            category: 類別 (manga/gallery)
            item_path: 項目路徑（資料夾名稱）
            
        Returns:
            狀態字串 (favorite/reviewed/unreviewed)
            - favorite: 在 favorite 列表中
            - reviewed: 在 reviewed 列表中
            - unreviewed: 不在任何列表中（虛擬狀態）
        """
        if category not in self.data:
            return self.STATUS_UNREVIEWED
        
        category_data = self.data[category]
        
        # 優先檢查是否收藏
        if item_path in category_data.get(self.STATUS_FAVORITE, []):
            return self.STATUS_FAVORITE
        elif item_path in category_data.get(self.STATUS_REVIEWED, []):
            return self.STATUS_REVIEWED
        else:
            # 不在任何列表中，視為未審核
            return self.STATUS_UNREVIEWED
    
    def set_status(self, category: str, item_path: str, status: str) -> bool:
        """
        設定項目的狀態
        
        Args:
            category: 類別 (manga/gallery)
            item_path: 項目路徑（資料夾名稱）
            status: 狀態 (favorite/reviewed/unreviewed)
            
        Returns:
            是否設定成功
        """
        if category not in self.data:
            self.data[category] = {
                self.STATUS_FAVORITE: [],
                self.STATUS_REVIEWED: []
            }
        
        category_data = self.data[category]
        
        # 從所有狀態列表中移除
        for status_key in [self.STATUS_FAVORITE, self.STATUS_REVIEWED]:
            if status_key in category_data and item_path in category_data[status_key]:
                category_data[status_key].remove(item_path)
        
        # 添加到新狀態（unreviewed 不需要添加，因為是虛擬狀態）
        if status == self.STATUS_FAVORITE:
            if item_path not in category_data[self.STATUS_FAVORITE]:
                category_data[self.STATUS_FAVORITE].append(item_path)
        elif status == self.STATUS_REVIEWED:
            if item_path not in category_data[self.STATUS_REVIEWED]:
                category_data[self.STATUS_REVIEWED].append(item_path)
        # unreviewed 狀態：從所有列表中移除（已在上面完成）
        
        self._save()
        return True
    
    def get_items_by_status(self, category: str, status: str) -> List[str]:
        """
        獲取指定狀態的所有項目
        
        Args:
            category: 類別 (manga/gallery)
            status: 狀態 (favorite/reviewed/unreviewed)
            
        Returns:
            項目路徑列表
        """
        if category not in self.data:
            return []
        
        category_data = self.data[category]
        
        if status == self.STATUS_FAVORITE:
            return category_data.get(self.STATUS_FAVORITE, [])
        elif status == self.STATUS_REVIEWED:
            return category_data.get(self.STATUS_REVIEWED, [])
        elif status == self.STATUS_UNREVIEWED:
            # unreviewed 是虛擬狀態，需要在外部判斷
            return []
        else:
            return []
    
    def filter_by_status(self, category: str, items: List, status: str) -> List:
        """
        根據狀態篩選項目列表
        
        Args:
            category: 類別 (manga/gallery)
            items: 項目列表（Path 物件列表）
            status: 狀態 (favorite/reviewed/unreviewed)
            
        Returns:
            篩選後的項目列表
        """
        if status == self.STATUS_UNREVIEWED:
            # 未審核：不在 favorite 也不在 reviewed 列表中的項目
            favorite_set = set(self.get_items_by_status(category, self.STATUS_FAVORITE))
            reviewed_set = set(self.get_items_by_status(category, self.STATUS_REVIEWED))
            excluded_set = favorite_set | reviewed_set
            
            return [item for item in items if item.name not in excluded_set]
        else:
            # 收藏或已審核：在對應列表中的項目
            status_items = set(self.get_items_by_status(category, status))
            return [item for item in items if item.name in status_items]
    
    def get_all_statuses(self, category: str) -> Dict[str, str]:
        """
        獲取某類別所有項目的狀態映射
        
        Args:
            category: 類別 (manga/gallery)
            
        Returns:
            項目路徑到狀態的映射字典
        """
        if category not in self.data:
            return {}
        
        status_map = {}
        category_data = self.data[category]
        
        # 收藏
        for item in category_data.get(self.STATUS_FAVORITE, []):
            status_map[item] = self.STATUS_FAVORITE
        
        # 已審核
        for item in category_data.get(self.STATUS_REVIEWED, []):
            status_map[item] = self.STATUS_REVIEWED
        
        return status_map
