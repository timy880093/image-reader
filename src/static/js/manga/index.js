/**
 * 漫畫列表頁面 JavaScript
 */

let allMangas = [];
let config = {};
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let currentFilter = 'all';  // 當前篩選狀態
let favoriteOnly = false;  // 只顯示收藏章節

const API_PREFIX = '/manga/api';
const IMAGE_PREFIX = '/manga/image/';
const READER_PREFIX = '/manga/reader/';

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', async () => {
    config = await loadConfig();
    applyConfig();
    bindEvents();
    loadFavoriteOnlySetting();
    loadMangas();
});

// 應用配置
function applyConfig() {
    const searchInput = document.getElementById('searchInput');
    if (config.ui && config.ui.search_placeholder) {
        searchInput.placeholder = config.ui.search_placeholder;
    }
}

// 綁定事件
function bindEvents() {
    // 搜尋事件
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterMangas(e.target.value);
    });

    // 篩選按鈕事件
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // 移除所有 active 類
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // 添加 active 到點擊的按鈕
            e.target.classList.add('active');
            // 設置當前篩選
            currentFilter = e.target.dataset.status;
            // 重新載入
            currentPage = 1;
            loadMangas();
        });
    });

    // 只顯示收藏章節切換事件（懸浮星星按鈕）
    const favoriteOnlyBtn = document.getElementById('favoriteOnlyBtn');
    if (favoriteOnlyBtn) {
        favoriteOnlyBtn.addEventListener('click', () => {
            favoriteOnly = !favoriteOnly;
            updateFavoriteOnlyBtn();
            saveFavoriteOnlySetting(favoriteOnly);
            currentPage = 1;
            loadMangas();
        });
    }

    // 滾動事件（無限滾動）
    window.addEventListener('scroll', throttle(handleScroll, 200));
}

// 載入漫畫列表
async function loadMangas(page = 1, append = false) {
    if (isLoading) return;
    isLoading = true;

    document.getElementById('loading').style.display = 'block';
    if (!append) {
        document.getElementById('mangaGrid').innerHTML = '';
    }

    try {
        // 構建 API URL，包含狀態篩選和只顯示收藏章節
        let url = `${API_PREFIX}/list?page=${page}&per_page=6&skip_chapters=false`;
        if (currentFilter && currentFilter !== 'all') {
            url += `&status=${currentFilter}`;
        }
        if (favoriteOnly) {
            url += `&favorite_only=true`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('無法載入列表');
        }

        const data = await response.json();
        const mangas = data.mangas || [];
        currentPage = data.page || 1;
        totalPages = data.total_pages || 1;

        if (append) {
            allMangas = allMangas.concat(mangas);
        } else {
            allMangas = mangas;
        }

        displayMangas(allMangas);
        updatePaginationInfo(data);
    } catch (error) {
        showError('載入時發生錯誤: ' + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
        isLoading = false;
    }
}

// 顯示漫畫列表
function displayMangas(mangas) {
    const grid = document.getElementById('mangaGrid');
    const noResults = document.getElementById('noResults');

    if (mangas.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    const mangaCards = mangas.map(manga => {
        // 封面圖片處理
        let coverImageHtml;
        if (manga.cover_image) {
            const imgTag = `<img src="${IMAGE_PREFIX}${encodeURIComponent(manga.cover_image)}" alt="${escapeHtml(manga.name)}" onerror="this.parentElement.innerHTML='<div class=&quot;manga-cover-placeholder-with-title&quot;>📚</div>'">`;

            if (manga.url_link) {
                // 有連結：可點擊，開新分頁
                coverImageHtml = `<a href="${escapeHtml(manga.url_link)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" class="manga-cover-link">${imgTag}</a>`;
            } else {
                // 無連結：不可點擊
                coverImageHtml = imgTag;
            }
        } else {
            // 無封面圖片
            coverImageHtml = '<div class="manga-cover-placeholder-with-title">📚</div>';
        }

        // 收藏按鈕
        const isFavorite = manga.status === 'favorite';
        const favoriteStar = isFavorite ? '★' : '☆';
        const favoriteTitle = isFavorite ? '取消收藏' : '加入收藏';

        let chaptersHtml = '';
        if (manga.chapters && manga.chapters.length > 0) {
            chaptersHtml = manga.chapters.map(chapter => `
                <div class="chapter-item" onclick="event.stopPropagation(); openChapter('${chapter.path}')">
                    <span class="chapter-name">${escapeHtml(chapter.name)}</span>
                    <span class="chapter-count">${chapter.image_count}頁</span>
                </div>
            `).join('');
        } else if (manga.chapter_count > 0) {
            chaptersHtml = `
                <div class="chapter-item" style="justify-content: center; cursor: default;">
                    <span class="chapter-name">共 ${manga.chapter_count} 個章節</span>
                </div>
            `;
        }

        return `
            <div class="manga-card" onclick="openManga('${manga.path}')">
                <div class="manga-cover">
                    ${coverImageHtml}
                    <button class="manga-favorite-btn" 
                            onclick="event.stopPropagation(); toggleCardFavorite('${escapeHtml(manga.path)}', this)"
                            title="${favoriteTitle}"
                            data-path="${escapeHtml(manga.path)}">
                        ${favoriteStar}
                    </button>
                </div>
                <div class="manga-title">${escapeHtml(manga.name)}</div>
                <div class="chapter-list">
                    ${chaptersHtml || '<div style="text-align: center; color: #999;">點擊查看詳情</div>'}
                </div>
            </div>
        `;
    });

    grid.innerHTML = mangaCards.join('');
}

// 打開漫畫
async function openManga(mangaPath) {
    const manga = allMangas.find(m => m.path === mangaPath);
    if (!manga) return;

    if (manga.chapters && manga.chapters.length > 0) {
        openChapter(manga.chapters[0].path);
        return;
    }

    try {
        const response = await fetch(`${API_PREFIX}/detail/${encodeURIComponent(mangaPath)}`);
        if (!response.ok) throw new Error('無法獲取章節信息');

        const detail = await response.json();
        if (detail.chapters && detail.chapters.length > 0) {
            openChapter(detail.chapters[0].path);
        } else {
            alert('此漫畫沒有可用的章節');
        }
    } catch (error) {
        console.error('獲取章節信息失敗:', error);
        alert('無法打開此漫畫，請稍後再試');
    }
}

// 打開章節
function openChapter(chapterPath) {
    window.open(`${READER_PREFIX}${encodeURIComponent(chapterPath)}`, '_blank');
}

// 搜尋功能
function filterMangas(searchTerm) {
    const filtered = allMangas.filter(manga =>
        manga.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (manga.chapters && manga.chapters.some(chapter =>
            chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
        ))
    );
    displayMangas(filtered);
}

// 更新分頁信息
function updatePaginationInfo(data) {
    let infoDiv = document.getElementById('paginationInfo');
    if (!infoDiv) {
        const container = document.querySelector('.container');
        infoDiv = document.createElement('div');
        infoDiv.id = 'paginationInfo';
        infoDiv.style.cssText = 'text-align: center; color: white; margin: 20px 0; font-size: 14px;';
        container.appendChild(infoDiv);
    }

    infoDiv.innerHTML = `
        <div style="margin-bottom: 10px;">
            顯示 ${allMangas.length} / ${data.total} 個項目
            ${data.total > allMangas.length ? `<button onclick="loadMore()" style="margin-left: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">載入更多</button>` : ''}
        </div>
    `;
}

// 載入更多
function loadMore() {
    if (currentPage < totalPages) {
        loadMangas(currentPage + 1, true);
    }
}

// 處理滾動（無限滾動）
function handleScroll() {
    if (isLoading || document.getElementById('searchInput').value.trim() !== '') {
        return;
    }

    if (currentPage >= totalPages) {
        return;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= documentHeight - 500) {
        loadMangas(currentPage + 1, true);
    }
}

// 切換卡片收藏狀態
async function toggleCardFavorite(mangaPath, buttonElement) {
    buttonElement.classList.add('loading');

    try {
        // 獲取當前狀態
        const response = await fetch(`${API_PREFIX}/status/${encodeURIComponent(mangaPath)}`);
        const currentData = await response.json();
        const isFavorite = currentData.status === 'favorite';

        // 切換狀態：如果已收藏則改為未審核，否則設為收藏
        const newStatus = isFavorite ? 'unreviewed' : 'favorite';

        const updateResponse = await fetch(`${API_PREFIX}/status/${encodeURIComponent(mangaPath)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (updateResponse.ok) {
            // 更新按鈕顯示
            buttonElement.textContent = isFavorite ? '☆' : '★';
            buttonElement.title = isFavorite ? '加入收藏' : '取消收藏';

            // 更新 allMangas 陣列中的狀態
            const manga = allMangas.find(m => m.path === mangaPath);
            if (manga) {
                manga.status = newStatus;
            }

            // 如果當前在收藏篩選頁，且剛剛取消了收藏，需要重新載入列表
            if (currentFilter === 'favorite' && isFavorite) {
                setTimeout(() => loadMangas(), 300);
            }
        }
    } catch (error) {
        console.error('更新收藏狀態失敗:', error);
        alert('更新收藏狀態失敗，請稍後再試');
    } finally {
        buttonElement.classList.remove('loading');
    }
}

// 保存只顯示收藏設定到 localStorage
function saveFavoriteOnlySetting(value) {
    try {
        localStorage.setItem('manga_favorite_only', value ? 'true' : 'false');
    } catch (error) {
        console.warn('無法保存設定:', error);
    }
}

// 更新懸浮星星按鈕狀態
function updateFavoriteOnlyBtn() {
    const btn = document.getElementById('favoriteOnlyBtn');
    if (btn) {
        btn.classList.toggle('active', favoriteOnly);
        btn.textContent = favoriteOnly ? '★' : '☆';
    }
}

// 載入只顯示收藏設定
function loadFavoriteOnlySetting() {
    try {
        const saved = localStorage.getItem('manga_favorite_only');
        favoriteOnly = saved === 'true';
        updateFavoriteOnlyBtn();
    } catch (error) {
        console.warn('無法載入設定:', error);
        favoriteOnly = false;
    }
}

// 載入配置
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.warn('無法載入配置:', error);
    }
    return {};
}

// HTML 轉義
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 節流函數
function throttle(func, wait) {
    let timeout;
    let previous = 0;
    return function () {
        const now = Date.now();
        const remaining = wait - (now - previous);
        const context = this;
        const args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func.apply(context, args);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                previous = Date.now();
                timeout = null;
                func.apply(context, args);
            }, remaining);
        }
    };
}

// 顯示錯誤
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        console.error(message);
    }
}
