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
        this.maxImageWidth = 0;  // 最大圖片寬度

        this.initializeElements();
        this.calculateMaxImageWidth();
        this.loadConfig().then(() => {
            this.loadFavoriteOnlySetting();
            this.bindEvents();
            this.loadImages();
        });
    }

    calculateMaxImageWidth() {
        // 計算最大圖片寬度為視窗寬度的 50%
        const viewportWidth = window.innerWidth;
        this.maxImageWidth = viewportWidth * 0.5;
        
        console.log(`計算最大圖片寬度: ${this.maxImageWidth}px (視窗寬度: ${viewportWidth}px × 50%)`);
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

        // 視窗大小改變時重新計算最大圖片寬度並保持位置
        let resizeTimer;
        window.addEventListener('resize', () => {
            // 清除之前的計時器
            clearTimeout(resizeTimer);
            
            // 保存當前可見的圖片索引
            const currentImageIndex = this.getCurrentVisibleImageIndex();
            
            // 立即更新寬度（不等待）
            this.calculateMaxImageWidth();
            this.applyMaxWidthToImages();
            
            // 使用 requestAnimationFrame 確保在下一幀恢復位置
            requestAnimationFrame(() => {
                this.scrollToImageIndex(currentImageIndex);
            });
        });
    }

    getCurrentVisibleImageIndex() {
        // 獲取當前視窗中心點對應的圖片索引
        const images = this.imagesContainer.querySelectorAll('.manga-image');
        if (images.length === 0) return 0;

        const containerRect = this.imageContainer.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height / 2;
        
        for (let i = 0; i < images.length; i++) {
            const imgRect = images[i].getBoundingClientRect();
            // 如果圖片包含視窗中心點
            if (imgRect.top <= centerY && imgRect.bottom >= centerY) {
                return i;
            }
        }
        
        return 0;
    }

    scrollToImageIndex(index) {
        // 滾動到指定索引的圖片，使其頂部對齊視窗頂部
        const images = this.imagesContainer.querySelectorAll('.manga-image');
        if (index >= 0 && index < images.length) {
            const targetImage = images[index];
            const offsetTop = targetImage.offsetTop;
            const toolbar = document.querySelector('.toolbar');
            const toolbarHeight = toolbar ? toolbar.offsetHeight : 60;
            
            // 直接設置 scrollTop，不使用 scrollIntoView 避免動畫
            this.imageContainer.scrollTop = offsetTop - toolbarHeight;
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

            // 設置最大寬度
            if (this.maxImageWidth > 0) {
                img.style.maxWidth = `${this.maxImageWidth}px`;
                img.style.width = 'auto';
                img.style.height = 'auto';
                img.style.objectFit = 'contain';
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

    applyMaxWidthToImages() {
        // 對已載入的圖片應用最大寬度
        const images = this.imagesContainer.querySelectorAll('.manga-image');
        images.forEach(img => {
            if (this.maxImageWidth > 0) {
                img.style.maxWidth = `${this.maxImageWidth}px`;
                img.style.width = 'auto';
                img.style.height = 'auto';
                img.style.objectFit = 'contain';
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
