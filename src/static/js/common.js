/**
 * 共用 JavaScript 工具函數
 */

// HTML 轉義
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 節流函數
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
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

// 顯示錯誤訊息
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    } else {
        console.error(message);
    }
}

// 隱藏錯誤訊息
function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}
