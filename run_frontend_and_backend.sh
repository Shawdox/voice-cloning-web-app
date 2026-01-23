BASE_DIR="/home/xiaowu/voice_web_app"

PID_FILE="$BASE_DIR/.run.pids"

# 启动服务
start() {
    if [ -f "$PID_FILE" ]; then
        echo "PID 文件已存在 ($PID_FILE)。服务可能正在运行。"
        echo "请先运行 '$0 stop' 停止服务。"
        exit 1
    fi

    echo "正在启动 Backend (Go)..."
    cd "$BASE_DIR/backend"
    nohup go run main.go > "$BASE_DIR/backend.log" 2>&1 &
    echo $! >> "$PID_FILE"
    cd "$BASE_DIR"

    echo "正在启动 Frontend (Vite)..."
    cd "$BASE_DIR/voiceclone-pro-console"
    nohup npm run dev > "$BASE_DIR/frontend.log" 2>&1 &
    echo $! >> "$PID_FILE"
    cd "$BASE_DIR"

    echo "✅ 服务已在后台启动。"
    echo "日志文件: backend.log, frontend.log"
}

# 停止服务
stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo "未找到 PID 文件。服务可能未运行。"
        #return
    fi

    echo "正在停止服务..."
    while read pid; do
        if [ -n "$pid" ]; then
            echo "正在终止进程 PID: $pid"
            kill "$pid" 2>/dev/null || echo "进程 $pid 未找到"
        fi
    done < "$PID_FILE"
    rm "$PID_FILE"
    # 额外清理 vite 进程，防止残留
        pids=$(ps aux | grep "/home/xiaowu/voice_web_app/voiceclone-pro-console/node_modules/.bin/vite" | grep -v grep | awk '{print $2}')
        if [ -n "$pids" ]; then
            echo "发现残留的 Vite 进程: $pids，正在停止..."
            for pid in $pids; do
                kill "$pid" 2>/dev/null || true
            done
        fi
    echo "✅ 所有服务已停止。"
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
    *)
        echo "用法: $0 {start|stop|restart}"
        echo "默认执行启动..."
        start
        ;;
esac