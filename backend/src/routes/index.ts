/**
 * 路由配置
 */

import { Router } from 'express';
import { SystemController } from '../controllers/systemController';
import { CrawlerController } from '../controllers/crawlerController';
import { ProjectController } from '../controllers/projectController';
import { CrawlerService } from '../services/crawlerService';
import { StorageService } from '../services/storageService';

// 创建服务实例
const storageService = new StorageService();
const crawlerService = new CrawlerService();

// 创建控制器实例
const systemController = new SystemController(crawlerService, storageService);
const crawlerController = new CrawlerController(crawlerService, storageService);
const projectController = new ProjectController(storageService);

const router: Router = Router();

// 系统相关路由
router.get('/system/status', systemController.getSystemStatus.bind(systemController));
router.get('/system/health', systemController.getHealthCheck.bind(systemController));
router.get('/system/stats', systemController.getSystemStats.bind(systemController));
router.post('/system/cleanup', systemController.cleanupData.bind(systemController));

// 爬虫控制相关路由
router.post('/crawler/control', crawlerController.controlCrawler.bind(crawlerController));
router.get('/crawler/task', crawlerController.getCurrentTask.bind(crawlerController));
router.get('/crawler/config', crawlerController.getCrawlerConfig.bind(crawlerController));
router.get('/crawler/test/:project_id', crawlerController.testCrawlProject.bind(crawlerController));

// 项目数据相关路由
router.get('/projects', projectController.getProjects.bind(projectController));
router.get('/projects/categories', projectController.getCategories.bind(projectController));
router.get('/projects/search', projectController.searchProjects.bind(projectController));
router.get('/projects/:project_id', projectController.getProject.bind(projectController));
router.get('/projects/:project_id/versions', projectController.getProjectVersions.bind(projectController));

// API文档路由
router.get('/', (req, res) => {
  res.json({
    name: 'Modian Insight API',
    version: '1.0.0',
    description: '提供众筹项目数据爬取和查询功能',
    endpoints: {
      system: {
        'GET /api/system/status': '获取系统状态',
        'GET /api/system/health': '健康检查',
        'GET /api/system/stats': '获取统计信息',
        'POST /api/system/cleanup': '清理过期数据',
      },
      crawler: {
        'POST /api/crawler/control': '控制爬虫（开始/停止/暂停/恢复）',
        'GET /api/crawler/task': '获取当前任务状态',
        'GET /api/crawler/config': '获取爬虫配置',
        'GET /api/crawler/test/:project_id': '测试爬取单个项目',
      },
      projects: {
        'GET /api/projects': '获取项目列表（支持分页和过滤）',
        'GET /api/projects/categories': '获取项目分类列表',
        'GET /api/projects/search': '搜索项目',
        'GET /api/projects/:project_id': '获取项目详情',
        'GET /api/projects/:project_id/versions': '获取项目版本历史',
      },
    },
    timestamp: new Date().toISOString(),
  });
});

export { router, storageService, crawlerService };
export default router;
