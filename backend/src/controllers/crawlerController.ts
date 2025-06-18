/**
 * 爬虫控制器 - 处理爬虫相关的API请求
 */

import { Request, Response } from 'express';
import { CrawlerService } from '../services/crawlerService';
import { StorageService } from '../services/storageService';
import { ApiResponse, CrawlControlRequest } from '../types/api';
import config from '../config';

export class CrawlerController {
  constructor(
    private crawlerService: CrawlerService,
    private storageService: StorageService
  ) {
    // 监听爬虫事件并处理数据存储
    this.setupCrawlerEventHandlers();
  }

  /**
   * 设置爬虫事件处理器
   */
  private setupCrawlerEventHandlers(): void {
    this.crawlerService.on('projectCrawled', async (event) => {
      try {
        await this.storageService.storeProject(event.data);
      } catch (error) {
        console.error(`存储项目 ${event.projectId} 数据失败:`, error);
      }
    });

    this.crawlerService.on('taskStarted', (task) => {
      console.log(`爬取任务开始: ${task.id}`);
    });

    this.crawlerService.on('taskCompleted', (task) => {
      console.log(`爬取任务完成: ${task.id}, 成功: ${task.progress.completed}, 失败: ${task.progress.failed}`);
    });

    this.crawlerService.on('progressUpdated', (progress) => {
      console.log(`爬取进度: ${progress.completed}/${progress.total} (失败: ${progress.failed})`);
    });
  }

  /**
   * 控制爬虫（开始/停止/暂停/恢复）
   */
  async controlCrawler(req: Request, res: Response): Promise<void> {
    try {
      const { action, config: crawlConfig }: CrawlControlRequest = req.body;

      if (!action) {
        const response: ApiResponse = {
          success: false,
          message: '缺少操作类型',
          error: 'action 参数是必需的',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      let result: any = {};

      switch (action) {
        case 'start':
          if (!crawlConfig) {
            const response: ApiResponse = {
              success: false,
              message: '启动爬虫需要配置参数',
              error: 'config 参数是必需的',
              timestamp: new Date().toISOString(),
            };
            res.status(400).json(response);
            return;
          }

          // 验证配置参数
          if (!crawlConfig.target_ids && (!crawlConfig.start_id || !crawlConfig.end_id)) {
            const response: ApiResponse = {
              success: false,
              message: '必须指定 target_ids 或者 start_id 和 end_id',
              timestamp: new Date().toISOString(),
            };
            res.status(400).json(response);
            return;
          }

          // 验证延迟参数
          if (crawlConfig.delay && (crawlConfig.delay < config.crawler.minDelay || crawlConfig.delay > config.crawler.maxDelay)) {
            const response: ApiResponse = {
              success: false,
              message: `延迟时间必须在 ${config.crawler.minDelay} 到 ${config.crawler.maxDelay} 毫秒之间`,
              timestamp: new Date().toISOString(),
            };
            res.status(400).json(response);
            return;
          }

          const taskId = await this.crawlerService.startCrawl({
            startId: crawlConfig.start_id,
            endId: crawlConfig.end_id,
            targetIds: crawlConfig.target_ids,
            delay: crawlConfig.delay || config.crawler.defaultDelay,
          });

          result = { task_id: taskId };
          break;

        case 'stop':
          this.crawlerService.stopCrawl();
          result = { message: '爬虫已停止' };
          break;

        case 'pause':
          this.crawlerService.pauseCrawl();
          result = { message: '爬虫已暂停' };
          break;

        case 'resume':
          this.crawlerService.resumeCrawl();
          result = { message: '爬虫已恢复' };
          break;

        default:
          const response: ApiResponse = {
            success: false,
            message: '无效的操作类型',
            error: `不支持的操作: ${action}`,
            timestamp: new Date().toISOString(),
          };
          res.status(400).json(response);
          return;
      }

      const response: ApiResponse = {
        success: true,
        message: `爬虫${action}操作成功`,
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('控制爬虫失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '控制爬虫失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取当前爬取任务状态
   */
  async getCurrentTask(req: Request, res: Response): Promise<void> {
    try {
      const currentTask = this.crawlerService.getCurrentTask();

      const response: ApiResponse = {
        success: true,
        message: '获取当前任务成功',
        data: currentTask,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('获取当前任务失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '获取当前任务失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * 测试爬取单个项目
   */
  async testCrawlProject(req: Request, res: Response): Promise<void> {
    try {
      const { project_id } = req.params;
      const projectId = parseInt(project_id);

      if (isNaN(projectId)) {
        const response: ApiResponse = {
          success: false,
          message: '无效的项目ID',
          error: 'project_id 必须是数字',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const projectData = await this.crawlerService.crawlSingleProject(projectId, {});

      if (projectData) {
        // 可选择是否存储测试数据
        const { save } = req.query;
        if (save === 'true') {
          await this.storageService.storeProject(projectData);
        }

        const response: ApiResponse = {
          success: true,
          message: '测试爬取成功',
          data: projectData,
          timestamp: new Date().toISOString(),
        };

        res.json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          message: '爬取失败，未获取到数据',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
      }
    } catch (error) {
      console.error('测试爬取失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '测试爬取失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取爬虫配置信息
   */
  async getCrawlerConfig(req: Request, res: Response): Promise<void> {
    try {
      const crawlerConfig = {
        default_delay: config.crawler.defaultDelay,
        min_delay: config.crawler.minDelay,
        max_delay: config.crawler.maxDelay,
        concurrency: config.crawler.concurrency,
        max_retries: config.crawler.maxRetries,
        timeout: config.crawler.timeout,
      };

      const response: ApiResponse = {
        success: true,
        message: '获取爬虫配置成功',
        data: crawlerConfig,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('获取爬虫配置失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '获取爬虫配置失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }
}
