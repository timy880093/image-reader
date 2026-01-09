/**
 * 漫畫列表頁面 JavaScript
 */

let allMangas = [];
let config = {};
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

const API_PREFIX = '/manga/api';
const IMAGE_PREFIX = '/manga/image/';
const READER_PREFIX = '/manga/reader/';

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', async () => {
    config = await loadConfig();
    applyConfig();
    bindEvents();
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
        // per_page=6, skip_chapters=false (載入章節)
        const response = await fetch(`${API_PREFIX}/list?page=${page}&per_page=6&skip_chapters=false`);
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
        const coverImage = manga.cover_image ?
            `<img src="${IMAGE_PREFIX}${encodeURIComponent(manga.cover_image)}" alt="${escapeHtml(manga.name)}" onerror="this.parentElement.innerHTML='<div class=&quot;manga-cover-placeholder-with-title&quot;>📚</div>'">` :
            '<div class="manga-cover-placeholder-with-title">📚</div>';

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
                    ${coverImage}
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
    window.location.href = `${READER_PREFIX}${encodeURIComponent(chapterPath)}`;
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
