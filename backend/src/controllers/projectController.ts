/**
 * 项目控制器 - 处理项目数据查询相关的API请求
 */

import { Request, Response } from 'express';
import { StorageService } from '../services/storageService';
import { ApiResponse, ProjectQueryParams, ProjectVersionQueryParams, PaginatedResponse } from '../types/api';
import { ProjectIndex, ProjectVersion } from '../types/modian';

export class ProjectController {
  constructor(private storageService: StorageService) {}

  /**
   * 获取项目列表
   */
  async getProjects(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        status,
        start_date,
        end_date,
        min_amount,
        max_amount,
        sort_by = 'last_crawl_time',
        sort_order = 'desc',
      } = req.query as any;

      // 参数验证
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      if (isNaN(pageNum) || pageNum < 1) {
        const response: ApiResponse = {
          success: false,
          message: '无效的页码',
          error: 'page 必须是大于0的整数',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        const response: ApiResponse = {
          success: false,
          message: '无效的每页数量',
          error: 'limit 必须是1-100之间的整数',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // 查询项目
      let projects = this.storageService.queryProjects({
        category,
        status,
        nameKeyword: req.query.keyword as string,
      });

      // 日期过滤
      if (start_date) {
        projects = projects.filter(p => p.last_crawl_time >= start_date);
      }
      if (end_date) {
        projects = projects.filter(p => p.last_crawl_time <= end_date);
      }

      // 排序
      projects.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sort_by) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'category':
            aValue = a.category;
            bValue = b.category;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'first_crawl_time':
            aValue = a.first_crawl_time;
            bValue = b.first_crawl_time;
            break;
          case 'last_crawl_time':
          default:
            aValue = a.last_crawl_time;
            bValue = b.last_crawl_time;
            break;
        }

        if (sort_order === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });

      // 分页
      const total = projects.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedProjects = projects.slice(startIndex, endIndex);

      const result: PaginatedResponse<ProjectIndex> = {
        items: paginatedProjects,
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: totalPages,
      };

      const response: ApiResponse<PaginatedResponse<ProjectIndex>> = {
        success: true,
        message: '获取项目列表成功',
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('获取项目列表失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '获取项目列表失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取单个项目的详细信息（最新版本）
   */
  async getProject(req: Request, res: Response): Promise<void> {
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

      const latestVersion = await this.storageService.getLatestProjectVersion(projectId);

      if (!latestVersion) {
        const response: ApiResponse = {
          success: false,
          message: '项目不存在',
          error: `未找到项目 ${projectId}`,
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<ProjectVersion> = {
        success: true,
        message: '获取项目详情成功',
        data: latestVersion,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('获取项目详情失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '获取项目详情失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取项目的所有版本历史
   */
  async getProjectVersions(req: Request, res: Response): Promise<void> {
    try {
      const { project_id } = req.params;
      const {
        page = 1,
        limit = 20,
        start_date,
        end_date,
      } = req.query as any;

      const projectId = parseInt(project_id);
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

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

      let versions = await this.storageService.getProjectVersions(projectId);

      if (versions.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: '项目不存在',
          error: `未找到项目 ${projectId}`,
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      // 日期过滤
      if (start_date) {
        versions = versions.filter(v => v.crawl_time >= start_date);
      }
      if (end_date) {
        versions = versions.filter(v => v.crawl_time <= end_date);
      }

      // 按版本号降序排序
      versions.sort((a, b) => b.version - a.version);

      // 分页
      const total = versions.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedVersions = versions.slice(startIndex, endIndex);

      const result: PaginatedResponse<ProjectVersion> = {
        items: paginatedVersions,
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: totalPages,
      };

      const response: ApiResponse<PaginatedResponse<ProjectVersion>> = {
        success: true,
        message: '获取项目版本历史成功',
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('获取项目版本历史失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '获取项目版本历史失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取项目分类列表
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const projects = this.storageService.getProjectsList();
      const categories = new Set<string>();

      for (const project of projects) {
        if (project.category) {
          categories.add(project.category);
        }
      }

      const categoriesList = Array.from(categories).sort();

      const response: ApiResponse<string[]> = {
        success: true,
        message: '获取分类列表成功',
        data: categoriesList,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('获取分类列表失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '获取分类列表失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * 搜索项目
   */
  async searchProjects(req: Request, res: Response): Promise<void> {
    try {
      const { keyword, category, status } = req.query as any;

      if (!keyword) {
        const response: ApiResponse = {
          success: false,
          message: '缺少搜索关键词',
          error: 'keyword 参数是必需的',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const projects = this.storageService.queryProjects({
        nameKeyword: keyword,
        category,
        status,
      });

      const response: ApiResponse<ProjectIndex[]> = {
        success: true,
        message: '搜索项目成功',
        data: projects,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('搜索项目失败:', error);
      const response: ApiResponse = {
        success: false,
        message: '搜索项目失败',
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }
}
