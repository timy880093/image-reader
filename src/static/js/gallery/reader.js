/**
 * Gallery 閱讀器 JavaScript
 * 優化版：一次性載入所有圖片 URL，前端分批渲染，搭配圖片預載入
 */

class GalleryReader {
    constructor() {
        // 從路徑中提取章節路徑
        const pathParts = window.location.pathname.split('/');
        this.chapterPath = decodeURIComponent(pathParts.slice(3).join('/'));

        // 設置 API 端點
        this.apiChapterEndpoint = '/gallery/api/chapter/';
        this.imagePrefix = '/gallery/image/';

        this.allImageUrls = [];  // 所有圖片 URL
        this.totalImages = 0;
        this.loadedImages = 0;
        this.navigation = null;
        this.config = {};
        this.observer = null;
        this.batchSize = 5;  // 每批渲染 5 張
        this.preloadCount = 8;  // 預載入接下來的 8 張
        this.preloadedSet = new Set();  // 追蹤已預載入的圖片

        this.initializeElements();
        this.loadConfig().then(() => {
            this.bindEvents();
            this.loadAllImageUrls();
        });
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
    }

    bindEvents() {
        // 鍵盤事件
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    async loadAllImageUrls() {
        try {
            // 一次性載入所有圖片 URL
            const apiUrl = `${this.apiChapterEndpoint}${encodeURIComponent(this.chapterPath)}`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('章節不存在');

            const data = await response.json();
            this.allImageUrls = data.images || [];
            this.totalImages = data.total || this.allImageUrls.length;
            this.navigation = data.navigation || null;

            this.updateChapterInfo();
            this.updateNavigationButtons();
            this.createAllPlaceholders();
            this.setupLazyLoading();
            this.loadFavoriteStatus();

        } catch (error) {
            this.showError();
        }
    }

    async loadFavoriteStatus() {
        if (!this.navigation || !this.navigation.manga_name) return;

        try {
            const response = await fetch(`/gallery/api/status/${this.navigation.manga_name}`);
            if (response.ok) {
                const data = await response.json();
                this.updateFavoriteButton(data.status === 'favorite');
            }
        } catch (error) {
            console.warn('無法載入收藏狀態:', error);
        }
    }

    async toggleFavorite() {
        if (!this.navigation || !this.navigation.manga_name) return;

        this.favoriteBtn.classList.add('loading');

        try {
            const response = await fetch(`/gallery/api/status/${this.navigation.manga_name}`);
            const currentData = await response.json();
            const isFavorite = currentData.status === 'favorite';

            // 切換狀態：如果已收藏則改為未審核，否則設為收藏
            const newStatus = isFavorite ? 'unreviewed' : 'favorite';

            const updateResponse = await fetch(`/gallery/api/status/${this.navigation.manga_name}`, {
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

            this.chapterInfoElement.textContent = `${mangaName} - ${chapterName}`;
        } else {
            this.chapterInfoElement.textContent = this.getChapterName();
        }

        this.pageInfoElement.textContent = `共 ${this.totalImages} 張圖片`;
    }

    updateNavigationButtons() {
        if (this.navigation) {
            if (this.navigation.prev) {
                this.prevChapterBtn.disabled = false;
                this.prevChapterBtn.title = `上一個: ${this.navigation.prev.name}`;
            } else {
                this.prevChapterBtn.disabled = true;
            }

            if (this.navigation.next) {
                this.nextChapterBtn.disabled = false;
                this.nextChapterBtn.title = `下一個: ${this.navigation.next.name}`;
            } else {
                this.nextChapterBtn.disabled = true;
            }
        }
    }

    createPlaceholders(initialImages) {
        this.loadingElement.style.display = 'none';
        this.imagesContainer.innerHTML = '';

        // 創建所有佔位符
        for (let i = 0; i < this.totalImages; i++) {
            if (i < initialImages.length) {
                // 前 3 張：載入實際圖片
                this.createImageElement(initialImages[i], i);
            } else {
                // 其餘：創建佔位符
                this.createPlaceholderElement(i);
            }
        }

        this.loadedImages = initialImages.length;
    }

    createAllPlaceholders() {
        this.loadingElement.style.display = 'none';
        this.imagesContainer.innerHTML = '';

        // 立即載入前 5 張，其餘用佔位符
        const initialLoadCount = Math.min(5, this.totalImages);

        for (let i = 0; i < this.totalImages; i++) {
            if (i < initialLoadCount) {
                // 前幾張直接載入（不用等 IntersectionObserver）
                this.createImageElement(this.allImageUrls[i], i);
            } else {
                this.createPlaceholderElement(i);
            }
        }

        this.loadedImages = initialLoadCount;

        // 預載入接下來的圖片
        this.preloadNextImages(initialLoadCount);
    }

    createImageElement(imagePath, index) {
        const img = document.createElement('img');
        img.className = 'gallery-image loaded';
        img.dataset.index = index;
        img.dataset.loaded = 'true';
        img.alt = `第 ${index + 1} 張`;
        img.loading = 'lazy';  // 使用瀏覽器原生 lazy loading

        img.onerror = () => {
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><text x="50%" y="50%" text-anchor="middle" fill="%23999">載入失敗</text></svg>';
        };

        img.src = `${this.imagePrefix}${encodeURIComponent(imagePath)}`;
        this.imagesContainer.appendChild(img);
    }

    createPlaceholderElement(index) {
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.dataset.index = index;
        placeholder.dataset.loaded = 'false';

        placeholder.innerHTML = `
            <div class="placeholder-content">
                <div class="placeholder-icon">🖼️</div>
                <div class="placeholder-text">第 ${index + 1} 張</div>
                <div class="placeholder-hint">滾動到此處自動載入</div>
            </div>
        `;

        this.imagesContainer.appendChild(placeholder);
    }

    setupLazyLoading() {
        // 使用 Intersection Observer 實現懶加載
        const options = {
            root: this.imageContainer,
            rootMargin: '1200px',  // 提前 1200px 開始載入（確保流暢滾動）
            threshold: 0
        };

        this.observer = new IntersectionObserver((entries) => {
            // 收集所有進入視窗的佔位符
            const toLoad = [];
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const placeholder = entry.target;
                    if (placeholder.dataset.loaded === 'false') {
                        const index = parseInt(placeholder.dataset.index);
                        toLoad.push(index);
                    }
                }
            });

            // 批次載入
            toLoad.forEach(index => this.loadImageForPlaceholder(index));
        }, options);

        // 觀察所有佔位符
        document.querySelectorAll('.image-placeholder').forEach(placeholder => {
            this.observer.observe(placeholder);
        });
    }

    loadImageForPlaceholder(index) {
        // 從已載入的 URL 列表中取得圖片
        if (index >= this.allImageUrls.length) return;

        const imagePath = this.allImageUrls[index];
        const placeholder = document.querySelector(`.image-placeholder[data-index="${index}"]`);

        if (placeholder && imagePath) {
            // 停止觀察
            this.observer.unobserve(placeholder);

            // 創建圖片元素
            const img = document.createElement('img');
            img.className = 'gallery-image';
            img.dataset.index = index;
            img.dataset.loaded = 'true';
            img.alt = `第 ${index + 1} 張`;
            img.loading = 'lazy';  // 瀏覽器原生 lazy loading

            img.onerror = () => {
                img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><text x="50%" y="50%" text-anchor="middle" fill="%23999">載入失敗</text></svg>';
            };

            img.onload = () => {
                // 圖片載入成功後，預載入接下來的幾張
                this.preloadNextImages(index + 1);
            };

            img.src = `${this.imagePrefix}${encodeURIComponent(imagePath)}`;

            // 替換佔位符
            placeholder.replaceWith(img);
            this.loadedImages++;
        }
    }

    preloadNextImages(startIndex) {
        // 預載入接下來的 N 張圖片（不顯示，只載入到瀏覽器快取）
        for (let i = 0; i < this.preloadCount; i++) {
            const index = startIndex + i;
            if (index >= this.allImageUrls.length) break;

            // 避免重複預載入
            if (this.preloadedSet.has(index)) continue;
            this.preloadedSet.add(index);

            const imagePath = this.allImageUrls[index];
            if (imagePath) {
                const img = new Image();
                img.src = `${this.imagePrefix}${encodeURIComponent(imagePath)}`;
                // 不需要做任何事，只是觸發瀏覽器快取
            }
        }
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
            window.location.href = `/gallery/reader/${encodeURIComponent(this.navigation.prev.path)}`;
        }
    }

    gotoNextChapter() {
        if (this.navigation && this.navigation.next) {
            window.location.href = `/gallery/reader/${encodeURIComponent(this.navigation.next.path)}`;
        }
    }

    getChapterName() {
        return this.chapterPath.split('/').pop() || '未知作品';
    }

    showError() {
        this.loadingElement.style.display = 'none';
        this.errorElement.style.display = 'flex';
    }
}

// 全域函數（供 HTML 調用）
function goToIndex() {
    window.location.href = '/gallery';
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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.reader = new GalleryReader();
});
