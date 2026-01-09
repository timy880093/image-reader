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

        this.initializeElements();
        this.loadConfig().then(() => {
            this.bindEvents();
            this.loadImages();
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
    }

    bindEvents() {
        // 鍵盤事件
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // 滾動事件來更新頁碼顯示
        this.imageContainer.addEventListener('scroll', () => {
            this.updatePageInfo();
        });
    }

    async loadImages() {
        try {
            const apiUrl = `${this.apiChapterEndpoint}${encodeURIComponent(this.chapterPath)}`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('章節不存在');

            const data = await response.json();
            this.images = data.images || [];
            this.navigation = data.navigation || null;

            this.updateChapterInfo();
            this.updateNavigationButtons();
            this.displayAllImages();

        } catch (error) {
            this.showError();
        }
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

            // 添加載入錯誤處理
            img.onerror = () => {
                img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><text x="50%" y="50%" text-anchor="middle" fill="%23999">載入失敗</text></svg>';
            };

            // 設置圖片來源
            img.src = `${this.imagePrefix}${encodeURIComponent(imagePath)}`;

            this.imagesContainer.appendChild(img);
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
        }
    }

    scrollToTop() {
        this.imageContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }

    scrollToBottom() {
        this.imageContainer.scrollTo({ top: this.imageContainer.scrollHeight, behavior: 'smooth' });
    }

    gotoPrevChapter() {
        if (this.navigation && this.navigation.prev) {
            window.location.href = `/manga/reader/${encodeURIComponent(this.navigation.prev.path)}`;
        }
    }

    gotoNextChapter() {
        if (this.navigation && this.navigation.next) {
            window.location.href = `/manga/reader/${encodeURIComponent(this.navigation.next.path)}`;
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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.reader = new MangaReader();
});
