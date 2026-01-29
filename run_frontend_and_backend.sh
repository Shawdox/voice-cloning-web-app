#!/bin/bash

BASE_DIR="/home/xiaowu/voice_web_app"
PID_FILE="$BASE_DIR/.run.pids"

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # 端口被占用
    else
        return 1  # 端口空闲
    fi
}

# 清理指定端口的进程
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "⚠️ 发现端口 $port 被占用，正在清理进程: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# 启动服务
start() {
    if [ -f "$PID_FILE" ]; then
        echo "⚠️ PID 文件已存在 ($PID_FILE)。服务可能正在运行。"
        echo "请先运行 '$0 stop' 停止服务。"
        exit 1
    fi

    # 检查并清理端口
    echo "🔍 检查端口占用情况..."
    if check_port 8080; then
        echo "⚠️ 端口 8080 被占用，正在清理..."
        kill_port 8080
    fi
    if check_port 3000; then
        echo "⚠️ 端口 3000 被占用，正在清理..."
        kill_port 3000
    fi
    if check_port 3001; then
        echo "⚠️ 端口 3000 被占用，正在清理..."
        kill_port 3001
    fi

    echo "🚀 正在启动 Backend (Go)..."
    cd "$BASE_DIR/backend"
    nohup go run main.go > "$BASE_DIR/backend.log" 2>&1 &
    echo $! >> "$PID_FILE"
    cd "$BASE_DIR"

    # 等待后端启动
    echo "⏳ 等待后端启动..."
    sleep 3

    # 检查后端是否启动成功
    if check_port 8080; then
        echo "✅ 后端启动成功 (http://localhost:8080)"
    else
        echo "❌ 后端启动失败，请查看 backend.log"
        tail -n 10 "$BASE_DIR/backend.log"
        rm -f "$PID_FILE"
        exit 1
    fi

    echo "🚀 正在启动 Frontend (Vite)..."
    cd "$BASE_DIR/voiceclone-pro-console"
    nohup npm run dev > "$BASE_DIR/frontend.log" 2>&1 &
    echo $! >> "$PID_FILE"
    cd "$BASE_DIR"

    # 等待前端启动
    echo "⏳ 等待前端启动..."
    sleep 3

    # 检查前端是否启动成功
    if check_port 3000; then
        echo "✅ 前端启动成功 (http://localhost:3000)"
    else
        echo "❌ 前端启动失败，请查看 frontend.log"
        tail -n 10 "$BASE_DIR/frontend.log"
    fi

    echo ""
    echo "✅ 服务已在后台启动。"
    echo "📋 日志文件: backend.log, frontend.log"
    echo "🌐 前端地址: http://localhost:3000"
    echo "🔌 后端地址: http://localhost:8080"
}

# 停止服务
stop() {
    echo "🛑 正在停止服务..."

    # 从 PID 文件停止进程
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            if [ -n "$pid" ]; then
                echo "   正在终止进程 PID: $pid"
                kill "$pid" 2>/dev/null || echo "   进程 $pid 未找到"
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    else
        echo "⚠️ 未找到 PID 文件，尝试通过端口清理进程..."
    fi

    # 额外清理：通过端口查找并清理进程
    echo "🧹 清理残留进程..."

    # 清理 Go 后端进程（通过端口和进程名）
    kill_port 8080

    # 清理 Vite 前端进程
    kill_port 3000

    # 清理可能的 go run 子进程
    local go_pids=$(ps aux | grep "go run main.go" | grep -v grep | awk '{print $2}')
    if [ -n "$go_pids" ]; then
        echo "   清理 go run 进程: $go_pids"
        echo "$go_pids" | xargs kill -9 2>/dev/null || true
    fi

    # 清理 main 可执行文件进程
    local main_pids=$(ps aux | grep "/tmp/go-build.*/exe/main" | grep -v grep | awk '{print $2}')
    if [ -n "$main_pids" ]; then
        echo "   清理 main 可执行文件进程: $main_pids"
        echo "$main_pids" | xargs kill -9 2>/dev/null || true
    fi

    echo "✅ 所有服务已停止。"
}

# 查看状态
status() {
    echo "📊 服务状态:"
    echo ""

    if check_port 8080; then
        echo "✅ 后端运行中 (端口 8080)"
        lsof -i:8080 | head -2
    else
        echo "❌ 后端未运行"
    fi

    echo ""

    if check_port 3000; then
        echo "✅ 前端运行中 (端口 3000)"
        lsof -i:3000 | head -2
    else
        echo "❌ 前端未运行"
    fi
}

# 处理命令行参数
case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 2
        start
        ;;
    status)
        status
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status}"
        echo ""
        echo "命令说明:"
        echo "  start   - 启动前后端服务"
        echo "  stop    - 停止前后端服务"
        echo "  restart - 重启前后端服务"
        echo "  status  - 查看服务状态"
        exit 1
        ;;
esac
