# Modian Insight

## 项目结构

```
modian-insight/
├── backend/          # 后端服务 (Node.js + TypeScript) - Git Submodule
├── frontend/         # 前端应用 (Vue.js + TypeScript) - Git Submodule
├── example/          # 示例代码
└── run.sh           # 服务启动脚本
```

## 克隆项目

⚠️ **重要**: 本项目使用 Git Submodules，请使用以下命令正确克隆：

```bash
# 推荐方式：克隆时同时初始化所有子模块
git clone --recurse-submodules https://github.com/NaHCO3-code/modian-insight.git
cd modian-insight
```

或者：

```bash
# 先克隆主项目，再初始化子模块
git clone https://github.com/NaHCO3-code/modian-insight.git
cd modian-insight
git submodule update --init --recursive
```

## 项目维护者设置指南

如果您是项目维护者，需要设置子模块仓库，请按以下步骤操作：

### 1. 创建独立的 GitHub 仓库

在 GitHub 上创建以下两个仓库：
- `modian-insight-backend`
- `modian-insight-frontend`

### 2. 推送 backend 代码到独立仓库

```bash
# 进入 backend 目录
cd backend

# 初始化 git 仓库
git init
git add .
git commit -m "Initial backend commit"

# 添加远程仓库并推送
git remote add origin https://github.com/NaHCO3-code/modian-insight-backend.git
git branch -M main
git push -u origin main

cd ..
```

### 3. 推送 frontend 代码到独立仓库

```bash
# 进入 frontend 目录
cd frontend

# 初始化 git 仓库
git init
git add .
git commit -m "Initial frontend commit"

# 添加远程仓库并推送
git remote add origin https://github.com/NaHCO3-code/modian-insight-frontend.git
git branch -M main
git push -u origin main

cd ..
```

### 4. 在主项目中设置子模块

```bash
# 删除现有的 backend 和 frontend 目录
rm -rf backend frontend

# 添加子模块
git submodule add https://github.com/NaHCO3-code/modian-insight-backend.git backend
git submodule add https://github.com/NaHCO3-code/modian-insight-frontend.git frontend

# 提交子模块配置
git add .gitmodules backend frontend
git commit -m "Add backend and frontend as submodules"
git push
```

## 安装依赖

### 前置要求

- Node.js (推荐 v18+)
- pnpm (推荐使用 pnpm 作为包管理器)

### 安装 pnpm

```bash
npm install -g pnpm
```

### 安装项目依赖

```bash
# 安装后端依赖
cd backend
pnpm install

# 安装前端依赖
cd ../frontend
pnpm install
cd ..
```

## 启动服务

### 使用启动脚本（推荐）

```bash
chmod +x run.sh
./run.sh
```

### 手动启动

#### 启动后端

```bash
cd backend
pnpm build
pnpm start
```

#### 启动前端

```bash
cd frontend
pnpm dev
```

## 开发说明

- 后端服务默认运行在端口 3000
- 前端开发服务器默认运行在端口 5173
- 后端 API 文档请查看 `backend/API.md`

## Git Submodules 管理

### 更新子模块

```bash
# 更新所有子模块到最新版本
git submodule update --remote

# 更新特定子模块
git submodule update --remote backend
git submodule update --remote frontend
```

### 在子模块中工作

```bash
# 进入子模块目录
cd backend  # 或 frontend

# 切换到开发分支
git checkout main

# 进行修改并提交
git add .
git commit -m "Your changes"
git push

# 回到主项目并更新子模块引用
cd ..
git add backend  # 或 frontend
git commit -m "Update backend submodule"
git push
```

## 故障排除

### 子模块相关问题

1. **子模块目录为空**: 运行 `git submodule update --init --recursive`
2. **子模块版本不匹配**: 运行 `git submodule update --remote`
3. **子模块修改冲突**: 进入子模块目录解决冲突后重新提交

### 依赖安装失败

1. 确保 Node.js 版本 >= 16
2. 清除缓存：`pnpm store prune`
3. 删除 node_modules 重新安装：`rm -rf node_modules && pnpm install`

### 服务启动失败

1. 检查端口是否被占用
2. 确保所有依赖都已正确安装
3. 查看错误日志进行调试

## 贡献

欢迎提交 Issue 和 Pull Request！

在提交 Pull Request 时，请确保：
1. 子模块的更改已正确提交到对应的仓库
2. 主项目中的子模块引用已更新到正确的提交
