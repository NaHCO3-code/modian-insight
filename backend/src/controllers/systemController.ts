/**
 * 系统控制器 - 处理系统状态相关的API请求
 */

import { Request, Response } from 'express';
import { CrawlerService } from '../services/crawlerService';
import { StorageService } from '../services/storageService';
import { ApiResponse } from '../types/api';

export class SystemController {
  constructor(
    private crawlerService: CrawlerService,
    private storageService: StorageService
  ) {}

  /**
   * 获取系统状态
   */
  async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      const currentTask = this.crawlerService.getCurrentTask();
      const storageStats = await this.storageService.getStorageStats();
      const projectsList = this.storageService.getProjectsList();
      
      // 计算最后爬取时间
      let lastCrawlTime: string | undefined;
      if (projectsList.length > 0) {
        lastCrawlTime = projectsList
          .map(p => p.last_crawl_time)
          .sort()
          .reverse()[0];
      }

      const systemStatus: any = {
        is_running: this.crawlerService.isRunningTask(),
        current_task: currentTask,
        total_projects: storageStats.totalProjects,
        total_versions: storageStats.totalVersions,
        last_crawl_time: lastCrawlTime,
        storage_info: {
          data_dir: this.storageService['dataDir'],
          total_size: storageStats.totalSize,
          file_count: storageStats.fileCount,
        },
      };

      const response: ApiResponse<any> = {
        success: true,
        message: '获取系统状态成功',
        data: systemStatus,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('获取系统状态失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '获取系统状态失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取系统健康状态
   */
  async getHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const storageStats = await this.storageService.getStorageStats();
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        storage: storageStats,
      };

      const response: ApiResponse = {
        success: true,
        message: '系统健康',
        data: health,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('健康检查失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '系统异常',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取系统统计信息
   */
  async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      const storageStats = await this.storageService.getStorageStats();
      const projectsList = this.storageService.getProjectsList();

      // 按状态统计
      const byStatus: Record<string, number> = {};
      // 按分类统计
      const byCategory: Record<string, number> = {};

      for (const project of projectsList) {
        byStatus[project.status] = (byStatus[project.status] || 0) + 1;
        byCategory[project.category] = (byCategory[project.category] || 0) + 1;
      }

      // 最受欢迎的分类
      const mostPopularCategories = Object.entries(byCategory)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // 最近活动（简化版本，实际可能需要更复杂的统计）
      const today = new Date().toISOString().split('T')[0];
      const recentActivity = [
        {
          date: today,
          new_projects: projectsList.filter(p =>
            p.first_crawl_time && p.first_crawl_time.includes(today)
          ).length,
          completed_projects: projectsList.filter(p =>
            p.status === '成功' &&
            p.last_crawl_time && p.last_crawl_time.includes(today)
          ).length,
        }
      ];

      const stats = {
        total_projects: storageStats.totalProjects,
        by_status: byStatus,
        by_category: byCategory,
        total_raised_amount: 0, // 需要从实际数据计算
        average_completion_rate: 0, // 需要从实际数据计算
        most_popular_categories: mostPopularCategories,
        recent_activity: recentActivity,
        storage_stats: storageStats,
      };

      const response: ApiResponse = {
        success: true,
        message: '获取统计信息成功',
        data: stats,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('获取统计信息失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '获取统计信息失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * 清理过期数据
   */
  async cleanupData(req: Request, res: Response): Promise<void> {
    try {
      const { retention_days } = req.body;
      const retentionDays = retention_days || 30;

      await this.storageService.cleanupOldData(retentionDays);

      const response: ApiResponse = {
        success: true,
        message: `成功清理 ${retentionDays} 天前的数据`,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('清理数据失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '清理数据失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }
}
