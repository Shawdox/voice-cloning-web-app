#!/bin/bash

# API测试脚本
# 用法: ./test_api.sh

BASE_URL="http://localhost:8080/api/v1"
TOKEN=""

echo "================================"
echo "   语音克隆系统 API 测试"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local auth="$5"

    echo -e "\n📝 测试: ${name}"
    echo "---"

    if [ "$auth" == "true" ]; then
        if [ -z "$TOKEN" ]; then
            echo -e "${RED}❌ 需要先登录获取Token${NC}"
            return 1
        fi
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Authorization: Bearer $TOKEN" \
                "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "$data" \
                "$BASE_URL$endpoint")
        fi
    else
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$BASE_URL$endpoint")
        fi
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
        echo -e "${GREEN}✅ 成功 (HTTP $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ 失败 (HTTP $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
}

# 检查服务是否运行
echo "🔍 检查服务状态..."
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${RED}❌ 后端服务未运行${NC}"
    echo "请先启动后端: cd backend && go run main.go"
    exit 1
fi

echo -e "${GREEN}✅ 后端服务正在运行${NC}"

# 1. 健康检查
test_api "健康检查" "GET" "/health" "" "false"

# 2. 用户注册
echo ""
read -p "是否测试用户注册? (y/n): " test_register
if [ "$test_register" == "y" ]; then
    read -p "请输入邮箱: " email
    read -p "请输入密码: " password
    read -p "请输入昵称: " nickname

    register_data="{\"email\":\"$email\",\"password\":\"$password\",\"nickname\":\"$nickname\"}"
    test_api "用户注册" "POST" "/auth/register" "$register_data" "false"

    # 提取token
    TOKEN=$(echo "$body" | jq -r '.token' 2>/dev/null)
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo -e "${GREEN}Token已保存${NC}"
    fi
fi

# 3. 用户登录
echo ""
read -p "是否测试用户登录? (y/n): " test_login
if [ "$test_login" == "y" ]; then
    read -p "请输入邮箱或手机号: " login_id
    read -p "请输入密码: " password

    login_data="{\"login_id\":\"$login_id\",\"password\":\"$password\"}"
    test_api "用户登录" "POST" "/auth/login" "$login_data" "false"

    # 提取token
    TOKEN=$(echo "$body" | jq -r '.token' 2>/dev/null)
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo -e "${GREEN}Token已保存${NC}"
    fi
fi

# 如果没有token，退出
if [ -z "$TOKEN" ]; then
    echo ""
    echo -e "${RED}未获取到Token，无法测试需要认证的API${NC}"
    echo "请先注册或登录"
    exit 1
fi

# 4. 获取个人信息
test_api "获取个人信息" "GET" "/profile" "" "true"

# 5. 查询积分余额
test_api "查询积分余额" "GET" "/credits/balance" "" "true"

# 6. 获取积分交易记录
test_api "积分交易记录" "GET" "/credits/transactions?page=1&page_size=5" "" "true"

# 7. 获取音色列表
test_api "获取音色列表" "GET" "/voices?page=1&page_size=5" "" "true"

# 8. 获取TTS任务列表
test_api "获取TTS任务列表" "GET" "/tts?page=1&page_size=5" "" "true"

echo ""
echo "================================"
echo "   测试完成"
echo "================================"
echo ""
echo "Token: $TOKEN"
echo ""
echo "提示："
echo "  - 文件上传需要使用 multipart/form-data"
echo "  - 创建音色需要先上传音频文件"
echo "  - 生成语音需要先创建音色"
echo ""
