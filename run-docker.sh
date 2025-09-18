#!/bin/bash

# ChatApp Docker 部署脚本

echo "🚀 ChatApp Docker 部署脚本"
echo "========================="

# 检查是否存在.env文件
if [ ! -f .env ]; then
    echo "❌ 错误: 找不到 .env 文件"
    echo "请先创建 .env 文件并配置您的 OpenAI API 密钥"
    echo ""
    echo "创建 .env 文件示例："
    echo "OPENAI_API_KEY=your_openai_api_key_here"
    echo "SECRET_KEY=your_secret_key_here"
    exit 1
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 构建并启动容器
echo "📦 构建 Docker 镜像..."
docker-compose build

if [ $? -eq 0 ]; then
    echo "✅ Docker 镜像构建成功"
else
    echo "❌ Docker 镜像构建失败"
    exit 1
fi

echo ""
echo "🚀 启动 ChatApp 容器..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo "✅ ChatApp 容器启动成功"
    echo ""
    echo "🎉 部署完成！"
    echo ""
    echo "📝 访问信息："
    echo "   本地访问: http://localhost:5000"
    echo "   容器名称: chatapp"
    echo ""
    echo "🔧 管理命令："
    echo "   查看日志: docker-compose logs -f"
    echo "   停止服务: docker-compose down"
    echo "   重启服务: docker-compose restart"
    echo "   查看状态: docker-compose ps"
else
    echo "❌ ChatApp 容器启动失败"
    exit 1
fi
