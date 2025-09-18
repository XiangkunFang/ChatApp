# ChatApp - AI智能助手

一个基于Flask和LangChain的ChatGPT克隆应用，支持文本对话、图片分析和多会话管理。

## ✨ 功能特性

- 🤖 **智能对话**: 基于OpenAI GPT-4模型的智能对话
- 🖼️ **图片分析**: 支持上传图片并进行智能分析
- 💬 **多会话管理**: 创建、切换和删除多个对话会话
- 📱 **响应式设计**: 支持桌面端和移动端访问
- 🎨 **现代化UI**: 仿ChatGPT的简洁美观界面
- ⚡ **实时交互**: 流畅的用户体验和实时响应

## 📚 文档

查看完整的文档和指南：

- **[📖 文档中心](docs/)** - 包含所有配置、部署和使用指南
- **[🚀 快速开始](docs/DOCKER-QUICKSTART.md)** - Docker 快速部署指南  
- **[🛡️ 安全配置](docs/SECURITY-GUIDE.md)** - 安全保护和认证配置
- **[👥 多用户系统](docs/MULTI-USER-GUIDE.md)** - 多用户功能使用说明
- **[🌍 外部访问](docs/EXTERNAL-ACCESS-INFO.md)** - 公网访问配置指南

## 🛠️ 技术栈

### 后端
- **Flask**: Web框架
- **LangChain**: AI应用开发框架
- **OpenAI API**: GPT-4模型接入
- **Pillow**: 图片处理

### 前端
- **HTML5/CSS3**: 现代化界面设计
- **JavaScript (ES6+)**: 交互逻辑
- **Font Awesome**: 图标库

## 📦 安装和运行

### 方式一：Docker 部署（推荐）

#### 1. 克隆项目
```bash
git clone <repository-url>
cd ChatApp
```

#### 2. 配置环境变量
创建 `.env` 文件并添加以下配置：
```env
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=your_secret_key_here
```

#### 3. 使用一键部署脚本
```bash
./run-docker.sh
```

#### 或手动运行 Docker 命令
```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```

应用将在 `http://localhost:5000` 启动。

### 方式二：本地运行

#### 1. 克隆项目
```bash
git clone <repository-url>
cd ChatApp
```

#### 2. 安装依赖
```bash
pip install -r requirements.txt
```

#### 3. 配置环境变量
创建 `.env` 文件并添加以下配置：
```env
OPENAI_API_KEY=your_openai_api_key_here
SECRET_KEY=your_secret_key_here
```

#### 4. 运行应用
```bash
python app.py
```

应用将在 `http://localhost:5000` 启动。

## 🎯 使用说明

### 基本对话
1. 在输入框中输入您的问题
2. 按回车键或点击发送按钮
3. AI将为您提供智能回答

### 图片分析
1. 点击输入框左侧的图片图标
2. 选择要分析的图片文件
3. 可选择添加描述文字
4. 发送后AI将分析图片内容

### 会话管理
- **新建对话**: 点击左侧栏的"新对话"按钮
- **切换对话**: 点击左侧栏中的任一历史对话
- **删除对话**: 点击顶部的垃圾桶图标删除当前对话

## 📁 项目结构

```
ChatApp/
├── app.py                 # Flask主应用
├── config.py              # 配置文件
├── requirements.txt       # Python依赖
├── Dockerfile            # Docker镜像构建文件
├── docker-compose.yml    # Docker Compose配置
├── .dockerignore         # Docker忽略文件
├── run-docker.sh         # 一键Docker部署脚本
├── .env                  # 环境变量（需创建）
├── static/               # 静态文件
│   ├── css/
│   │   └── style.css     # 样式文件
│   ├── js/
│   │   └── app.js        # 前端JavaScript
│   └── uploads/          # 图片上传目录
├── templates/            # HTML模板
│   └── index.html        # 主页面
└── README.md             # 说明文档
```

## ⚙️ 配置说明

### 环境变量
- `OPENAI_API_KEY`: OpenAI API密钥（必需）
- `SECRET_KEY`: Flask会话密钥（可选，有默认值）

### 应用配置
- 最大上传文件大小: 16MB
- 支持的图片格式: PNG, JPG, JPEG, GIF, WebP
- 默认AI模型: GPT-4 Vision Preview

## 🚀 部署建议

### Docker 部署（推荐）

#### 优势
- 🐳 **环境一致性**: 避免"在我机器上能跑"的问题
- 📦 **简化部署**: 一键启动，无需手动配置环境
- 🔄 **容易扩展**: 可以轻松进行水平扩展
- 🛡️ **安全隔离**: 容器化部署提供更好的安全性

#### Docker管理命令
```bash
# 查看运行状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新代码后重新构建
docker-compose up --build -d
```

### 生产环境部署
1. 使用Docker Compose或Kubernetes进行容器编排
2. 配置反向代理（Nginx推荐）
3. 使用HTTPS加密传输
4. 配置防火墙和安全策略
5. 设置日志收集和监控

### 传统部署方式
使用WSGI服务器（如Gunicorn）：
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### 环境要求
- Docker 和 Docker Compose（推荐方式）
- 或 Python 3.8+（传统方式）
- 稳定的网络连接（访问OpenAI API）
- 足够的磁盘空间（存储上传的图片）

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目！

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ⚠️ 注意事项

1. **API费用**: 使用OpenAI API会产生费用，请合理控制使用
2. **数据安全**: 当前版本将会话数据存储在内存中，重启后会丢失
3. **生产环境**: 建议在生产环境中使用数据库存储会话数据
4. **图片隐私**: 上传的图片会发送到OpenAI进行分析，请注意隐私保护

## 📞 支持

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件到 [xf687@nyu.edu]

---

**享受与AI的智能对话体验！** 🎉
