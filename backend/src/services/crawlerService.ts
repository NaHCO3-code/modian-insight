/**
 * 爬虫服务 - 核心爬取逻辑
 */

import { EventEmitter } from 'events';
import { authenticatedFetch, simpleFetch } from './authService';
import { transformRawToClean, validateProjectData, hasSignificantChanges, compareProjectData } from '../utils/dataTransform';
import { RawProjectData, CleanProjectData, CrawlTask, ProjectVersion } from '../types/modian';
import config from '../config';

export interface CrawlOptions {
  startId?: number;
  endId?: number;
  targetIds?: number[];
  delay?: number;
  token?: string;
  userId?: string;
}

export interface CrawlProgress {
  total: number;
  completed: number;
  failed: number;
  current?: number;
}

export class CrawlerService extends EventEmitter {
  private isRunning = false;
  private currentTask: CrawlTask | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    super();
  }

  /**
   * 开始爬取任务
   */
  async startCrawl(options: CrawlOptions): Promise<string> {
    if (this.isRunning) {
      throw new Error('爬虫正在运行中，请先停止当前任务');
    }

    // 生成任务ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 确定要爬取的ID列表
    let targetIds: number[] = [];
    if (options.targetIds) {
      targetIds = options.targetIds;
    } else if (options.startId && options.endId) {
      for (let i = options.startId; i <= options.endId; i++) {
        targetIds.push(i);
      }
    } else {
      throw new Error('必须指定 targetIds 或者 startId 和 endId');
    }

    // 创建爬取任务
    this.currentTask = {
      id: taskId,
      start_id: options.startId,
      end_id: options.endId,
      target_ids: options.targetIds,
      delay: options.delay || config.crawler.defaultDelay,
      status: 'pending',
      created_at: new Date().toISOString(),
      progress: {
        total: targetIds.length,
        completed: 0,
        failed: 0,
      },
    };

    // 开始爬取
    this.isRunning = true;
    this.currentTask.status = 'running';
    this.currentTask.started_at = new Date().toISOString();
    this.abortController = new AbortController();

    this.emit('taskStarted', this.currentTask);

    // 异步执行爬取
    this.executeCrawl(targetIds, options).catch((error) => {
      this.emit('error', error);
      this.stopCrawl();
    });

    return taskId;
  }

  /**
   * 停止爬取任务
   */
  stopCrawl(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
    }

    if (this.currentTask) {
      this.currentTask.status = 'completed';
      this.currentTask.completed_at = new Date().toISOString();
      this.emit('taskCompleted', this.currentTask);
    }

    this.currentTask = null;
    this.abortController = null;
  }

  /**
   * 暂停爬取任务
   */
  pauseCrawl(): void {
    if (this.currentTask && this.isRunning) {
      this.currentTask.status = 'paused';
      this.emit('taskPaused', this.currentTask);
    }
  }

  /**
   * 恢复爬取任务
   */
  resumeCrawl(): void {
    if (this.currentTask && this.currentTask.status === 'paused') {
      this.currentTask.status = 'running';
      this.emit('taskResumed', this.currentTask);
    }
  }

  /**
   * 获取当前任务状态
   */
  getCurrentTask(): CrawlTask | null {
    return this.currentTask;
  }

  /**
   * 检查是否正在运行
   */
  isRunningTask(): boolean {
    return this.isRunning;
  }

  /**
   * 执行爬取逻辑
   */
  private async executeCrawl(targetIds: number[], options: CrawlOptions): Promise<void> {
    for (const projectId of targetIds) {
      // 检查是否需要停止
      if (!this.isRunning || this.abortController?.signal.aborted) {
        break;
      }

      // 检查是否暂停
      while (this.currentTask?.status === 'paused') {
        await this.sleep(1000);
      }

      try {
        // 爬取单个项目
        const projectData = await this.crawlSingleProject(projectId, options);
        
        if (projectData && this.currentTask) {
          this.currentTask.progress.completed++;
          this.emit('projectCrawled', { projectId, data: projectData });
        }
      } catch (error) {
        console.error(`爬取项目 ${projectId} 失败:`, error);
        if (this.currentTask) {
          this.currentTask.progress.failed++;
        }
        this.emit('projectFailed', { projectId, error });
      }

      // 更新进度
      if (this.currentTask) {
        this.emit('progressUpdated', this.currentTask.progress);
      }

      // 延迟
      if (options.delay && options.delay > 0) {
        await this.sleep(options.delay);
      }
    }

    // 完成爬取
    this.stopCrawl();
  }

  /**
   * 爬取单个项目
   */
  async crawlSingleProject(projectId: number, options: CrawlOptions): Promise<CleanProjectData | null> {
    try {
      // 获取项目限制状态
      const limitStatusUrl = `${config.modian.baseUrl}/p/get_project_limit_status?pro_id=${projectId}`;
      const limitResponse = await simpleFetch(limitStatusUrl);
      
      if (!limitResponse.ok) {
        throw new Error(`获取项目限制状态失败: ${limitResponse.status}`);
      }

      // 获取项目详细信息
      const timestamp = Date.now();
      const detailUrl = `${config.modian.baseUrl}/realtime/get_simple_product?jsonpcallback=jQuery${timestamp}&ids=${projectId}&if_all=1&_=${timestamp + 1}`;
      const detailResponse = await simpleFetch(detailUrl);
      
      if (!detailResponse.ok) {
        throw new Error(`获取项目详情失败: ${detailResponse.status}`);
      }

      const detailText = await detailResponse.text();

      // 解析JSONP响应
      // 支持两种格式：
      // 1. jQuery123456(data);
      // 2. window[decodeURIComponent('jQuery123456')]([data]);
      let jsonpMatch = detailText.match(/jQuery\d+\((.+)\);?$/);
      if (!jsonpMatch) {
        // 尝试匹配 window[decodeURIComponent('jQuery123456')]([data]); 格式
        jsonpMatch = detailText.match(/window\[decodeURIComponent\('jQuery\d+'\)\]\((.+)\);?$/);
      }
      if (!jsonpMatch) {
        throw new Error('无法解析JSONP响应');
      }

      const projectsData = JSON.parse(jsonpMatch[1]) as RawProjectData[];
      if (!projectsData || projectsData.length === 0) {
        throw new Error('项目数据为空');
      }

      const rawData = projectsData[0];
      
      // 转换为清洗后的数据
      const cleanData = transformRawToClean(rawData);
      
      // 验证数据
      if (!validateProjectData(cleanData)) {
        throw new Error('项目数据验证失败');
      }

      return cleanData;
    } catch (error) {
      console.error(`爬取项目 ${projectId} 时出错:`, error);
      throw error;
    }
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
