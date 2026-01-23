#!/bin/bash

# 语音克隆系统环境检查脚本

echo "================================"
echo "   环境依赖检查"
echo "================================"
echo ""

# 检查函数
check_command() {
    if command -v $1 &> /dev/null; then
        echo "✅ $2 已安装: $($1 --version 2>&1 | head -n 1)"
        return 0
    else
        echo "❌ $2 未安装"
        return 1
    fi
}

check_service() {
    if systemctl is-active --quiet $1 2>/dev/null || service $1 status &>/dev/null; then
        echo "✅ $2 服务正在运行"
        return 0
    else
        echo "⚠️  $2 服务未运行"
        return 1
    fi
}

# 检查必需工具
echo "📦 检查必需工具..."
echo "---"

check_command go "Go语言"
GO_INSTALLED=$?

check_command psql "PostgreSQL"
PSQL_INSTALLED=$?

check_command redis-cli "Redis"
REDIS_INSTALLED=$?

check_command node "Node.js"
NODE_INSTALLED=$?

check_command npm "NPM"
NPM_INSTALLED=$?

echo ""
echo "🔧 检查服务状态..."
echo "---"

if [ $PSQL_INSTALLED -eq 0 ]; then
    check_service postgresql "PostgreSQL"
fi

if [ $REDIS_INSTALLED -eq 0 ]; then
    check_service redis-server "Redis"
fi

echo ""
echo "📁 检查项目文件..."
echo "---"

if [ -f "backend/go.mod" ]; then
    echo "✅ backend/go.mod 存在"
else
    echo "❌ backend/go.mod 不存在"
fi

if [ -f "backend/main.go" ]; then
    echo "✅ backend/main.go 存在"
else
    echo "❌ backend/main.go 不存在"
fi

if [ -f "backend/.env" ]; then
    echo "✅ backend/.env 存在"
else
    echo "⚠️  backend/.env 不存在（请复制.env.example）"
fi

echo ""
echo "🔍 检查数据库连接..."
echo "---"

if [ $PSQL_INSTALLED -eq 0 ]; then
    if psql -U postgres -d voice_clone_db -c '\q' 2>/dev/null; then
        echo "✅ 数据库 voice_clone_db 可连接"
    else
        echo "⚠️  数据库 voice_clone_db 不存在或无法连接"
        echo "   创建命令: sudo -u postgres createdb voice_clone_db"
    fi
fi

if [ $REDIS_INSTALLED -eq 0 ]; then
    if redis-cli ping &>/dev/null; then
        echo "✅ Redis 可连接"
    else
        echo "⚠️  Redis 无法连接"
    fi
fi

echo ""
echo "================================"
echo "   检查结果总结"
echo "================================"
echo ""

if [ $GO_INSTALLED -eq 0 ] && [ $PSQL_INSTALLED -eq 0 ] && [ $REDIS_INSTALLED -eq 0 ]; then
    echo "🎉 所有必需组件已安装！"
    echo ""
    echo "下一步："
    echo "  1. cd backend"
    echo "  2. go mod download"
    echo "  3. go run main.go"
else
    echo "⚠️  请先安装缺失的组件"
    echo ""
    echo "安装指南："

    if [ $GO_INSTALLED -ne 0 ]; then
        echo "  Go语言: sudo apt install golang-go"
    fi

    if [ $PSQL_INSTALLED -ne 0 ]; then
        echo "  PostgreSQL: sudo apt install postgresql postgresql-contrib"
    fi

    if [ $REDIS_INSTALLED -ne 0 ]; then
        echo "  Redis: sudo apt install redis-server"
    fi

    if [ $NODE_INSTALLED -ne 0 ]; then
        echo "  Node.js: sudo apt install nodejs npm"
    fi

    echo ""
    echo "详细步骤请查看: SETUP_GUIDE.md"
fi

echo ""
