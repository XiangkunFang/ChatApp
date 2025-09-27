// 全局变量
let currentSessionId = null;
let selectedImage = null;
let sessions = [];

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// 初始化应用
async function initializeApp() {
    try {
        await loadSessions();
        await loadMessages();
        await loadModels();
        checkApiStatus();
    } catch (error) {
        console.error('初始化失败:', error);
        showError('应用初始化失败，请刷新页面重试');
    }
}

// 设置事件监听器
function setupEventListeners() {
    const messageForm = document.getElementById('messageForm');
    messageForm.addEventListener('submit', handleMessageSubmit);
    
    // 点击空白区域隐藏侧边栏（移动端）
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        
        if (window.innerWidth <= 768 && 
            !sidebar.contains(event.target) && 
            !sidebarToggle.contains(event.target)) {
            sidebar.classList.remove('open');
        }
    });
    
    // 移动端输入框焦点处理
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('focus', function() {
            if (window.innerWidth <= 768) {
                // 移动端获得焦点时确保输入框可见
                setTimeout(() => {
                    this.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }, 300); // 等待虚拟键盘弹出
            }
        });
        
        // 处理虚拟键盘隐藏
        messageInput.addEventListener('blur', function() {
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    scrollToBottom();
                }, 300);
            }
        });
    }
}

// 加载可用模型列表
async function loadModels() {
    try {
        const response = await fetch('/api/models');
        const data = await response.json();
        
        const modelSelect = document.getElementById('modelSelect');
        modelSelect.innerHTML = '';
        
        data.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            option.title = model.description;
            modelSelect.appendChild(option);
        });
        
        // 默认选择第一个模型（gpt-4o）
        if (data.models.length > 0) {
            modelSelect.value = data.models[0].id;
        }
    } catch (error) {
        console.error('加载模型列表失败:', error);
        // 如果加载失败，使用默认选项
        const modelSelect = document.getElementById('modelSelect');
        modelSelect.innerHTML = '<option value="gpt-4o">GPT-4o</option>';
    }
}

// 检查API状态
async function checkApiStatus() {
    try {
        const response = await fetch('/api/sessions');
        const statusElement = document.getElementById('apiStatus');
        
        if (response.ok) {
            statusElement.innerHTML = `
                <i class="fas fa-circle text-green"></i>
                <span>API已连接</span>
            `;
        } else {
            statusElement.innerHTML = `
                <i class="fas fa-circle text-red"></i>
                <span>API连接失败</span>
            `;
        }
    } catch (error) {
        const statusElement = document.getElementById('apiStatus');
        statusElement.innerHTML = `
            <i class="fas fa-circle text-red"></i>
            <span>网络错误</span>
        `;
    }
}

// 加载会话列表
async function loadSessions() {
    try {
        const response = await fetch('/api/sessions');
        const data = await response.json();
        
        sessions = data.sessions;
        currentSessionId = data.current_session_id;
        
        renderSessions();
        updateCurrentSessionTitle();
    } catch (error) {
        console.error('加载会话失败:', error);
    }
}

// 渲染会话列表
function renderSessions() {
    const sessionsList = document.getElementById('sessionsList');
    
    if (sessions.length === 0) {
        sessionsList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">暂无对话</div>';
        return;
    }
    
    sessionsList.innerHTML = sessions.map(session => `
        <div class="session-item ${session.is_current ? 'active' : ''}" 
             onclick="switchSession('${session.id}')">
            <div class="session-content">
                <div class="session-title">${escapeHtml(session.title)}</div>
                <div class="session-time">${formatTime(session.created_at)}</div>
            </div>
            <button class="session-delete-btn" 
                    onclick="deleteSession('${session.id}', event)" 
                    title="删除对话">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// 更新当前会话标题
function updateCurrentSessionTitle() {
    const currentSession = sessions.find(s => s.id === currentSessionId);
    const titleElement = document.getElementById('currentSessionTitle');
    
    if (currentSession) {
        titleElement.textContent = currentSession.title;
    } else {
        titleElement.textContent = '新对话';
    }
}

// 创建新会话
async function createNewSession() {
    try {
        showLoading(true);
        
        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentSessionId = data.session_id;
            
            await loadSessions();
            clearMessages();
            showWelcomeMessage();
        } else {
            throw new Error('创建会话失败');
        }
    } catch (error) {
        console.error('创建新会话失败:', error);
        showError('创建新会话失败，请重试');
    } finally {
        showLoading(false);
    }
}

// 切换会话
async function switchSession(sessionId) {
    if (sessionId === currentSessionId) return;
    
    try {
        showLoading(true);
        
        const response = await fetch(`/api/sessions/${sessionId}/switch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentSessionId = data.session_id;
            
            await loadSessions();
            renderMessages(data.messages);
            
            // 移动端切换后隐藏侧边栏
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
            }
        } else {
            throw new Error('切换会话失败');
        }
    } catch (error) {
        console.error('切换会话失败:', error);
        showError('切换会话失败，请重试');
    } finally {
        showLoading(false);
    }
}

// 删除指定会话
async function deleteSession(sessionId, event) {
    // 阻止事件冒泡，避免触发会话切换
    if (event) {
        event.stopPropagation();
    }
    
    if (!sessionId) return;
    
    const confirmed = confirm('确定要删除这个对话吗？此操作无法撤销。');
    if (!confirmed) return;
    
    try {
        showLoading(true);
        
        const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // 刷新会话列表
            await loadSessions();
            
            // 如果删除的是当前会话，切换到新会话
            if (data.new_session_id) {
                currentSessionId = data.new_session_id;
                await loadMessages();
            } else if (sessionId === currentSessionId) {
                // 如果删除的是当前会话但没有新会话，清空消息
                clearMessages();
                showWelcomeMessage();
            }
            
            showSuccess('对话已删除');
        } else {
            throw new Error(data.error || '删除会话失败');
        }
    } catch (error) {
        console.error('删除会话失败:', error);
        showError('删除会话失败: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// 删除当前会话（向后兼容）
async function deleteCurrentSession() {
    if (currentSessionId) {
        await deleteSession(currentSessionId);
    }
}

// 加载消息
async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        const data = await response.json();
        
        renderMessages(data.messages);
    } catch (error) {
        console.error('加载消息失败:', error);
    }
}

// 渲染消息
function renderMessages(messages) {
    const messagesContainer = document.getElementById('messages');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (messages.length === 0) {
        showWelcomeMessage();
        return;
    }
    
    welcomeMessage.style.display = 'none';
    
    messagesContainer.innerHTML = messages.map(message => {
        const isUser = message.role === 'user';
        const avatar = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        const imageHtml = message.image ? `
            <img src="data:image/jpeg;base64,${message.image}" 
                 alt="上传的图片" 
                 class="message-image"
                 onclick="showImageModal(this.src)">
        ` : '';
        
        return `
            <div class="message ${message.role}">
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    ${imageHtml}
                    <div class="message-text">${escapeHtml(message.content).replace(/\n/g, '<br>')}</div>
                    <div class="message-time">${formatTime(message.timestamp)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    scrollToBottom();
}

// 显示欢迎消息
function showWelcomeMessage() {
    const messagesContainer = document.getElementById('messages');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    messagesContainer.innerHTML = '';
    welcomeMessage.style.display = 'flex';
}

// 清空消息
function clearMessages() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '';
}

// 处理消息提交
async function handleMessageSubmit(event) {
    event.preventDefault();
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message && !selectedImage) return;
    
    if (selectedImage) {
        await sendImageMessage(message, selectedImage);
    } else {
        await sendTextMessage(message);
    }
    
    messageInput.value = '';
    adjustTextareaHeight(messageInput);
    removeImage();
}

// 发送文本消息（流式）
async function sendTextMessage(message) {
    try {
        // 立即显示用户消息
        addMessageToUI('user', message);
        showLoading(true);
        
        // 获取选择的模型
        const selectedModel = document.getElementById('modelSelect').value;
        
        // 创建AI消息容器
        const aiMessageElement = addStreamingMessageToUI('assistant');
        
        // 使用fetch进行流式接收
        const response = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message: message,
                model: selectedModel 
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.substring(6).trim();
                        if (jsonStr) {
                            const data = JSON.parse(jsonStr);
                            
                            switch(data.type) {
                                case 'start':
                                    // 流式开始
                                    break;
                                case 'chunk':
                                    // 接收到新的文本块
                                    aiResponse += data.content;
                                    updateStreamingMessage(aiMessageElement, aiResponse);
                                    break;
                                case 'end':
                                    // 流式结束
                                    finalizeStreamingMessage(aiMessageElement, aiResponse);
                                    await loadSessions(); // 刷新会话列表
                                    showLoading(false);
                                    return;
                                case 'error':
                                    // 出现错误
                                    throw new Error(data.error || '流式传输错误');
                            }
                        }
                    } catch (parseError) {
                        console.error('解析流式数据失败:', parseError);
                        // 继续处理其他行
                    }
                }
            }
        }
        
        // 如果到达这里说明流结束了但没有收到end信号
        finalizeStreamingMessage(aiMessageElement, aiResponse);
        showLoading(false);
        
    } catch (error) {
        console.error('发送消息失败:', error);
        showError('发送消息失败: ' + error.message);
        showLoading(false);
        
        // 如果出错，移除流式消息元素
        const streamingElement = document.querySelector('.message.streaming');
        if (streamingElement) {
            streamingElement.remove();
        }
    }
}

// 发送图片消息
async function sendImageMessage(message, imageFile) {
    try {
        // 立即显示用户消息（包含图片）
        const reader = new FileReader();
        reader.onload = function(e) {
            addMessageToUI('user', message || '请分析这张图片', e.target.result);
        };
        reader.readAsDataURL(imageFile);
        
        showLoading(true);
        
        // 获取选择的模型
        const selectedModel = document.getElementById('modelSelect').value;
        
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('message', message || '请分析这张图片');
        formData.append('model', selectedModel);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // 显示AI回复
            addMessageToUI('assistant', data.response);
            
            // 刷新会话列表（更新标题）
            await loadSessions();
        } else {
            throw new Error(data.error || '上传图片失败');
        }
    } catch (error) {
        console.error('发送图片消息失败:', error);
        showError('发送图片消息失败: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// 添加消息到UI
function addMessageToUI(role, content, imageSrc = null) {
    const messagesContainer = document.getElementById('messages');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    welcomeMessage.style.display = 'none';
    
    const isUser = role === 'user';
    const avatar = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    const imageHtml = imageSrc ? `
        <img src="${imageSrc}" 
             alt="上传的图片" 
             class="message-image"
             onclick="showImageModal(this.src)">
    ` : '';
    
    const messageHtml = `
        <div class="message ${role}">
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                ${imageHtml}
                <div class="message-text">${escapeHtml(content).replace(/\n/g, '<br>')}</div>
                <div class="message-time">${formatTime(new Date().toISOString())}</div>
            </div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
}

// 添加流式消息到UI（初始创建）
function addStreamingMessageToUI(role) {
    const messagesContainer = document.getElementById('messages');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    welcomeMessage.style.display = 'none';
    
    const isUser = role === 'user';
    const avatar = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const messageHtml = `
        <div class="message ${role} streaming">
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text streaming-text"></div>
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
                <div class="message-time">${formatTime(new Date().toISOString())}</div>
            </div>
        </div>
    `;
    
    messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
    const messageElement = messagesContainer.lastElementChild;
    scrollToBottom();
    
    return messageElement;
}

// 更新流式消息内容
function updateStreamingMessage(messageElement, content) {
    const textElement = messageElement.querySelector('.message-text');
    textElement.innerHTML = escapeHtml(content).replace(/\n/g, '<br>');
    scrollToBottom();
}

// 完成流式消息（移除流式指示器）
function finalizeStreamingMessage(messageElement, content) {
    const textElement = messageElement.querySelector('.message-text');
    const typingIndicator = messageElement.querySelector('.typing-indicator');
    
    textElement.innerHTML = escapeHtml(content).replace(/\n/g, '<br>');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    messageElement.classList.remove('streaming');
    scrollToBottom();
}

// 处理图片选择
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showError('不支持的图片格式，请上传 PNG、JPG、JPEG、GIF 或 WebP 格式的图片');
        return;
    }
    
    // 检查文件大小（16MB）
    if (file.size > 16 * 1024 * 1024) {
        showError('图片文件过大，请上传小于16MB的图片');
        return;
    }
    
    selectedImage = file;
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        const previewImage = document.getElementById('previewImage');
        
        previewImage.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// 移除选中的图片
function removeImage() {
    selectedImage = null;
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageInput').value = '';
}

// 显示图片模态框（简单实现）
function showImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 8px;
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', function() {
        document.body.removeChild(modal);
    });
}

// 处理键盘事件
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        document.getElementById('messageForm').dispatchEvent(new Event('submit'));
    }
}

// 自动调整文本框高度
function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// 切换侧边栏
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

// 滚动到底部
function scrollToBottom() {
    const chatContainer = document.getElementById('chatContainer');
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
}

// 显示/隐藏加载动画
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const sendBtn = document.getElementById('sendBtn');
    
    loadingOverlay.style.display = show ? 'flex' : 'none';
    sendBtn.disabled = show;
}

// 显示错误消息
function showError(message) {
    // 简单的错误提示实现
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 1001;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (document.body.contains(errorDiv)) {
            document.body.removeChild(errorDiv);
        }
    }, 5000);
}

// 显示成功消息
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10a37f;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 1001;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
        }
    }, 3000);
}

// 工具函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } else {
        return date.toLocaleDateString('zh-CN', { 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
