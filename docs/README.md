# 📚 ChatApp 文档中心

这里包含了 ChatApp 的所有指南和文档，帮助您更好地理解、配置和使用系统。

## 📋 文档目录

### 🚀 快速开始
- **[Docker 快速部署](DOCKER-QUICKSTART.md)** - 使用 Docker 快速部署 ChatApp 的完整指南

### 🔧 配置指南
- **[环境变量注入机制](ENV-INJECTION-MECHANISM.md)** - 详细了解环境变量的配置和管理
- **[环境变量流程说明](ENV-FLOW-EXPLANATION.md)** - 环境变量在系统中的工作流程

### 🌍 部署和访问
- **[外部访问信息](EXTERNAL-ACCESS-INFO.md)** - 配置和管理外部网络访问
- **[AWS 安全组修复](AWS-SECURITY-GROUP-FIX.md)** - AWS 云环境下的网络安全配置

### 🛡️ 安全和用户管理
- **[安全保护指南](SECURITY-GUIDE.md)** - 全面的安全配置和保护措施
- **[多用户系统指南](MULTI-USER-GUIDE.md)** - 多用户系统的配置和使用说明

## 🎯 快速导航

### 新用户入门
1. 先阅读 [Docker 快速部署](DOCKER-QUICKSTART.md)
2. 然后查看 [外部访问信息](EXTERNAL-ACCESS-INFO.md)
3. 配置安全保护：[安全保护指南](SECURITY-GUIDE.md)

### 高级配置
1. 环境变量管理：[环境变量注入机制](ENV-INJECTION-MECHANISM.md)
2. 多用户设置：[多用户系统指南](MULTI-USER-GUIDE.md)
3. 云环境部署：[AWS 安全组修复](AWS-SECURITY-GROUP-FIX.md)

## 📞 技术支持

如果您在使用过程中遇到问题：

1. **首先检查**相关文档是否有解决方案
2. **查看日志**：`docker-compose logs -f chatapp`
3. **验证配置**：检查 `.env` 文件和环境变量
4. **测试连接**：使用文档中提供的测试命令

## 🔄 文档更新

这些文档会随着 ChatApp 功能的更新而持续改进。建议您定期查看以获取最新信息。

---

**💡 提示：建议按照文档的推荐顺序阅读，这样可以更好地理解整个系统的架构和配置。**
