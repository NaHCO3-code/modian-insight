# Modian Insight

一个基于 TypeScript + Express 的众筹项目数据爬取和管理系统。

## 🚀 功能特性

- **智能爬取**: 支持批量爬取众筹项目数据，可指定ID范围或具体ID列表
- **数据去重**: 智能对比项目数据变化，只有显著变化时才保存新版本
- **版本控制**: 完整的项目数据版本历史记录，支持数据对比和趋势分析
- **灵活存储**: 按项目ID分层存储，避免单目录文件过多，支持多目录索引
- **RESTful API**: 完整的API接口，支持系统监控、爬虫控制和数据查询
- **实时监控**: 系统状态监控、任务进度跟踪和详细统计信息
- **规范代码**: TypeScript严格类型检查，规范的代码结构和详细注释

## 📋 技术栈

- **后端框架**: Express.js 4.18.2
- **开发语言**: TypeScript 5.8.3
- **包管理器**: pnpm
- **数据存储**: JSON文件存储 + 索引系统
- **认证机制**: MD5签名认证
- **代码规范**: ESLint + Prettier

## 🛠️ 安装和运行

### 环境要求

- Node.js >= 16.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
cd backend
pnpm install
```

### 开发模式运行

```bash
pnpm dev
```

### 生产模式运行

```bash
pnpm build
pnpm start
```

### 运行测试

```bash
pnpm exec ts-node src/tests/basic.test.ts
```

## 📁 项目结构

```
backend/
├── src/
│   ├── config/           # 配置文件
│   │   └── index.ts      # 应用配置
│   ├── controllers/      # 控制器
│   │   ├── systemController.ts    # 系统管理
│   │   ├── crawlerController.ts   # 爬虫控制
│   │   └── projectController.ts   # 项目数据
│   ├── services/         # 服务层
│   │   ├── authService.ts         # 认证服务
│   │   ├── crawlerService.ts      # 爬虫服务
│   │   └── storageService.ts      # 存储服务
│   ├── types/            # 类型定义
│   │   ├── api.ts        # API类型
│   │   └── modian.ts     # 数据类型
│   ├── utils/            # 工具函数
│   │   ├── crypto.ts     # 加密工具
│   │   └── dataTransform.ts      # 数据转换
│   ├── routes/           # 路由配置
│   │   └── index.ts      # 主路由
│   ├── tests/            # 测试文件
│   │   └── basic.test.ts # 基础功能测试
│   └── index.ts          # 应用入口
├── data/                 # 数据存储目录
│   ├── index.json        # 项目索引
│   └── projects/         # 项目数据
│       └── xx/xx/xx/     # 分层目录结构
├── API.md               # API文档
├── README.md            # 项目说明
├── package.json         # 项目配置
└── tsconfig.json        # TypeScript配置
```

## 🔧 配置说明

主要配置项在 `src/config/index.ts` 中：

```typescript
export const config = {
  server: {
    port: 3000,           // 服务端口
    host: 'localhost',    // 服务地址
  },
  crawler: {
    defaultDelay: 1000,   // 默认请求间隔(ms)
    minDelay: 500,        // 最小请求间隔(ms)
    maxDelay: 5000,       // 最大请求间隔(ms)
    timeout: 30000,       // 请求超时时间(ms)
  },
  storage: {
    dataDir: './data',    // 数据存储目录
    maxFilesPerDir: 1000, // 每目录最大文件数
  }
};
```

## 📖 API 使用指南

### 启动爬虫

```bash
curl -X POST http://localhost:3000/api/crawler/control \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "config": {
      "start_id": 100000,
      "end_id": 100010,
      "delay": 1000
    }
  }'
```

### 查询系统状态

```bash
curl http://localhost:3000/api/system/status
```

### 获取项目列表

```bash
curl "http://localhost:3000/api/projects?page=1&limit=10&category=科技"
```

### 测试单个项目爬取

```bash
curl "http://localhost:3000/api/crawler/test/114514?save=true"
```

详细API文档请参考 [API.md](./API.md)

## 🗄️ 数据存储设计

### 目录结构

项目数据按ID分层存储，避免单目录文件过多：

```
data/
├── index.json           # 全局项目索引
└── projects/
    ├── 11/45/14/        # 项目ID: 114514
    │   └── 114514.json  # 项目数据文件
    └── 12/34/56/        # 项目ID: 123456
        └── 123456.json  # 项目数据文件
```

### 数据格式

每个项目文件包含多个版本的数据：

```json
[
  {
    "project_id": 114514,
    "version": 1,
    "crawl_time": "2025-06-18T10:00:00.000Z",
    "data": { /* 清洗后的项目数据 */ },
    "raw_data": { /* 原始API数据(可选) */ }
  },
  {
    "project_id": 114514,
    "version": 2,
    "crawl_time": "2025-06-18T12:00:00.000Z",
    "data": { /* 更新后的项目数据 */ }
  }
]
```

## 🧪 测试

### 运行基础功能测试

```bash
pnpm exec ts-node src/tests/basic.test.ts
```

### 测试爬虫功能

```bash
pnpm exec ts-node src/test-crawler.ts
```

### 测试API接口

```bash
# 启动服务器
pnpm dev

# 在另一个终端运行测试
node test-api.js
```

## 🔒 安全说明

- 系统使用官方API的MD5签名认证机制
- 支持请求频率控制，避免对目标服务器造成压力
- 数据存储在本地，不涉及敏感信息传输

## 📝 开发说明

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint代码规范
- 详细的JSDoc注释
- 统一的错误处理机制

### 扩展开发

1. **添加新的数据源**: 在 `services/` 目录下创建新的服务
2. **扩展API接口**: 在 `controllers/` 目录下添加新的控制器
3. **自定义数据处理**: 修改 `utils/dataTransform.ts` 中的转换逻辑
4. **添加新的存储方式**: 扩展 `services/storageService.ts`

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目仅供学习和研究使用，请遵守相关法律法规和网站使用条款。

## 🙋‍♂️ 常见问题

### Q: 如何修改爬取间隔？

A: 在启动爬虫时通过 `delay` 参数指定，或修改配置文件中的 `defaultDelay`。

### Q: 数据存储在哪里？

A: 默认存储在 `./data` 目录下，可通过配置文件修改。

### Q: 如何清理过期数据？

A: 调用 `/api/system/cleanup` 接口，或使用存储服务的 `cleanupOldData` 方法。

### Q: 系统支持并发爬取吗？

A: 当前版本为单线程爬取，避免对目标服务器造成过大压力。

---

**注意**: 请合理使用爬虫功能，遵守网站robots.txt规则和相关法律法规。
