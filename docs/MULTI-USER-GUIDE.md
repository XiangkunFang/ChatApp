# 👥 ChatApp 多用户系统使用指南

ChatApp 现已支持多用户系统，每个用户拥有独立的账户和聊天记录，互不干扰。

## 🚀 功能特性

### ✨ 核心功能
- **多用户认证**: 支持多个用户独立登录
- **数据隔离**: 每个用户只能看到自己的聊天记录
- **会话管理**: 用户可以创建、切换、删除自己的对话
- **安全保护**: 完善的认证和权限控制

### 🎯 新增功能
- **删除按钮**: 每个会话都有独立的删除按钮
- **实时反馈**: 成功/错误提示消息
- **用户隔离**: 不同用户的数据完全分离

## ⚙️ 配置方法

### 1. 环境变量配置

在 `.env` 文件中添加以下配置：

```bash
# 多用户系统开关
ENABLE_MULTI_USER=true

# 用户账户配置（格式：用户名:密码,用户名:密码）
USERS_CONFIG=alice:alice123,bob:bob456,carol:carol789

# 管理员账户（向后兼容）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=mySecurePassword2024!
```

### 2. 用户配置格式

用户配置使用逗号分隔多个用户，每个用户格式为 `用户名:密码`：

```bash
USERS_CONFIG=user1:pass1,user2:pass2,user3:pass3
```

**示例配置：**
```bash
USERS_CONFIG=alice:alice123,bob:bob456,carol:carol789,team:team2024!
```

### 3. 完整配置示例

```bash
# OpenAI 配置
OPENAI_API_KEY=sk-your-openai-api-key-here
SECRET_KEY=your-random-secret-key

# 安全认证
ENABLE_AUTH=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminPassword123!

# 多用户系统
ENABLE_MULTI_USER=true
USERS_CONFIG=alice:secure123,bob:password456,carol:mypass789

# 安全功能
ENABLE_RATE_LIMIT=true
RATE_LIMIT_REQUESTS=15
RATE_LIMIT_WINDOW=60
```

## 👨‍💼 用户管理

### 添加新用户

1. **编辑环境变量**：
   ```bash
   # 在现有用户后添加新用户
   USERS_CONFIG=existing_users,newuser:newpassword
   ```

2. **重启服务**：
   ```bash
   docker-compose restart
   ```

### 删除用户

1. **从配置中移除**：
   ```bash
   # 从 USERS_CONFIG 中删除对应用户
   USERS_CONFIG=remaining_user1:pass1,remaining_user2:pass2
   ```

2. **重启服务**：
   ```bash
   docker-compose restart
   ```

**注意：删除用户配置后，该用户的聊天记录仍会保留，但无法再访问。**

### 修改密码

1. **更新配置**：
   ```bash
   # 修改对应用户的密码
   USERS_CONFIG=alice:new_password,bob:bob456,carol:carol789
   ```

2. **重启服务**应用更改

## 🔒 安全特性

### 数据隔离
- 每个用户只能访问自己的聊天会话
- 用户无法查看或操作其他用户的数据
- 会话ID在不同用户间是独立的

### 认证保护
- 所有 API 端点都需要有效认证
- 支持 HTTP Basic Authentication
- 密码在服务端进行验证

### 权限控制
- 用户只能：
  - 查看自己的会话列表
  - 创建自己的新会话
  - 删除自己的会话
  - 切换到自己的会话

## 🎮 用户界面功能

### 会话管理
- **查看会话**: 左侧栏显示用户的所有聊天记录
- **创建新对话**: 点击"新对话"按钮
- **切换对话**: 点击任意会话项切换
- **删除对话**: 鼠标悬停会话项，点击删除按钮 🗑️

### 删除按钮特性
- **悬停显示**: 鼠标悬停时才显示删除按钮
- **确认提示**: 删除前会弹出确认对话框
- **智能处理**: 删除当前会话会自动创建新会话
- **视觉反馈**: 删除成功会显示提示消息

### 用户体验
- **实时更新**: 会话列表实时更新
- **状态提示**: 成功/错误消息提示
- **响应式**: 支持不同屏幕尺寸

## 🚀 部署和使用

### 1. 更新配置文件

编辑 `.env` 文件添加用户配置：
```bash
echo "ENABLE_MULTI_USER=true" >> .env
echo "USERS_CONFIG=alice:alice123,bob:bob456" >> .env
```

### 2. 重新部署

```bash
# 重新构建和启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 3. 测试访问

不同用户使用各自的用户名和密码登录：

**用户 Alice:**
- 用户名: `alice`
- 密码: `alice123`

**用户 Bob:**
- 用户名: `bob`  
- 密码: `bob456`

## 📊 监控和维护

### 查看用户活动

```bash
# 查看应用日志
docker-compose logs -f chatapp

# 日志会显示用户访问信息
[2024-01-01T12:00:00] IP: 192.168.1.100 | User: alice | Endpoint: chat | Status: success
```

### 安全状态检查

访问安全状态 API（需要认证）：
```bash
curl -u alice:alice123 http://your-domain:5000/api/security/status
```

### 备份用户数据

虽然当前使用内存存储，建议在生产环境中：
1. 使用持久化存储（如数据库）
2. 定期备份用户数据
3. 实现数据导出功能

## 🔧 高级配置

### 禁用多用户模式

如果需要回到单用户模式：
```bash
ENABLE_MULTI_USER=false
ENABLE_AUTH=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
```

### 混合模式

可以同时使用管理员账户和多用户：
```bash
ENABLE_MULTI_USER=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin_password
USERS_CONFIG=user1:pass1,user2:pass2
```

## 🛠️ 故障排除

### 常见问题

1. **用户无法登录**
   - 检查用户名和密码是否正确
   - 确认 USERS_CONFIG 格式正确
   - 重启服务应用配置

2. **看不到聊天记录**
   - 确认用户使用正确账户登录
   - 检查是否误删了会话数据

3. **删除按钮不显示**
   - 确认鼠标悬停在会话项上
   - 检查 CSS 样式是否正确加载

### 调试方法

```bash
# 检查容器状态
docker-compose ps

# 查看详细日志
docker-compose logs chatapp

# 测试 API 连接
curl -u username:password http://localhost:5000/api/sessions
```

## 📋 最佳实践

### 密码安全
- 使用复杂密码（至少8位）
- 包含字母、数字、特殊字符
- 定期更换密码

### 用户管理
- 使用有意义的用户名
- 为不同项目/团队创建不同用户
- 定期审查用户权限

### 数据安全
- 定期备份聊天数据
- 监控异常访问行为
- 考虑使用HTTPS加密传输

---

**🎉 现在您的 ChatApp 支持多用户了！每个用户都可以拥有独立、安全的聊天体验。**
