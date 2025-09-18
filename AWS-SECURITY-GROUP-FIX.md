# 🛡️ AWS EC2安全组配置指南

## 🔍 问题诊断

### ✅ 当前服务状态
- **容器运行**: ✅ ChatApp容器正在运行
- **端口监听**: ✅ 5000端口已监听 (0.0.0.0:5000)  
- **本地访问**: ✅ localhost:5000 正常响应
- **外部访问**: ❌ 外部无法访问

### 🎯 问题原因
**AWS EC2安全组没有开放5000端口的入站规则**

---

## 🚀 解决方案：配置EC2安全组

### 方法1: 通过AWS控制台配置（推荐）

#### 步骤1: 登录AWS控制台
1. 访问 [AWS EC2控制台](https://console.aws.amazon.com/ec2/)
2. 在左侧菜单选择 **"Security Groups"**

#### 步骤2: 找到您的安全组
1. 找到与您的EC2实例关联的安全组
2. 点击安全组ID进入详情页

#### 步骤3: 添加入站规则
1. 点击 **"Inbound rules"** 标签
2. 点击 **"Edit inbound rules"** 按钮
3. 点击 **"Add rule"** 添加新规则

#### 步骤4: 配置5000端口规则
```
Type: Custom TCP Rule
Protocol: TCP
Port Range: 5000
Source: 0.0.0.0/0  (允许所有IP访问，测试用)
Description: ChatApp Web Service
```

#### 步骤5: 保存规则
1. 点击 **"Save rules"** 保存配置
2. 等待1-2分钟生效

### 方法2: 通过AWS CLI配置

```bash
# 获取安全组ID (替换instance-id)
aws ec2 describe-instances --instance-ids YOUR-INSTANCE-ID \
  --query 'Reservations[].Instances[].SecurityGroups[].GroupId' --output text

# 添加5000端口入站规则 (替换sg-xxxxxxxx)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 5000 \
  --cidr 0.0.0.0/0
```

---

## 🔒 安全配置建议

### ⚠️ 测试阶段配置
```
Source: 0.0.0.0/0 (允许所有IP，仅供测试)
```

### 🛡️ 生产环境配置
```bash
# 仅允许特定IP访问
Source: YOUR-IP-ADDRESS/32

# 或允许特定IP段
Source: 192.168.1.0/24

# 或仅允许公司网络
Source: COMPANY-IP-RANGE/24
```

---

## 🧪 验证配置是否生效

### 立即测试
```bash
# 从外部测试连接性
curl -I http://YOUR-EC2-PUBLIC-IP:5000

# 或使用telnet测试端口
telnet YOUR-EC2-PUBLIC-IP 5000
```

### 浏览器访问
```
http://YOUR-EC2-PUBLIC-IP:5000
```

---

## 📋 常见安全组配置模板

### ChatApp完整配置
| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | Your-IP/32 | SSH访问 |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP访问 |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS访问 |
| Custom TCP | TCP | 5000 | 0.0.0.0/0 | ChatApp服务 |

### 最小安全配置
| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | Your-IP/32 | 管理访问 |
| Custom TCP | TCP | 5000 | Your-IP/32 | ChatApp访问 |

---

## 🐛 故障排除

### 配置后仍无法访问？

#### 检查1: 防火墙设置
```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 5000

# CentOS/RHEL
sudo firewall-cmd --list-ports
sudo firewall-cmd --add-port=5000/tcp --permanent
sudo firewall-cmd --reload
```

#### 检查2: 服务状态
```bash
# 确认容器运行状态
docker-compose ps

# 检查应用日志
docker-compose logs chatapp

# 确认端口监听
ss -tlnp | grep :5000
```

#### 检查3: 网络连通性
```bash
# 从EC2内部测试
curl -I http://localhost:5000

# 测试端口连通性
nc -zv localhost 5000
```

---

## ⚡ 快速解决命令

如果您有AWS CLI配置，可以使用以下命令快速开放端口：

```bash
# 获取实例安全组
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
SG_ID=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID \
  --query 'Reservations[].Instances[].SecurityGroups[0].GroupId' --output text)

# 开放5000端口
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5000 \
  --cidr 0.0.0.0/0

echo "已开放端口5000，请等待1-2分钟生效"
```

---

**🎯 配置完成后，您就可以通过 `http://YOUR-EC2-PUBLIC-IP:5000` 访问ChatApp了！**
