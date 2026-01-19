# 實作計畫：章節級收藏功能

## 概述

此實作計畫將章節級收藏功能分解為離散的編碼步驟。每個任務都建立在前面的步驟之上，確保增量進展和早期驗證。任務標記為可選（帶 `*`）的是測試相關的子任務，可以跳過以加快 MVP 開發。

## 任務

- [ ] 1. 擴展 StatusManager 以支援章節級收藏
  - 在 `src/core/status_manager.py` 中添加新方法
  - 實作 `get_chapter_status()` - 取得章節收藏狀態
  - 實作 `set_chapter_status()` - 設定章節收藏狀態
  - 實作 `get_favorite_chapters()` - 取得作品的所有已收藏章節
  - 實作 `filter_chapters_by_favorite()` - 篩選章節列表
  - 更新 `_get_empty_structure()` 以包含 `chapter_favorites` 欄位
  - 確保向後相容現有的作品級收藏
  - _需求：1.4、5.1、5.2、5.4、5.5_

- [ ]* 1.1 為 StatusManager 章節收藏方法編寫屬性測試
  - **屬性 2：章節收藏持久化**
  - **驗證需求：1.4、5.1**
  - **屬性 11：章節取消收藏儲存移除**
  - **驗證需求：5.2**
  - **屬性 13：章節和作品收藏分離**
  - **驗證需求：5.4**
  - **屬性 14：跨類別章節收藏**
  - **驗證需求：5.5**

- [ ]* 1.2 為 StatusManager 編寫單元測試
  - 測試空作品的章節收藏
  - 測試多個章節的收藏/取消收藏
  - 測試跨類別（manga/gallery）操作
  - 測試邊界情況（無效路徑、空字串）
  - _需求：5.1、5.2、5.4、5.5_

- [ ] 2. 為章節狀態添加 API 端點
  - 在 `src/modules/manga/routes.py` 中添加 `GET /api/chapter-status/<chapter_path>`
  - 在 `src/modules/manga/routes.py` 中添加 `POST /api/chapter-status/<chapter_path>`
  - 在 `src/modules/manga/routes.py` 中添加 `GET /api/favorite-chapters/<work_path>`
  - 在 `src/modules/gallery/routes.py` 中添加相同的三個端點
  - 實作適當的錯誤處理（404、400、500）
  - 確保 API 返回正確的 JSON 格式
  - _需求：6.1、6.2、6.3、6.4、6.5_

- [ ]* 2.1 為章節狀態 API 編寫屬性測試
  - **屬性 15：章節狀態 API 正確性**
  - **驗證需求：6.1、6.2**
  - **屬性 16：收藏章節列表 API 正確性**
  - **驗證需求：6.3**
  - **屬性 17：API 錯誤處理**
  - **驗證需求：6.4**
  - **屬性 18：跨類別 API 支援**
  - **驗證需求：6.5**

- [ ]* 2.2 為 API 端點編寫單元測試
  - 測試成功的 GET/POST 請求
  - 測試錯誤情況（章節不存在、無效輸入）
  - 測試 HTTP 狀態碼
  - 測試 JSON 回應格式
  - _需求：6.1、6.2、6.3、6.4_

- [ ] 3. 檢查點 - 確保所有測試通過
  - 確保所有測試通過，如有問題請詢問使用者。

- [ ] 4. 修改服務層以支援章節篩選
  - 更新 `src/modules/manga/service.py` 中的 `get_chapters()`
  - 添加 `filter_favorites` 參數
  - 為每個章節添加 `is_favorite` 欄位
  - 更新 `src/modules/gallery/service.py` 中的 `get_chapters()`
  - 確保篩選時維持章節順序
  - _需求：3.1、3.2、3.4_

- [ ]* 4.1 為章節篩選編寫屬性測試
  - **屬性 7：章節列表篩選**
  - **驗證需求：3.1、3.2**
  - **屬性 8：篩選後章節順序保持**
  - **驗證需求：3.4**

- [ ]* 4.2 為服務層篩選編寫單元測試
  - 測試混合收藏/非收藏章節的篩選
  - 測試無收藏章節的情況
  - 測試全部收藏的情況
  - 測試順序保持
  - _需求：3.1、3.2、3.4_

- [ ] 5. 實作帶篩選的智慧導航
  - 更新 `src/modules/manga/service.py` 中的 `get_chapter_navigation()`
  - 添加 `filter_favorites` 參數
  - 實作篩選啟用時跳過非收藏章節的邏輯
  - 實作篩選停用時順序導航的邏輯
  - 更新 `src/modules/gallery/service.py` 中的 `get_chapter_navigation()`
  - 確保邊界情況正確處理（第一章/最後一章）
  - _需求：4.1、4.2、4.3、4.5、4.6、4.7、4.8_

- [ ]* 5.1 為智慧導航編寫屬性測試
  - **屬性 10：帶篩選的智慧導航**
  - **驗證需求：4.1、4.2、4.3、4.4**

- [ ]* 5.2 為導航編寫單元測試
  - 測試範例：章節 1、5、10 已收藏，從第 5 章導航
  - 測試範例：篩選停用，章節 1-6，從第 5 章導航
  - 測試邊界情況（第一章、最後一章）
  - 測試無收藏章節的情況
  - _需求：4.1、4.2、4.3、4.7、4.8_

- [ ] 6. 修改現有 API 端點以支援篩選
  - 更新 `src/modules/manga/routes.py` 中的 `get_detail()`
  - 添加 `filter_favorites` 查詢參數支援
  - 更新 `src/modules/manga/routes.py` 中的 `get_chapter_images()`
  - 添加 `filter_favorites` 查詢參數到導航資訊
  - 對 `src/modules/gallery/routes.py` 進行相同更新
  - _需求：3.1、3.2、4.1、4.2、4.3_

- [ ] 7. 檢查點 - 確保所有測試通過
  - 確保所有測試通過，如有問題請詢問使用者。

- [ ] 8. 在主頁面添加篩選切換 UI
  - 在 `src/modules/manga/templates/manga/index.html` 中添加「只顯示收藏」核取方塊
  - 在 `src/modules/gallery/templates/gallery/index.html` 中添加相同的核取方塊
  - 添加適當的 CSS 樣式到 `src/static/css/manga.css`
  - 添加適當的 CSS 樣式到 `src/static/css/gallery.css`
  - 確保核取方塊在視覺上清晰可見
  - _需求：2.1、8.3_

- [ ] 9. 實作篩選切換 JavaScript 邏輯
  - 在 `src/static/js/manga/index.js` 中添加 `loadFilterPreference()`
  - 在 `src/static/js/manga/index.js` 中添加 `toggleFavoriteFilter()`
  - 在 `src/static/js/manga/index.js` 中添加 `refreshChapterLists()`
  - 實作 localStorage 持久化
  - 對 `src/static/js/gallery/index.js` 進行相同實作
  - 確保頁面載入時恢復篩選狀態
  - _需求：2.2、2.3、2.4、7.1、7.2、7.3、7.4_

- [ ]* 9.1 為篩選偏好編寫屬性測試
  - **屬性 4：篩選偏好持久化**
  - **驗證需求：2.2、2.3、7.1、7.2**
  - **屬性 5：篩選偏好往返**
  - **驗證需求：2.4、7.3**
  - **屬性 6：全域篩選應用**
  - **驗證需求：2.5**

- [ ] 10. 更新章節列表渲染以顯示收藏指示器
  - 修改 `src/static/js/manga/index.js` 中的 `renderChapter()`
  - 為已收藏章節添加星星圖示（★）
  - 為未收藏章節添加空心星星（☆）
  - 對 `src/static/js/gallery/index.js` 進行相同更新
  - 添加懸停效果的 CSS
  - _需求：8.1、8.2、8.4、8.5_

- [ ]* 10.1 為視覺指示器編寫屬性測試
  - **屬性 19：視覺指示器一致性**
  - **驗證需求：8.1、8.2、8.4**
  - **屬性 21：懸停回饋**
  - **驗證需求：8.5**

- [ ] 11. 在閱讀器中添加章節收藏按鈕
  - 在 `src/modules/manga/templates/manga/reader.html` 中添加收藏按鈕 HTML
  - 在 `src/modules/gallery/templates/gallery/reader.html` 中添加收藏按鈕 HTML
  - 添加按鈕樣式到 `src/static/css/manga.css`
  - 添加按鈕樣式到 `src/static/css/gallery.css`
  - 確保按鈕位置不干擾閱讀體驗
  - _需求：1.1_

- [ ] 12. 實作閱讀器收藏按鈕 JavaScript
  - 在 `src/static/js/manga/reader.js` 中添加 `loadChapterFavoriteStatus()`
  - 在 `src/static/js/manga/reader.js` 中添加 `toggleChapterFavorite()`
  - 在 `src/static/js/manga/reader.js` 中添加 `updateChapterFavoriteButton()`
  - 對 `src/static/js/gallery/reader.js` 進行相同實作
  - 確保按鈕在頁面載入時顯示正確狀態
  - 實作載入狀態視覺回饋
  - _需求：1.2、1.3、1.5_

- [ ]* 12.1 為章節收藏切換編寫屬性測試
  - **屬性 1：章節收藏切換一致性**
  - **驗證需求：1.2、1.3**
  - **屬性 3：章節收藏往返**
  - **驗證需求：1.5**

- [ ] 13. 更新閱讀器導航以遵循篩選
  - 修改 `src/static/js/manga/reader.js` 中的 `loadNavigationInfo()`
  - 從 localStorage 讀取篩選狀態
  - 將 `filter_favorites` 參數傳遞給 API
  - 修改 `src/static/js/manga/reader.js` 中的 `updateNavigationButtons()`
  - 根據可用性啟用/停用按鈕
  - 對 `src/static/js/gallery/reader.js` 進行相同更新
  - 確保鍵盤快捷鍵遵循篩選狀態
  - _需求：4.1、4.2、4.3、4.4、4.5、4.6_

- [ ]* 13.1 為導航整合編寫單元測試
  - 測試篩選啟用時的導航
  - 測試篩選停用時的導航
  - 測試鍵盤快捷鍵
  - 測試按鈕啟用/停用狀態
  - _需求：4.1、4.2、4.3、4.4、4.5、4.6_

- [ ] 14. 實作即時篩選更新
  - 修改章節收藏切換以觸發列表重新整理
  - 在 `src/static/js/manga/index.js` 中實作事件監聽器
  - 在 `src/static/js/gallery/index.js` 中實作事件監聽器
  - 確保更新不需要完整頁面重新載入
  - _需求：3.5_

- [ ]* 14.1 為即時更新編寫屬性測試
  - **屬性 9：即時篩選更新**
  - **驗證需求：3.5**

- [ ] 15. 檢查點 - 確保所有測試通過
  - 確保所有測試通過，如有問題請詢問使用者。

- [ ] 16. 整合測試和最終驗證
  - 測試完整的收藏工作流程（收藏 → 篩選 → 導航）
  - 測試跨模組一致性（manga ↔ gallery）
  - 測試邊界情況（無收藏、全部收藏、單一章節）
  - 測試錯誤處理（無效路徑、儲存失敗）
  - 驗證所有 21 個正確性屬性
  - _需求：所有需求_

- [ ]* 16.1 編寫端到端整合測試
  - 測試完整的使用者工作流程
  - 測試並發更新場景
  - 測試系統重啟後的持久化
  - **屬性 12：系統重啟持久化**
  - **驗證需求：5.3**

- [ ] 17. 文件和清理
  - 更新 README.md 以記錄章節收藏功能
  - 添加使用範例和截圖
  - 記錄 API 端點和參數
  - 清理任何調試程式碼或註解
  - 確保程式碼符合專案風格指南

## 注意事項

- 標記為 `*` 的任務是可選的，可以跳過以加快 MVP 開發
- 每個任務都引用特定需求以確保可追溯性
- 檢查點確保增量驗證
- 屬性測試驗證通用正確性屬性
- 單元測試驗證特定範例和邊界情況
