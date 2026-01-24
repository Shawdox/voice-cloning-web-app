#!/bin/bash
# 实时音色状态更新测试运行脚本
# Real-time Voice Cloning Status Update Test Runner

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}  🎯 实时音色状态更新测试${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 检查音频文件
AUDIO_FILE="/home/xiaowu/voice_web_app/data/audio/1229.MP3"
if [ ! -f "$AUDIO_FILE" ]; then
    echo -e "${RED}❌ 错误: 音频文件不存在: $AUDIO_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 音频文件存在${NC}"

# 检查前端服务
echo -e "\n${YELLOW}🔍 检查前端服务...${NC}"
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ 前端服务运行中 (http://localhost:3000)${NC}"
else
    echo -e "${RED}❌ 前端服务未运行${NC}"
    echo -e "${YELLOW}请先启动前端服务: ./run_frontend_and_backend.sh${NC}"
    exit 1
fi

# 检查后端服务
echo -e "\n${YELLOW}🔍 检查后端服务...${NC}"
if curl -s http://localhost:8080/api/v1/health > /dev/null 2>&1 || curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务运行中 (http://localhost:8080)${NC}"
else
    echo -e "${RED}❌ 后端服务未运行${NC}"
    echo -e "${YELLOW}请先启动后端服务: ./run_frontend_and_backend.sh${NC}"
    exit 1
fi

# 检查 Python 依赖
echo -e "\n${YELLOW}🔍 检查 Python 依赖...${NC}"
if ! python3 -c "import playwright" 2>/dev/null; then
    echo -e "${RED}❌ Playwright 未安装${NC}"
    echo -e "${YELLOW}正在安装依赖...${NC}"
    pip install -r requirements.txt
    playwright install chromium
fi
echo -e "${GREEN}✅ Python 依赖已安装${NC}"

# 创建截图目录
SCREENSHOT_DIR="/tmp/voice_status_realtime_screenshots"
mkdir -p "$SCREENSHOT_DIR"
echo -e "${GREEN}✅ 截图目录: $SCREENSHOT_DIR${NC}"

# 运行测试
echo -e "\n${BLUE}======================================================================${NC}"
echo -e "${BLUE}  🚀 开始运行测试${NC}"
echo -e "${BLUE}======================================================================${NC}\n"

cd "$(dirname "$0")"

# 根据参数选择运行方式
if [ "$1" == "--pytest" ]; then
    # 使用 pytest 运行
    pytest test_voice_clone_status_realtime.py -v -s
elif [ "$1" == "--html" ]; then
    # 生成 HTML 报告
    mkdir -p reports
    pytest test_voice_clone_status_realtime.py -v -s --html=reports/realtime_status_report.html --self-contained-html
    echo -e "\n${GREEN}📊 HTML 报告已生成: reports/realtime_status_report.html${NC}"
else
    # 直接运行 Python 脚本
    python3 test_voice_clone_status_realtime.py
fi

# 显示截图位置
echo -e "\n${GREEN}📸 测试截图保存在: $SCREENSHOT_DIR${NC}"
echo -e "${YELLOW}💡 提示: 使用 'ls -lh $SCREENSHOT_DIR' 查看所有截图${NC}"
