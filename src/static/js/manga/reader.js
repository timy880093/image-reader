/**
 * 漫畫閱讀器 JavaScript
 * 依序載入並顯示所有圖片
 */

class MangaReader {
    constructor() {
        // 從路徑中提取章節路徑
        const pathParts = window.location.pathname.split('/');
        this.chapterPath = decodeURIComponent(pathParts.slice(3).join('/'));

        // 設置 API 端點
        this.apiChapterEndpoint = '/manga/api/chapter/';
        this.imagePrefix = '/manga/image/';

        this.images = [];
        this.navigation = null;
        this.config = {};
        this.favoriteOnly = false;  // 只顯示收藏章節
        this.allChapters = [];  // 所有章節列表
        this.maxImageHeight = 0;  // 最大圖片高度

        this.initializeElements();
        this.calculateMaxImageHeight();
        this.loadConfig().then(() => {
            this.loadFavoriteOnlySetting();
            this.bindEvents();
            this.loadImages();
        });
    }

    calculateMaxImageHeight() {
        // 計算可視區域的高度（扣除工具列）
        const toolbar = document.querySelector('.toolbar');
        const toolbarHeight = toolbar ? toolbar.offsetHeight : 60;
        const viewportHeight = window.innerHeight;
        
        // 可用高度 = 視窗高度 - 工具列高度
        // 因為一張圖片包含2張漫畫圖，所以最大高度設為可用高度的2倍
        // 這樣每張漫畫圖的高度正好等於一個視窗高度
        this.maxImageHeight = (viewportHeight - toolbarHeight) * 2;
        
        console.log(`計算最大圖片高度: ${this.maxImageHeight}px ((視窗: ${viewportHeight}px - 工具列: ${toolbarHeight}px) × 2)`);
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                this.config = await response.json();
            }
        } catch (error) {
            console.warn('無法載入配置:', error);
        }
    }

    initializeElements() {
        this.loadingElement = document.getElementById('loading');
        this.errorElement = document.getElementById('error');
        this.pageInfoElement = document.getElementById('pageInfo');
        this.chapterInfoElement = document.getElementById('chapterInfo');
        this.imagesContainer = document.getElementById('imagesContainer');
        this.imageContainer = document.getElementById('imageContainer');
        this.prevChapterBtn = document.getElementById('prevChapterBtn');
        this.nextChapterBtn = document.getElementById('nextChapterBtn');
        this.favoriteBtn = document.getElementById('favoriteBtn');
        this.favoriteStar = document.getElementById('favoriteStar');
        this.chapterMenu = document.getElementById('chapterMenu');
        this.chapterMenuItems = document.getElementById('chapterMenuItems');
    }

    bindEvents() {
        // 鍵盤事件
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // 滾動事件來更新頁碼顯示
        this.imageContainer.addEventListener('scroll', () => {
            this.updatePageInfo();
        });

        // 點擊外部關閉選單
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.chapter-menu-container')) {
                this.closeChapterMenu();
            }
        });

        // 視窗大小改變時重新計算最大圖片高度並保持閱讀位置
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleResize() {
        // 保存當前滾動位置的相對信息
        const scrollInfo = this.getCurrentScrollInfo();
        
        // 重新計算最大圖片高度
        this.calculateMaxImageHeight();
        this.applyMaxHeightToImages();
        
        // 等待圖片重新渲染後恢復位置
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.restoreScrollPosition(scrollInfo);
            }, 100);
        });
    }

    getCurrentScrollInfo() {
        // 獲取當前滾動位置的詳細信息
        const images = this.imagesContainer.querySelectorAll('.manga-image');
        if (images.length === 0) return null;

        const containerRect = this.imageContainer.getBoundingClientRect();
        const containerTop = this.imageContainer.scrollTop;
        
        // 找到當前可見的圖片
        for (let i = 0; i < images.length; i++) {
            const imgRect = images[i].getBoundingClientRect();
            const imgOffsetTop = images[i].offsetTop;
            
            // 如果圖片與視窗頂部有交集
            if (imgRect.bottom > containerRect.top) {
                // 計算圖片內部的相對位置（0-1之間）
                const imgScrolledAmount = containerTop - imgOffsetTop;
                const imgHeight = images[i].offsetHeight;
                const relativePosition = imgHeight > 0 ? imgScrolledAmount / imgHeight : 0;
                
                return {
                    imageIndex: i,
                    relativePosition: relativePosition,
                    imagePath: images[i].src
                };
            }
        }
        
        return { imageIndex: 0, relativePosition: 0 };
    }

    restoreScrollPosition(scrollInfo) {
        if (!scrollInfo) return;
        
        const images = this.imagesContainer.querySelectorAll('.manga-image');
        if (scrollInfo.imageIndex >= 0 && scrollInfo.imageIndex < images.length) {
            const targetImage = images[scrollInfo.imageIndex];
            const imgOffsetTop = targetImage.offsetTop;
            const imgHeight = targetImage.offsetHeight;
            
            // 根據相對位置計算新的滾動位置
            const newScrollTop = imgOffsetTop + (imgHeight * scrollInfo.relativePosition);
            
            this.imageContainer.scrollTop = newScrollTop;
            
            console.log(`恢復位置: 圖片 ${scrollInfo.imageIndex}, 相對位置 ${scrollInfo.relativePosition.toFixed(2)}, 滾動至 ${newScrollTop.toFixed(0)}px`);
        }
    }

    getCurrentVisibleImageIndex() {
        // 獲取當前可見的圖片索引
        const images = this.imagesContainer.querySelectorAll('.manga-image');
        if (images.length === 0) return -1;

        const containerRect = this.imageContainer.getBoundingClientRect();
        
        for (let i = 0; i < images.length; i++) {
            const imgRect = images[i].getBoundingClientRect();
            // 如果圖片的中心點在可視區域內
            if (imgRect.top <= containerRect.top + containerRect.height / 2 &&
                imgRect.bottom >= containerRect.top + containerRect.height / 2) {
                return i;
            }
        }
        
        return 0;
    }

    scrollToImage(imageIndex) {
        // 滾動到指定的圖片
        const images = this.imagesContainer.querySelectorAll('.manga-image');
        if (imageIndex >= 0 && imageIndex < images.length) {
            const targetImage = images[imageIndex];
            targetImage.scrollIntoView({ block: 'start', behavior: 'auto' });
        }
    }

    async loadImages() {
        try {
            let apiUrl = `${this.apiChapterEndpoint}${encodeURIComponent(this.chapterPath)}`;
            if (this.favoriteOnly) {
                apiUrl += `?favorite_only=true`;
            }
            
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('章節不存在');

            const data = await response.json();
            this.images = data.images || [];
            this.navigation = data.navigation || null;

            this.updateChapterInfo();
            this.updateNavigationButtons();
            this.displayAllImages();
            this.loadFavoriteStatus();
            this.loadAllChapters();

        } catch (error) {
            this.showError();
        }
    }

    async loadAllChapters() {
        if (!this.navigation || !this.navigation.manga_name) return;

        try {
            // 獲取漫畫的所有章節
            const mangaPath = this.chapterPath.split('/').slice(0, -1).join('/');
            let apiUrl = `/manga/api/detail/${encodeURIComponent(mangaPath)}`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) return;

            const data = await response.json();
            let chapters = data.chapters || [];

            // 如果啟用只顯示收藏，則篩選收藏的章節
            if (this.favoriteOnly) {
                const favoriteChapters = [];
                for (const chapter of chapters) {
                    try {
                        const statusResponse = await fetch(`/manga/api/status/${encodeURIComponent(chapter.path)}`);
                        if (statusResponse.ok) {
                            const statusData = await statusResponse.json();
                            if (statusData.status === 'favorite') {
                                favoriteChapters.push(chapter);
                            }
                        }
                    } catch (e) {
                        console.warn('無法檢查章節狀態:', e);
                    }
                }
                chapters = favoriteChapters.length > 0 ? favoriteChapters : chapters;
            }

            this.allChapters = chapters;
            this.renderChapterMenu();

        } catch (error) {
            console.warn('無法載入章節列表:', error);
        }
    }

    renderChapterMenu() {
        if (!this.allChapters || this.allChapters.length === 0) {
            this.chapterMenuItems.innerHTML = '<div style="padding: 15px; text-align: center; color: #999;">無可用章節</div>';
            return;
        }

        const currentPath = this.chapterPath;
        
        const menuHtml = this.allChapters.map(chapter => {
            const isCurrent = chapter.path === currentPath;
            const currentClass = isCurrent ? 'current' : '';
            const currentBadge = isCurrent ? '<span class="chapter-menu-item-badge">● 當前</span>' : '';
            
            return `
                <div class="chapter-menu-item ${currentClass}" onclick="window.reader.gotoChapter('${chapter.path}')">
                    <span class="chapter-menu-item-name">${this.escapeHtml(chapter.name)}</span>
                    ${currentBadge}
                </div>
            `;
        }).join('');

        this.chapterMenuItems.innerHTML = menuHtml;

        // 當前章節置中
        setTimeout(() => {
            const currentItem = this.chapterMenuItems.querySelector('.current');
            if (currentItem) {
                currentItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }, 100);
    }

    toggleChapterMenu() {
        this.chapterMenu.classList.toggle('show');
    }

    closeChapterMenu() {
        this.chapterMenu.classList.remove('show');
    }

    gotoChapter(chapterPath) {
        window.location.href = `/manga/reader/${encodeURIComponent(chapterPath)}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadFavoriteStatus() {
        if (!this.navigation || !this.navigation.current_chapter) return;

        try {
            // 使用章節路徑而不是漫畫名稱
            const chapterPath = this.navigation.current_chapter.path;
            const response = await fetch(`/manga/api/status/${encodeURIComponent(chapterPath)}`);
            if (response.ok) {
                const data = await response.json();
                this.updateFavoriteButton(data.status === 'favorite');
            }
        } catch (error) {
            console.warn('無法載入收藏狀態:', error);
        }
    }

    async toggleFavorite() {
        if (!this.navigation || !this.navigation.current_chapter) return;

        this.favoriteBtn.classList.add('loading');

        try {
            // 使用章節路徑而不是漫畫名稱
            const chapterPath = this.navigation.current_chapter.path;
            const response = await fetch(`/manga/api/status/${encodeURIComponent(chapterPath)}`);
            const currentData = await response.json();
            const isFavorite = currentData.status === 'favorite';

            // 切換狀態：如果已收藏則改為已審核，否則設為收藏
            const newStatus = isFavorite ? 'reviewed' : 'favorite';

            const updateResponse = await fetch(`/manga/api/status/${encodeURIComponent(chapterPath)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (updateResponse.ok) {
                this.updateFavoriteButton(!isFavorite);
            }
        } catch (error) {
            console.error('更新收藏狀態失敗:', error);
        } finally {
            this.favoriteBtn.classList.remove('loading');
        }
    }

    updateFavoriteButton(isFavorite) {
        this.favoriteStar.textContent = isFavorite ? '★' : '☆';
        this.favoriteBtn.title = isFavorite ? '取消收藏' : '加入收藏';
    }

    updateChapterInfo() {
        if (this.navigation && this.navigation.current_chapter) {
            const chapterName = this.navigation.current_chapter.name;
            const mangaName = this.navigation.manga_name;
            const chapterIndex = this.navigation.current_index;
            const totalChapters = this.navigation.total_chapters;

            this.chapterInfoElement.textContent = `${mangaName} - ${chapterName} (${chapterIndex}/${totalChapters})`;
        } else {
            this.chapterInfoElement.textContent = this.getChapterName();
        }

        this.pageInfoElement.textContent = `共 ${this.images.length} 頁`;
    }

    updateNavigationButtons() {
        if (this.navigation) {
            // 上一話按鈕
            if (this.navigation.prev) {
                this.prevChapterBtn.disabled = false;
                this.prevChapterBtn.title = `上一話: ${this.navigation.prev.name}`;
            } else {
                this.prevChapterBtn.disabled = true;
            }

            // 下一話按鈕
            if (this.navigation.next) {
                this.nextChapterBtn.disabled = false;
                this.nextChapterBtn.title = `下一話: ${this.navigation.next.name}`;
            } else {
                this.nextChapterBtn.disabled = true;
            }
        }
    }

    displayAllImages() {
        this.loadingElement.style.display = 'none';
        this.imagesContainer.innerHTML = '';

        // 依序載入所有圖片
        this.images.forEach((imagePath, index) => {
            const img = document.createElement('img');
            img.className = 'manga-image';
            img.dataset.index = index;
            img.alt = `第 ${index + 1} 頁`;

            // 設置最大高度
            if (this.maxImageHeight > 0) {
                img.style.maxHeight = `${this.maxImageHeight}px`;
            }

            // 添加載入錯誤處理
            img.onerror = () => {
                img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><text x="50%" y="50%" text-anchor="middle" fill="%23999">載入失敗</text></svg>';
            };

            // 設置圖片來源
            img.src = `${this.imagePrefix}${encodeURIComponent(imagePath)}`;

            this.imagesContainer.appendChild(img);
        });
    }

    applyMaxHeightToImages() {
        // 對已載入的圖片應用最大高度
        const images = this.imagesContainer.querySelectorAll('.manga-image');
        images.forEach(img => {
            if (this.maxImageHeight > 0) {
                img.style.maxHeight = `${this.maxImageHeight}px`;
            }
        });
    }

    updatePageInfo() {
        // 計算當前可見的圖片
        const images = this.imagesContainer.querySelectorAll('.manga-image');
        if (images.length === 0) return;

        const containerRect = this.imageContainer.getBoundingClientRect();
        let currentPage = 1;

        for (let i = 0; i < images.length; i++) {
            const imgRect = images[i].getBoundingClientRect();
            if (imgRect.top <= containerRect.top + containerRect.height / 2 &&
                imgRect.bottom >= containerRect.top + containerRect.height / 2) {
                currentPage = i + 1;
                break;
            }
        }

        this.pageInfoElement.textContent = `${currentPage} / ${this.images.length}`;
    }

    handleKeyboard(e) {
        switch (e.key) {
            case 'ArrowLeft':
                this.gotoPrevChapter();
                break;
            case 'ArrowRight':
                this.gotoNextChapter();
                break;
            case 'Home':
                this.scrollToTop();
                break;
            case 'End':
                this.scrollToBottom();
                break;
            case 'PageUp':
                e.preventDefault();
                this.scrollPageUp();
                break;
            case 'PageDown':
                e.preventDefault();
                this.scrollPageDown();
                break;
        }
    }

    scrollPageUp() {
        const scrollAmount = this.imageContainer.clientHeight * 0.9;
        this.imageContainer.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
    }

    scrollPageDown() {
        const scrollAmount = this.imageContainer.clientHeight * 0.9;
        this.imageContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }

    scrollToTop() {
        this.imageContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }

    scrollToBottom() {
        this.imageContainer.scrollTo({ top: this.imageContainer.scrollHeight, behavior: 'smooth' });
    }

    gotoPrevChapter() {
        if (this.navigation && this.navigation.prev) {
            const url = `/manga/reader/${encodeURIComponent(this.navigation.prev.path)}`;
            window.location.href = url;
        }
    }

    gotoNextChapter() {
        if (this.navigation && this.navigation.next) {
            const url = `/manga/reader/${encodeURIComponent(this.navigation.next.path)}`;
            window.location.href = url;
        }
    }

    loadFavoriteOnlySetting() {
        try {
            const saved = localStorage.getItem('manga_favorite_only');
            this.favoriteOnly = saved === 'true';
        } catch (error) {
            console.warn('無法載入設定:', error);
            this.favoriteOnly = false;
        }
    }

    getChapterName() {
        return this.chapterPath.split('/').pop() || '未知章節';
    }

    showError() {
        this.loadingElement.style.display = 'none';
        this.errorElement.style.display = 'flex';
    }
}

// 全域函數（供 HTML 調用）
function goToIndex() {
    window.location.href = '/manga';
}

function gotoPrevChapter() {
    if (window.reader) {
        window.reader.gotoPrevChapter();
    }
}

function gotoNextChapter() {
    if (window.reader) {
        window.reader.gotoNextChapter();
    }
}

function scrollToTop() {
    if (window.reader) {
        window.reader.scrollToTop();
    }
}

function scrollToBottom() {
    if (window.reader) {
        window.reader.scrollToBottom();
    }
}

function retryLoad() {
    location.reload();
}

function toggleFavorite() {
    if (window.reader) {
        window.reader.toggleFavorite();
    }
}

function toggleChapterMenu() {
    if (window.reader) {
        window.reader.toggleChapterMenu();
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.reader = new MangaReader();
});
