#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."

    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装，请先安装 pnpm"
        exit 1
    fi

    if [ ! -d "backend" ]; then
        log_error "backend 目录不存在"
        exit 1
    fi

    if [ ! -d "frontend" ]; then
        log_error "frontend 目录不存在"
        exit 1
    fi

    log_success "依赖检查完成"
}

# 清理函数
cleanup() {
    log_warning "正在停止服务..."
    # 杀死所有子进程
    jobs -p | xargs -r kill
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    cd backend

    # 检查并安装依赖
    if [ ! -d "node_modules" ]; then
        log_info "安装后端依赖..."
        if ! pnpm install; then
            log_error "后端依赖安装失败"
            exit 1
        fi
    fi

    log_info "构建后端..."
    if ! pnpm build; then
        log_error "后端构建失败"
        exit 1
    fi

    log_info "启动后端服务器..."
    pnpm start &
    BACKEND_PID=$!

    cd ..
    log_success "后端服务已启动 (PID: $BACKEND_PID)"
}

# 启动前端服务
start_frontend() {
    log_info "启动前端服务..."
    cd frontend

    # 检查并安装依赖
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        if ! pnpm install; then
            log_error "前端依赖安装失败"
            exit 1
        fi
    fi

    log_info "启动前端开发服务器..."
    pnpm dev &
    FRONTEND_PID=$!

    cd ..
    log_success "前端服务已启动 (PID: $FRONTEND_PID)"
}

# 主函数
main() {
    log_info "开始启动 Modian Insight 服务..."

    # 检查依赖
    check_dependencies

    # 启动服务
    start_backend
    sleep 2  # 等待后端启动
    start_frontend

    log_success "所有服务已启动完成！"
    log_info "按 Ctrl+C 停止所有服务"

    # 等待所有后台进程
    wait
}

# 运行主函数
main