/**
 * Gallery 列表頁面 JavaScript
 */

let allWorks = [];
let config = {};
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let currentFilter = null;
let currentSearchKeyword = '';
let searchDebounceTimer = null;

const API_PREFIX = '/gallery/api';
const IMAGE_PREFIX = '/gallery/image/';
const READER_PREFIX = '/gallery/reader/';

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', async () => {
    config = await loadConfig();
    applyConfig();
    bindEvents();
    loadWorks();
});

// 應用配置
function applyConfig() {
    const searchInput = document.getElementById('searchInput');
    if (config.ui && config.ui.search_placeholder) {
        searchInput.placeholder = '搜尋 Gallery 作品...';
    }
}

// 綁定事件
function bindEvents() {
    // 從配置取得搜尋防抖延遲時間
    const searchDebounceMs = (config.gallery && config.gallery.search_debounce_ms) || 300;

    // 搜尋事件 - 使用防抖呼叫 API 搜尋全部資料
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();

        // 清除之前的計時器
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }

        // 防抖後執行搜尋
        searchDebounceTimer = setTimeout(() => {
            searchWorks(searchTerm);
        }, searchDebounceMs);
    });

    // 滾動事件（無限滾動）
    window.addEventListener('scroll', throttle(handleScroll, 200));
}

// 載入作品列表
async function loadWorks(page = 1, append = false) {
    if (isLoading) return;
    isLoading = true;

    document.getElementById('loading').style.display = 'block';
    if (!append) {
        document.getElementById('mangaGrid').innerHTML = '';
    }

    try {
        // 從配置取得每頁數量，預設為 6
        const perPage = (config.gallery && config.gallery.per_page) || 6;

        // 使用配置的每頁數量
        let url = `${API_PREFIX}/list?page=${page}&per_page=${perPage}`;

        // 如果有篩選標籤，加入參數
        if (currentFilter) {
            url += `&filter_tag=${encodeURIComponent(currentFilter)}`;
        }

        // 如果有搜尋關鍵字，加入參數
        if (currentSearchKeyword) {
            url += `&search=${encodeURIComponent(currentSearchKeyword)}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('無法載入列表');
        }

        const data = await response.json();
        const works = data.mangas || [];  // API 回傳 mangas 欄位
        currentPage = data.page || 1;
        totalPages = data.total_pages || 1;

        if (append) {
            allWorks = allWorks.concat(works);
        } else {
            allWorks = works;
        }

        displayWorks(allWorks);
        updatePaginationInfo(data);
    } catch (error) {
        showError('載入時發生錯誤: ' + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
        isLoading = false;
    }
}

// 顯示作品列表
function displayWorks(works) {
    const grid = document.getElementById('mangaGrid');
    const noResults = document.getElementById('noResults');

    if (works.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    const workCards = works.map(work => {
        const coverImage = work.cover_image ?
            `<img src="${IMAGE_PREFIX}${encodeURIComponent(work.cover_image)}" alt="${escapeHtml(work.name)}" onerror="this.parentElement.innerHTML='<div class=&quot;work-cover-placeholder&quot;>🎨</div>'">` :
            '<div class="work-cover-placeholder">🎨</div>';

        // Gallery 只顯示圖片數量
        const imageCountHtml = `
            <div class="image-count-display">
                <span class="image-count-icon">📷</span>
                <span class="image-count-text">${work.chapter_count} 張圖片</span>
            </div>
        `;

        return `
            <div class="work-card" onclick="openWork('${work.path}')">
                <div class="work-cover">
                    ${coverImage}
                </div>
                <div class="work-title">${escapeHtml(work.name)}</div>
                ${imageCountHtml}
            </div>
        `;
    });

    grid.innerHTML = workCards.join('');
}

// 打開作品
async function openWork(workPath) {
    const work = allWorks.find(w => w.path === workPath);
    if (!work) return;

    // Gallery 直接打開閱讀器（因為沒有章節概念）
    window.location.href = `${READER_PREFIX}${encodeURIComponent(workPath)}`;
}

// 搜尋功能 - 呼叫 API 搜尋全部資料
function searchWorks(searchTerm) {
    // 更新當前搜尋關鍵字
    currentSearchKeyword = searchTerm;
    // 重設頁碼
    currentPage = 1;
    // 清空目前的作品列表
    allWorks = [];
    // 重新載入（帶搜尋參數）
    loadWorks(1, false);
}

// 本地過濾功能（保留備用）
function filterWorks(searchTerm) {
    const filtered = allWorks.filter(work =>
        work.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    displayWorks(filtered);
}

// 設定篩選標籤
function setFilter(filterTag) {
    currentFilter = filterTag;
    currentPage = 1;
    currentSearchKeyword = '';  // 清除搜尋關鍵字
    allWorks = [];

    // 更新按鈕狀態
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (filterTag) {
        document.getElementById('filterGod').classList.add('active');
    } else {
        document.getElementById('filterAll').classList.add('active');
    }

    // 清空搜尋框
    document.getElementById('searchInput').value = '';

    // 重新載入
    loadWorks(1, false);
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
            顯示 ${allWorks.length} / ${data.total} 個作品
            ${data.total > allWorks.length ? `<button onclick="loadMore()" style="margin-left: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">載入更多</button>` : ''}
        </div>
    `;
}

// 載入更多
function loadMore() {
    if (currentPage < totalPages) {
        loadWorks(currentPage + 1, true);
    }
}

// 處理滾動（無限滾動）
function handleScroll() {
    if (isLoading) {
        return;
    }

    if (currentPage >= totalPages) {
        return;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= documentHeight - 500) {
        loadWorks(currentPage + 1, true);
    }
}
