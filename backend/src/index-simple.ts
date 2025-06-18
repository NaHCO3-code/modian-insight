/**
 * 简化版应用程序入口文件 - 用于测试基本功能
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

// 创建Express应用
const app: express.Application = express();

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(compression()); // 响应压缩
app.use(morgan('combined')); // 日志记录
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL编码解析

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'Modian Insight',
    version: '1.0.0',
    description: '提供众筹项目数据爬取和查询功能的后端服务',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API基础路由
app.get('/api', (req, res) => {
  res.json({
    name: 'Modian Insight',
    version: '1.0.0',
    description: '提供众筹项目数据爬取和查询功能',
    endpoints: {
      'GET /': '系统信息',
      'GET /health': '健康检查',
      'GET /api': 'API文档',
    },
    timestamp: new Date().toISOString(),
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    error: `路径 ${req.originalUrl} 未找到`,
    timestamp: new Date().toISOString(),
  });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器异常',
    timestamp: new Date().toISOString(),
  });
});

// 启动服务器
const port = 3000;
const host = 'localhost';

app.listen(port, host, () => {
  console.log(`🚀 众筹爬虫系统启动成功`);
  console.log(`📡 服务地址: http://${host}:${port}`);
  console.log(`📚 API文档: http://${host}:${port}/api`);
  console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

export default app;
