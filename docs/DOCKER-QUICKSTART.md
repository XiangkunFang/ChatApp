# 🚀 Docker 快速启动指南

## 前提条件

确保系统已安装：
- Docker
- Docker Compose

## 🏁 快速启动

### 1. 配置环境变量

创建 `.env` 文件：
```bash
# 方法1: 手动创建
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
echo "SECRET_KEY=your_secret_key_here" >> .env

# 方法2: 复制示例文件
cp env-example.txt .env
# 然后编辑 .env 文件，填入真实的API密钥
```

### 2. 使用一键脚本启动

```bash
./run-docker.sh
```

### 3. 或手动启动

```bash
# 构建并启动容器
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 🌐 访问应用

启动成功后，访问：
- **本地访问**: http://localhost:5000
- **容器内访问**: http://0.0.0.0:5000

## 🔧 管理命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f chatapp

# 进入容器
docker exec -it chatapp bash

# 更新代码后重新构建
docker-compose up --build -d

# 清理镜像和容器
docker-compose down --rmi all --volumes --remove-orphans
```

## 🐛 故障排除

### 容器无法启动
1. 检查 `.env` 文件是否存在且包含有效的 API 密钥
2. 查看容器日志：`docker-compose logs chatapp`
3. 检查端口5000是否被占用

### API 连接失败
1. 确认 OPENAI_API_KEY 正确无误
2. 检查网络连接
3. 验证API密钥权限

### 图片上传失败
1. 检查容器内 `/app/static/uploads` 目录权限
2. 确认图片格式支持（PNG, JPG, JPEG, GIF, WebP）
3. 检查文件大小不超过16MB

## 📋 环境变量说明

| 变量名 | 必需 | 描述 | 示例 |
|--------|------|------|------|
| `OPENAI_API_KEY` | ✅ | OpenAI API密钥 | `sk-...` |
| `SECRET_KEY` | ❌ | Flask会话密钥 | `your-secret-key` |

## 🔒 安全提醒

- **永远不要**将 `.env` 文件提交到版本控制系统
- 定期轮换 API 密钥和会话密钥  
- 在生产环境中使用强随机字符串作为 SECRET_KEY

---

**享受您的 ChatApp 体验！** 🎉
