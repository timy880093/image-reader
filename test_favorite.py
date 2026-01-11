"""
收藏功能測試腳本
用於診斷收藏功能是否正常工作
"""

import json
import sys
from pathlib import Path

# 添加 src 到路徑
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from core.status_manager import StatusManager

def test_status_manager():
    """測試 StatusManager 基本功能"""
    print("=" * 60)
    print("🧪 測試 StatusManager")
    print("=" * 60)
    
    # 初始化
    print("\n1. 初始化 StatusManager...")
    try:
        sm = StatusManager()
        print("   ✅ StatusManager 初始化成功")
    except Exception as e:
        print(f"   ❌ 初始化失敗: {e}")
        return False
    
    # 測試獲取狀態
    print("\n2. 測試獲取狀態...")
    try:
        status = sm.get_status('manga', '測試漫畫')
        print(f"   ✅ 獲取狀態成功: {status}")
    except Exception as e:
        print(f"   ❌ 獲取狀態失敗: {e}")
        return False
    
    # 測試設置收藏
    print("\n3. 測試設置收藏...")
    try:
        sm.set_status('manga', '測試漫畫', 'favorite')
        print("   ✅ 設置收藏成功")
    except Exception as e:
        print(f"   ❌ 設置收藏失敗: {e}")
        return False
    
    # 驗證狀態
    print("\n4. 驗證狀態...")
    try:
        status = sm.get_status('manga', '測試漫畫')
        if status == 'favorite':
            print(f"   ✅ 狀態驗證成功: {status}")
        else:
            print(f"   ❌ 狀態不正確: 預期 'favorite'，實際 '{status}'")
            return False
    except Exception as e:
        print(f"   ❌ 驗證失敗: {e}")
        return False
    
    # 檢查 JSON 文件
    print("\n5. 檢查 JSON 文件...")
    try:
        json_path = Path(__file__).parent / 'data' / 'status.json'
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if '測試漫畫' in data['manga']['favorite']:
            print("   ✅ JSON 文件更新成功")
            print(f"   📄 文件內容:\n{json.dumps(data, ensure_ascii=False, indent=2)}")
        else:
            print("   ❌ JSON 文件未更新")
            print(f"   📄 當前內容:\n{json.dumps(data, ensure_ascii=False, indent=2)}")
            return False
    except Exception as e:
        print(f"   ❌ 讀取 JSON 失敗: {e}")
        return False
    
    # 測試取消收藏
    print("\n6. 測試取消收藏...")
    try:
        sm.set_status('manga', '測試漫畫', 'reviewed')
        status = sm.get_status('manga', '測試漫畫')
        if status == 'reviewed':
            print(f"   ✅ 取消收藏成功: {status}")
        else:
            print(f"   ❌ 狀態不正確: {status}")
            return False
    except Exception as e:
        print(f"   ❌ 取消收藏失敗: {e}")
        return False
    
    # 再次檢查 JSON
    print("\n7. 再次檢查 JSON 文件...")
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if '測試漫畫' not in data['manga']['favorite']:
            print("   ✅ 收藏已正確移除")
        else:
            print("   ❌ 收藏未被移除")
            return False
    except Exception as e:
        print(f"   ❌ 讀取 JSON 失敗: {e}")
        return False
    
    return True


def check_file_permissions():
    """檢查文件權限"""
    print("\n" + "=" * 60)
    print("🔒 檢查文件權限")
    print("=" * 60)
    
    json_path = Path(__file__).parent / 'data' / 'status.json'
    
    # 檢查文件是否存在
    if not json_path.exists():
        print(f"   ❌ 文件不存在: {json_path}")
        return False
    
    print(f"   ✅ 文件存在: {json_path}")
    
    # 檢查是否可讀
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            f.read()
        print("   ✅ 文件可讀")
    except Exception as e:
        print(f"   ❌ 文件不可讀: {e}")
        return False
    
    # 檢查是否可寫
    try:
        with open(json_path, 'a', encoding='utf-8') as f:
            pass
        print("   ✅ 文件可寫")
    except Exception as e:
        print(f"   ❌ 文件不可寫: {e}")
        return False
    
    # 檢查文件大小
    size = json_path.stat().st_size
    print(f"   📊 文件大小: {size} bytes")
    
    return True


def main():
    print("\n" + "🌟" * 30)
    print("收藏功能診斷工具")
    print("🌟" * 30 + "\n")
    
    # 檢查文件權限
    if not check_file_permissions():
        print("\n❌ 文件權限檢查失敗")
        return
    
    # 測試 StatusManager
    if test_status_manager():
        print("\n" + "=" * 60)
        print("✅ 所有測試通過！收藏功能正常工作！")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ 測試失敗！請查看上面的錯誤訊息")
        print("=" * 60)
        print("\n💡 建議：")
        print("   1. 檢查服務器是否正在運行")
        print("   2. 確保 data/status.json 文件權限正確")
        print("   3. 查看 docs/收藏功能診斷指南.md 了解更多")


if __name__ == '__main__':
    main()
