import os
import json
import uuid
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, render_template, session, make_response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
from PIL import Image
import base64
import io

from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain.schema.messages import BaseMessage

from config import Config

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# 全局变量存储会话数据（实际项目中应使用数据库）
# 格式: {username: {session_id: session_data}}
sessions_data = {}

# 速率限制存储 (IP -> [请求时间列表])
rate_limit_data = {}

# 用户账户存储 (username -> password_hash)
# 在生产环境中应该使用数据库
users_data = {}

# 安全配置 - 保持向后兼容
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'change_me_please!')
ENABLE_AUTH = os.environ.get('ENABLE_AUTH', 'true').lower() == 'true'

# 多用户配置
USERS_CONFIG = os.environ.get('USERS_CONFIG', '')  # 格式: user1:pass1,user2:pass2
ENABLE_MULTI_USER = os.environ.get('ENABLE_MULTI_USER', 'true').lower() == 'true'

# 速率限制配置
RATE_LIMIT_REQUESTS = int(os.environ.get('RATE_LIMIT_REQUESTS', '10'))  # 每分钟请求数
RATE_LIMIT_WINDOW = int(os.environ.get('RATE_LIMIT_WINDOW', '60'))  # 时间窗口（秒）
ENABLE_RATE_LIMIT = os.environ.get('ENABLE_RATE_LIMIT', 'true').lower() == 'true'

# IP白名单配置
IP_WHITELIST = os.environ.get('IP_WHITELIST', '').split(',') if os.environ.get('IP_WHITELIST') else []
ENABLE_IP_WHITELIST = os.environ.get('ENABLE_IP_WHITELIST', 'false').lower() == 'true'

def init_users():
    """初始化用户数据"""
    # 添加管理员用户（向后兼容）
    users_data[ADMIN_USERNAME] = ADMIN_PASSWORD
    
    # 解析多用户配置
    if ENABLE_MULTI_USER and USERS_CONFIG:
        try:
            user_pairs = USERS_CONFIG.split(',')
            for pair in user_pairs:
                if ':' in pair:
                    username, password = pair.split(':', 1)
                    username = username.strip()
                    password = password.strip()
                    if username and password:
                        users_data[username] = password
        except Exception as e:
            print(f"Error parsing USERS_CONFIG: {e}")

def check_auth(username, password):
    """验证用户名和密码"""
    if not users_data:
        init_users()
    
    return username in users_data and users_data[username] == password

def get_current_user():
    """获取当前认证的用户"""
    if not ENABLE_AUTH:
        return 'anonymous'
    
    auth = request.authorization
    if auth and check_auth(auth.username, auth.password):
        return auth.username
    return None

def requires_auth(f):
    """认证装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not ENABLE_AUTH:
            return f(*args, **kwargs)
            
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return make_response(jsonify({
                'error': '需要认证才能访问此资源',
                'message': '请提供正确的用户名和密码'
            }), 401, {'WWW-Authenticate': 'Basic realm="ChatApp"'})
        return f(*args, **kwargs)
    return decorated

def get_client_ip():
    """获取客户端真实IP"""
    if request.headers.getlist("X-Forwarded-For"):
        ip = request.headers.getlist("X-Forwarded-For")[0]
    elif request.headers.getlist("X-Real-IP"):
        ip = request.headers.getlist("X-Real-IP")[0]
    else:
        ip = request.remote_addr
    return ip

def check_rate_limit(ip):
    """检查IP是否超过速率限制"""
    if not ENABLE_RATE_LIMIT:
        return True
        
    now = datetime.now().timestamp()
    
    # 清理过期的请求记录
    if ip in rate_limit_data:
        rate_limit_data[ip] = [req_time for req_time in rate_limit_data[ip] 
                              if now - req_time < RATE_LIMIT_WINDOW]
    else:
        rate_limit_data[ip] = []
    
    # 检查是否超过限制
    if len(rate_limit_data[ip]) >= RATE_LIMIT_REQUESTS:
        return False
    
    # 记录这次请求
    rate_limit_data[ip].append(now)
    return True

def check_ip_whitelist(ip):
    """检查IP是否在白名单中"""
    if not ENABLE_IP_WHITELIST:
        return True
    
    # 清理空字符串
    whitelist = [ip.strip() for ip in IP_WHITELIST if ip.strip()]
    if not whitelist:
        return True
        
    return ip in whitelist

def rate_limit(f):
    """速率限制装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        client_ip = get_client_ip()
        if not check_rate_limit(client_ip):
            log_access(f.__name__, 'rate_limited')
            return make_response(jsonify({
                'error': '请求过于频繁',
                'message': f'每{RATE_LIMIT_WINDOW}秒最多允许{RATE_LIMIT_REQUESTS}次请求，请稍后再试'
            }), 429)
        return f(*args, **kwargs)
    return decorated

def ip_whitelist(f):
    """IP白名单装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        client_ip = get_client_ip()
        if not check_ip_whitelist(client_ip):
            log_access(f.__name__, 'ip_blocked')
            return make_response(jsonify({
                'error': '访问被拒绝',
                'message': '您的IP地址不在允许的访问列表中'
            }), 403)
        return f(*args, **kwargs)
    return decorated

# 请求日志记录
def log_access(endpoint, status='success'):
    """记录访问日志"""
    client_ip = get_client_ip()
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] IP: {client_ip} | Endpoint: {endpoint} | Status: {status}"
    print(log_entry)  # 在生产环境中应该写入文件

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def encode_image_to_base64(image_path):
    """将图片编码为base64格式"""
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None

def get_session_id():
    """获取或创建会话ID"""
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    return session['session_id']

def get_user_sessions(username):
    """获取用户的所有会话"""
    if username not in sessions_data:
        sessions_data[username] = {}
    return sessions_data[username]

def create_user_session(username, session_id=None):
    """为用户创建新会话"""
    if username not in sessions_data:
        sessions_data[username] = {}
    
    if not session_id:
        session_id = str(uuid.uuid4())
    
    sessions_data[username][session_id] = {
        'id': session_id,
        'title': '新对话',
        'messages': [],
        'created_at': datetime.now().isoformat()
    }
    return session_id

def init_chat_model(model_name="gpt-4o"):
    """初始化ChatOpenAI模型"""
    if not app.config['OPENAI_API_KEY']:
        raise ValueError("请设置OPENAI_API_KEY环境变量")
    
    return ChatOpenAI(
        openai_api_key=app.config['OPENAI_API_KEY'],
        model_name=model_name,
        temperature=0.7
    )

@app.route('/')
@requires_auth
def index():
    log_access('index_page')
    return render_template('index.html')

@app.route('/api/sessions', methods=['GET'])
@requires_auth
def get_sessions():
    """获取当前用户的所有会话列表"""
    username = get_current_user()
    if not username:
        return jsonify({'error': '用户未认证'}), 401
    
    session_id = get_session_id()
    user_sessions = get_user_sessions(username)
    
    # 确保当前会话存在
    if session_id not in user_sessions:
        create_user_session(username, session_id)
        user_sessions = get_user_sessions(username)
    
    # 返回用户会话的基本信息
    sessions_list = []
    for sid, data in user_sessions.items():
        sessions_list.append({
            'id': sid,
            'title': data['title'],
            'created_at': data['created_at'],
            'is_current': sid == session_id
        })
    
    # 按创建时间排序，最新的在前面
    sessions_list.sort(key=lambda x: x['created_at'], reverse=True)
    
    return jsonify({'sessions': sessions_list, 'current_session_id': session_id})

@app.route('/api/sessions', methods=['POST'])
@requires_auth
def create_session():
    """为当前用户创建新会话"""
    username = get_current_user()
    if not username:
        return jsonify({'error': '用户未认证'}), 401
    
    new_session_id = create_user_session(username)
    session['session_id'] = new_session_id
    return jsonify({'session_id': new_session_id})

@app.route('/api/sessions/<session_id>/switch', methods=['POST'])
@requires_auth
def switch_session(session_id):
    """切换到指定会话"""
    username = get_current_user()
    if not username:
        return jsonify({'error': '用户未认证'}), 401
    
    user_sessions = get_user_sessions(username)
    if session_id not in user_sessions:
        return jsonify({'error': '会话不存在或您无权访问'}), 404
    
    session['session_id'] = session_id
    return jsonify({'session_id': session_id, 'messages': user_sessions[session_id]['messages']})

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
@requires_auth
def delete_session(session_id):
    """删除指定会话"""
    username = get_current_user()
    if not username:
        return jsonify({'error': '用户未认证'}), 401
    
    user_sessions = get_user_sessions(username)
    if session_id not in user_sessions:
        return jsonify({'error': '会话不存在或您无权访问'}), 404
    
    del user_sessions[session_id]
    
    # 如果删除的是当前会话，创建新会话
    if session.get('session_id') == session_id:
        new_session_id = create_user_session(username)
        session['session_id'] = new_session_id
        return jsonify({'deleted': session_id, 'new_session_id': new_session_id})
    
    return jsonify({'deleted': session_id})

@app.route('/api/chat', methods=['POST'])
@requires_auth
@rate_limit
def chat():
    """处理聊天请求"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'error': '用户未认证'}), 401
            
        session_id = get_session_id()
        user_sessions = get_user_sessions(username)
        
        # 确保会话存在
        if session_id not in user_sessions:
            create_user_session(username, session_id)
            user_sessions = get_user_sessions(username)
        
        data = request.get_json()
        user_message = data.get('message', '')
        selected_model = data.get('model', 'gpt-4o')  # 默认使用 gpt-4o
        
        if not user_message.strip():
            return jsonify({'error': '消息不能为空'}), 400
        
        # 初始化聊天模型
        try:
            chat_model = init_chat_model(selected_model)
        except ValueError as e:
            return jsonify({'error': str(e)}), 500
        
        # 构建消息历史
        current_session = user_sessions[session_id]
        messages = []
        
        # 添加系统消息
        messages.append(SystemMessage(content="你是一个有帮助的AI助手，可以回答各种问题并分析图片。"))
        
        # 添加历史消息
        for msg in current_session['messages']:
            if msg['role'] == 'user':
                if 'image' in msg:
                    # 包含图片的消息
                    content = [
                        {"type": "text", "text": msg['content']},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{msg['image']}"}}
                    ]
                    messages.append(HumanMessage(content=content))
                else:
                    messages.append(HumanMessage(content=msg['content']))
            else:
                messages.append(AIMessage(content=msg['content']))
        
        # 添加当前用户消息
        messages.append(HumanMessage(content=user_message))
        
        # 调用模型获取响应
        response = chat_model(messages)
        ai_response = response.content
        
        # 保存消息到会话
        current_session['messages'].append({
            'role': 'user',
            'content': user_message,
            'timestamp': datetime.now().isoformat()
        })
        
        current_session['messages'].append({
            'role': 'assistant',
            'content': ai_response,
            'timestamp': datetime.now().isoformat()
        })
        
        # 更新会话标题（如果是第一条消息）
        if len(current_session['messages']) == 2:
            current_session['title'] = user_message[:20] + ('...' if len(user_message) > 20 else '')
        
        return jsonify({
            'response': ai_response,
            'session_id': session_id
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': f'处理消息时出错: {str(e)}'}), 500

@app.route('/api/upload', methods=['POST'])
@requires_auth
@rate_limit
def upload_image():
    """处理图片上传"""
    try:
        username = get_current_user()
        if not username:
            return jsonify({'error': '用户未认证'}), 401
            
        session_id = get_session_id()
        user_sessions = get_user_sessions(username)
        
        if 'image' not in request.files:
            return jsonify({'error': '没有上传图片'}), 400
        
        file = request.files['image']
        message = request.form.get('message', '')
        
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if file and allowed_file(file.filename):
            # 确保会话存在
            if session_id not in user_sessions:
                create_user_session(username, session_id)
                user_sessions = get_user_sessions(username)
            
            # 保存文件
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(file_path)
            
            # 编码图片为base64
            image_base64 = encode_image_to_base64(file_path)
            if not image_base64:
                return jsonify({'error': '图片处理失败'}), 500
            
            # 从请求中获取模型选择，默认使用支持视觉的模型
            selected_model = request.form.get('model', 'gpt-4o')  
            
            # 初始化聊天模型
            try:
                chat_model = init_chat_model(selected_model)
            except ValueError as e:
                return jsonify({'error': str(e)}), 500
            
            # 构建消息
            current_session = user_sessions[session_id]
            messages = [SystemMessage(content="你是一个有帮助的AI助手，可以回答各种问题并分析图片。")]
            
            # 添加历史消息
            for msg in current_session['messages']:
                if msg['role'] == 'user':
                    if 'image' in msg:
                        content = [
                            {"type": "text", "text": msg['content']},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{msg['image']}"}}
                        ]
                        messages.append(HumanMessage(content=content))
                    else:
                        messages.append(HumanMessage(content=msg['content']))
                else:
                    messages.append(AIMessage(content=msg['content']))
            
            # 添加包含图片的用户消息
            content = [
                {"type": "text", "text": message or "请分析这张图片"},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
            ]
            messages.append(HumanMessage(content=content))
            
            # 获取AI响应
            response = chat_model(messages)
            ai_response = response.content
            
            # 保存消息
            current_session['messages'].append({
                'role': 'user',
                'content': message or "请分析这张图片",
                'image': image_base64,
                'timestamp': datetime.now().isoformat()
            })
            
            current_session['messages'].append({
                'role': 'assistant',
                'content': ai_response,
                'timestamp': datetime.now().isoformat()
            })
            
            # 更新会话标题
            if len(current_session['messages']) == 2:
                current_session['title'] = (message or "图片分析")[:20] + ('...' if len(message or "图片分析") > 20 else '')
            
            # 清理临时文件
            os.remove(file_path)
            
            return jsonify({
                'response': ai_response,
                'session_id': session_id,
                'image_processed': True
            })
        
        return jsonify({'error': '不支持的文件类型'}), 400
        
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({'error': f'上传图片时出错: {str(e)}'}), 500

@app.route('/api/messages')
@requires_auth
def get_messages():
    """获取当前用户当前会话的消息"""
    username = get_current_user()
    if not username:
        return jsonify({'error': '用户未认证'}), 401
        
    session_id = get_session_id()
    user_sessions = get_user_sessions(username)
    
    if session_id not in user_sessions:
        create_user_session(username, session_id)
        user_sessions = get_user_sessions(username)
    
    return jsonify({'messages': user_sessions[session_id]['messages']})

@app.route('/api/models')
def get_models():
    """获取可用的模型列表"""
    models = [
        {'id': 'gpt-4o', 'name': 'GPT-4o', 'description': '最新的GPT-4模型，支持文本和图像'},
        {'id': 'gpt-4o-mini', 'name': 'GPT-4o Mini', 'description': '轻量版GPT-4o，速度更快，成本更低'},
        {'id': 'gpt-4-turbo', 'name': 'GPT-4 Turbo', 'description': 'GPT-4的改进版本，支持更长上下文'},
        {'id': 'gpt-3.5-turbo', 'name': 'GPT-3.5 Turbo', 'description': '经典的GPT-3.5模型，快速且经济'}
    ]
    return jsonify({'models': models})

@app.route('/api/security/status')
@requires_auth
def security_status():
    """获取安全配置状态"""
    client_ip = get_client_ip()
    status = {
        'client_ip': client_ip,
        'security_features': {
            'authentication': ENABLE_AUTH,
            'rate_limiting': ENABLE_RATE_LIMIT,
            'ip_whitelist': ENABLE_IP_WHITELIST
        },
        'rate_limit_config': {
            'requests_per_window': RATE_LIMIT_REQUESTS,
            'window_seconds': RATE_LIMIT_WINDOW,
            'current_requests': len(rate_limit_data.get(client_ip, []))
        } if ENABLE_RATE_LIMIT else None,
        'ip_whitelist_config': {
            'whitelist_ips': IP_WHITELIST,
            'is_whitelisted': check_ip_whitelist(client_ip)
        } if ENABLE_IP_WHITELIST else None
    }
    return jsonify(status)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
