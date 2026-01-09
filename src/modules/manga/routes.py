"""
漫畫路由 Blueprint
定義所有漫畫相關的 HTTP 路由
"""

from flask import Blueprint, render_template, jsonify, request, send_file
from pathlib import Path
from core.utils import parsePath

# 創建 Blueprint
manga_bp = Blueprint(
    'manga',
    __name__,
    template_folder='templates',
    url_prefix='/manga'
)

# 服務實例（將在 app.py 中初始化）
manga_service = None


def init_service(service):
    """
    初始化服務實例
    
    Args:
        service: MangaService 實例
    """
    global manga_service
    manga_service = service


@manga_bp.route('/')
def index():
    """漫畫列表頁面"""
    # 獲取 UI 配置
    ui_config = manga_service.config.get('ui', {})
    return render_template('manga/index.html', category='manga', title='漫畫閱讀器', ui_config=ui_config)


@manga_bp.route('/api/list')
def get_list():
    """API：獲取漫畫列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 6, type=int)
    skip_chapters = request.args.get('skip_chapters', 'false').lower() == 'true'  # 預設載入章節
    
    result = manga_service.get_manga_list(page=page, per_page=per_page, skip_chapters=skip_chapters)
    return jsonify(result)


@manga_bp.route('/api/<path:manga_path>')
def get_detail(manga_path):
    """API：獲取漫畫詳情"""
    parsed_path = parsePath(manga_path)
    full_path = manga_service.root_path / parsed_path
    if not full_path.exists():
        return jsonify({'error': '漫畫不存在'}), 404
    
    manga_info = {
        'name': full_path.name,
        'path': manga_path,
        'chapters': manga_service.get_chapters(full_path)
    }
    return jsonify(manga_info)


@manga_bp.route('/api/detail/<path:manga_path>')
def get_detail_alt(manga_path):
    """API：獲取漫畫詳情（別名路由）"""
    return get_detail(manga_path)


@manga_bp.route('/api/chapter/<path:chapter_path>')
def get_chapter_images(chapter_path):
    """API：獲取漫畫章節圖片列表和導航信息"""
    images = manga_service.get_chapter_images(chapter_path)
    navigation = manga_service.get_chapter_navigation(chapter_path)
    
    return jsonify({
        'images': images,
        'navigation': navigation
    })


@manga_bp.route('/image/<path:image_path>')
def serve_image(image_path):
    """提供漫畫圖片檔案"""
    parsed_path = parsePath(image_path)
    full_path = manga_service.root_path / parsed_path
    if not full_path.exists():
        return jsonify({'error': '圖片不存在'}), 404
    
    return send_file(str(full_path))


@manga_bp.route('/reader/<path:chapter_path>')
def reader_page(chapter_path):
    """漫畫閱讀器頁面"""
    return render_template('manga/reader.html', chapter_path=chapter_path, category='manga')
