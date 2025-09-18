#!/bin/bash
# AWS安全组一键修复脚本

echo "🔧 AWS安全组一键修复脚本"
echo "=========================="

# 检查AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI未安装，请使用控制台方法"
    exit 1
fi

# 获取实例ID
INSTANCE_ID=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "")

if [ -z "$INSTANCE_ID" ]; then
    echo "❌ 无法获取实例ID，请手动指定:"
    echo "   export INSTANCE_ID=i-xxxxxxxxx"
    echo "   ./fix-security-group.sh"
    exit 1
fi

echo "📍 实例ID: $INSTANCE_ID"

# 获取安全组ID
echo "🔍 获取安全组信息..."
SG_ID=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' \
    --output text 2>/dev/null)

if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
    echo "❌ 无法获取安全组ID，请检查AWS CLI配置"
    exit 1
fi

echo "🛡️ 安全组ID: $SG_ID"

# 检查5000端口规则是否已存在
echo "🔍 检查现有规则..."
EXISTING_RULE=$(aws ec2 describe-security-groups --group-ids $SG_ID \
    --query "SecurityGroups[0].IpPermissions[?FromPort==\`5000\` && ToPort==\`5000\`]" \
    --output text 2>/dev/null)

if [ -n "$EXISTING_RULE" ] && [ "$EXISTING_RULE" != "None" ]; then
    echo "✅ 端口5000规则已存在"
else
    echo "➕ 添加端口5000入站规则..."
    aws ec2 authorize-security-group-ingress \
        --group-id $SG_ID \
        --protocol tcp \
        --port 5000 \
        --cidr 0.0.0.0/0 \
        --output table

    if [ $? -eq 0 ]; then
        echo "✅ 安全组规则添加成功！"
        echo "⏰ 请等待1-2分钟规则生效"
        echo "🌐 然后访问: http://$(curl -s ifconfig.me):5000"
    else
        echo "❌ 添加规则失败，请检查权限"
        exit 1
    fi
fi

echo ""
echo "🧪 测试连接性:"
echo "   curl -I http://$(curl -s ifconfig.me):5000"
