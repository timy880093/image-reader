"""
Gallery 路由 Blueprint
定義所有 Gallery 相關的 HTTP 路由
"""

from flask import Blueprint, render_template, jsonify, request, send_file, make_response
from pathlib import Path
from core.utils import parsePath

# 創建 Blueprint
gallery_bp = Blueprint(
    'gallery',
    __name__,
    template_folder='templates',
    url_prefix='/gallery'
)

# 服務實例（將在 app.py 中初始化）
gallery_service = None
# 配置（將在 app.py 中初始化）
gallery_config = {
    'per_page': 6,
    'skip_chapters_on_list': True
}


def init_service(service, config=None):
    """
    初始化服務實例
    
    Args:
        service: GalleryService 實例
        config: Gallery 配置字典
    """
    global gallery_service, gallery_config
    gallery_service = service
    if config:
        gallery_config.update(config)


@gallery_bp.route('/')
def index():
    """Gallery 列表頁面"""
    return render_template('gallery/index.html', category='gallery', title='Gallery作品閱讀器')


@gallery_bp.route('/api/list')
def get_list():
    """API：獲取 Gallery 列表"""
    # 從配置取得預設值
    default_per_page = gallery_config.get('per_page', 6)
    default_skip_chapters = gallery_config.get('skip_chapters_on_list', True)
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', default_per_page, type=int)
    skip_chapters = request.args.get('skip_chapters', str(default_skip_chapters).lower()).lower() == 'true'
    filter_tag = request.args.get('filter_tag', None)  # 篩選標籤（如 gallery神）
    search_keyword = request.args.get('search', None)  # 搜尋關鍵字
    
    result = gallery_service.get_gallery_list(
        page=page, 
        per_page=per_page, 
        skip_chapters=skip_chapters,
        filter_tag=filter_tag,
        search_keyword=search_keyword
    )
    return jsonify(result)


@gallery_bp.route('/api/<path:gallery_path>')
def get_detail(gallery_path):
    """API：獲取 Gallery 詳情"""
    parsed_path = parsePath(gallery_path)
    full_path = gallery_service.root_path / parsed_path
    if not full_path.exists():
        return jsonify({'error': 'Gallery作品不存在'}), 404
    
    work_info = {
        'name': full_path.name,
        'path': gallery_path,
        'chapters': gallery_service.get_chapters(full_path)
    }
    return jsonify(work_info)


@gallery_bp.route('/api/detail/<path:gallery_path>')
def get_detail_alt(gallery_path):
    """API：獲取 Gallery 詳情（別名路由）"""
    return get_detail(gallery_path)


@gallery_bp.route('/api/chapter/<path:chapter_path>')
def get_chapter_images(chapter_path):
    """API：獲取 Gallery 章節圖片列表和導航信息（優化版 - 一次性返回所有 URL）"""
    # 一次性獲取所有圖片 URL（快速模式）
    images = gallery_service.get_chapter_images(chapter_path)
    navigation = gallery_service.get_chapter_navigation(chapter_path)
    
    response = make_response(jsonify({
        'images': images,
        'total': len(images),
        'navigation': navigation
    }))
    # API 快取 5 分鐘（圖片列表不太會變）
    response.headers['Cache-Control'] = 'public, max-age=300'
    return response


@gallery_bp.route('/image/<path:image_path>')
def serve_image(image_path):
    """提供 Gallery 圖片檔案（帶快取）"""
    parsed_path = parsePath(image_path)
    full_path = gallery_service.root_path / parsed_path
    if not full_path.exists():
        return jsonify({'error': '圖片不存在'}), 404
    
    response = send_file(str(full_path))
    # 添加快取頭，讓瀏覽器快取圖片 1 天
    response.headers['Cache-Control'] = 'public, max-age=86400'
    return response


@gallery_bp.route('/reader/<path:chapter_path>')
def reader_page(chapter_path):
    """Gallery 閱讀器頁面"""
    return render_template('gallery/reader.html', chapter_path=chapter_path, category='gallery')
