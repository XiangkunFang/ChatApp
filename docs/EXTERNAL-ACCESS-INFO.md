# 🌍 ChatApp 外部访问信息

## 📍 访问地址

### 🔗 主要访问方式
```
公网访问: http://3.145.182.149:5000
内网访问: http://172.31.29.117:5000
本地访问: http://localhost:5000
```

## 🧪 外部测试方法

### 方法1: 浏览器访问
直接在浏览器中打开:
- **http://3.145.182.149:5000**

### 方法2: curl 命令测试
```bash
# 测试服务可达性
curl -I http://3.145.182.149:5000

# 获取页面内容
curl http://3.145.182.149:5000

# 测试API接口
curl -X GET http://3.145.182.149:5000/api/sessions
```

### 方法3: 使用其他工具
- **Postman**: 创建 GET 请求到 http://3.145.182.149:5000
- **wget**: `wget http://3.145.182.149:5000 -O test.html`
- **HTTPie**: `http GET http://3.145.182.149:5000`

## 🛡️ 安全注意事项

### ⚠️ 当前配置
- 端口5000暴露到公网 (0.0.0.0:5000)
- 使用测试API密钥 (不是真实的OpenAI密钥)
- HTTP协议 (非HTTPS)

### 🔒 生产环境建议
1. **使用HTTPS**: 配置SSL证书
2. **防火墙**: 限制访问源IP
3. **反向代理**: 使用Nginx/Apache
4. **真实API密钥**: 替换测试密钥

## 📊 端口和网络信息

| 项目 | 值 |
|-----|---|
| 容器内端口 | 5000 |
| 宿主机端口 | 5000 |
| 绑定IP | 0.0.0.0 (所有接口) |
| 协议 | HTTP |
| 容器网络 | chatapp_chatapp-network |

## 🔧 管理命令

```bash
# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down
```

## 🐛 故障排除

### 连接失败可能原因
1. **防火墙阻挡**: 检查服务器防火墙设置
2. **端口未开放**: 确认云服务商安全组规则
3. **服务未运行**: 检查 `docker-compose ps`
4. **网络问题**: 测试服务器网络连通性

### 调试命令
```bash
# 检查端口监听
ss -tlnp | grep :5000

# 测试本地访问
curl http://localhost:5000

# 检查容器日志
docker logs chatapp
```

---

**🎉 现在您可以从任何地方访问您的ChatApp了！**
