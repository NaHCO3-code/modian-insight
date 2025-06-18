/**
 * 数据存储服务 - 管理项目数据的文件存储
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { CleanProjectData, ProjectVersion, ProjectIndex, RawProjectData } from '../types/modian';
import { compareProjectData, hasSignificantChanges } from '../utils/dataTransform';
import config from '../config';

export interface StorageStats {
  totalProjects: number;
  totalVersions: number;
  totalSize: number;
  fileCount: number;
}

export class StorageService {
  private dataDir: string;
  private indexFile: string;
  private projectsIndex: Map<number, ProjectIndex> = new Map();

  constructor() {
    this.dataDir = config.storage.dataDir;
    this.indexFile = path.join(this.dataDir, 'index.json');
    this.initializeStorage();
  }

  /**
   * 初始化存储系统
   */
  private async initializeStorage(): Promise<void> {
    try {
      // 确保数据目录存在
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // 加载索引文件
      await this.loadIndex();
    } catch (error) {
      console.error('初始化存储系统失败:', error);
    }
  }

  /**
   * 加载项目索引
   */
  private async loadIndex(): Promise<void> {
    try {
      const indexData = await fs.readFile(this.indexFile, 'utf-8');
      const indexArray: ProjectIndex[] = JSON.parse(indexData);
      
      this.projectsIndex.clear();
      for (const item of indexArray) {
        this.projectsIndex.set(item.project_id, item);
      }
    } catch (error) {
      // 索引文件不存在或损坏，创建新的
      console.log('索引文件不存在，将创建新的索引');
      this.projectsIndex.clear();
      await this.saveIndex();
    }
  }

  /**
   * 保存项目索引
   */
  private async saveIndex(): Promise<void> {
    const indexArray = Array.from(this.projectsIndex.values());
    await fs.writeFile(this.indexFile, JSON.stringify(indexArray, null, 2), 'utf-8');
  }

  /**
   * 获取项目存储路径
   */
  private getProjectPath(projectId: number): string {
    // 使用项目ID的前几位作为目录分层，避免单个目录文件过多
    const idStr = projectId.toString().padStart(8, '0');
    const dir1 = idStr.substring(0, 2);
    const dir2 = idStr.substring(2, 4);
    const dir3 = idStr.substring(4, 6);
    
    return path.join(this.dataDir, 'projects', dir1, dir2, dir3, `${projectId}.json`);
  }

  /**
   * 存储项目数据
   */
  async storeProject(
    projectData: CleanProjectData, 
    rawData?: RawProjectData
  ): Promise<boolean> {
    try {
      const projectId = projectData.id;
      const crawlTime = new Date().toISOString();
      
      // 检查是否已存在该项目
      const existingIndex = this.projectsIndex.get(projectId);
      let shouldSave = true;
      let version = 1;

      if (existingIndex) {
        // 加载最新版本数据进行比较
        const latestVersion = await this.getLatestProjectVersion(projectId);
        if (latestVersion) {
          const changes = compareProjectData(latestVersion.data, projectData);
          shouldSave = hasSignificantChanges(changes);
          version = latestVersion.version + 1;
        }
      }

      if (!shouldSave) {
        console.log(`项目 ${projectId} 数据无显著变化，跳过存储`);
        return false;
      }

      // 创建项目版本数据
      const projectVersion: ProjectVersion = {
        project_id: projectId,
        version,
        crawl_time: crawlTime,
        data: projectData,
        raw_data: rawData,
      };

      // 确保目录存在
      const filePath = this.getProjectPath(projectId);
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // 读取现有数据或创建新文件
      let versions: ProjectVersion[] = [];
      try {
        const existingData = await fs.readFile(filePath, 'utf-8');
        versions = JSON.parse(existingData);
      } catch (error) {
        // 文件不存在，创建新的版本数组
      }

      // 添加新版本
      versions.push(projectVersion);

      // 保存到文件
      await fs.writeFile(filePath, JSON.stringify(versions, null, 2), 'utf-8');

      // 更新索引
      const indexEntry: ProjectIndex = {
        project_id: projectId,
        name: projectData.name,
        category: projectData.category,
        status: projectData.status,
        first_crawl_time: existingIndex?.first_crawl_time || crawlTime,
        last_crawl_time: crawlTime,
        version_count: versions.length,
        file_path: filePath,
      };

      this.projectsIndex.set(projectId, indexEntry);
      await this.saveIndex();

      console.log(`成功存储项目 ${projectId} 的第 ${version} 个版本`);
      return true;
    } catch (error) {
      console.error(`存储项目 ${projectData.id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 获取项目的最新版本
   */
  async getLatestProjectVersion(projectId: number): Promise<ProjectVersion | null> {
    try {
      const filePath = this.getProjectPath(projectId);
      const data = await fs.readFile(filePath, 'utf-8');
      const versions: ProjectVersion[] = JSON.parse(data);
      
      if (versions.length === 0) {
        return null;
      }

      // 返回最新版本（版本号最大的）
      return versions.reduce((latest, current) => 
        current.version > latest.version ? current : latest
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取项目的所有版本
   */
  async getProjectVersions(projectId: number): Promise<ProjectVersion[]> {
    try {
      const filePath = this.getProjectPath(projectId);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  /**
   * 获取项目列表
   */
  getProjectsList(): ProjectIndex[] {
    return Array.from(this.projectsIndex.values());
  }

  /**
   * 根据条件查询项目
   */
  queryProjects(filters: {
    category?: string;
    status?: string;
    nameKeyword?: string;
  }): ProjectIndex[] {
    let results = this.getProjectsList();

    if (filters.category) {
      results = results.filter(p => p.category === filters.category);
    }

    if (filters.status) {
      results = results.filter(p => p.status === filters.status);
    }

    if (filters.nameKeyword) {
      const keyword = filters.nameKeyword.toLowerCase().trim();

      // 检查是否是纯数字（项目ID）
      const isNumeric = /^\d+$/.test(keyword);

      if (isNumeric) {
        // 按项目ID搜索
        const projectId = parseInt(keyword);
        results = results.filter(p => p.project_id === projectId);
      } else {
        // 按项目名称搜索
        results = results.filter(p => p.name.toLowerCase().includes(keyword));
      }
    }

    return results;
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<StorageStats> {
    const projects = this.getProjectsList();
    let totalVersions = 0;
    let totalSize = 0;
    let fileCount = 0;

    for (const project of projects) {
      totalVersions += project.version_count;
      
      try {
        const stats = await fs.stat(project.file_path);
        totalSize += stats.size;
        fileCount++;
      } catch (error) {
        // 文件可能已被删除
      }
    }

    return {
      totalProjects: projects.length,
      totalVersions,
      totalSize,
      fileCount,
    };
  }

  /**
   * 清理过期数据
   */
  async cleanupOldData(retentionDays: number = config.storage.backupRetentionDays): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const projects = this.getProjectsList();
    let cleanedCount = 0;

    for (const project of projects) {
      try {
        const versions = await this.getProjectVersions(project.project_id);
        const filteredVersions = versions.filter(v => 
          new Date(v.crawl_time) > cutoffDate
        );

        if (filteredVersions.length < versions.length) {
          // 保存过滤后的版本
          const filePath = this.getProjectPath(project.project_id);
          await fs.writeFile(filePath, JSON.stringify(filteredVersions, null, 2), 'utf-8');
          
          // 更新索引
          project.version_count = filteredVersions.length;
          if (filteredVersions.length > 0) {
            project.last_crawl_time = filteredVersions[filteredVersions.length - 1].crawl_time;
          }
          
          cleanedCount += versions.length - filteredVersions.length;
        }
      } catch (error) {
        console.error(`清理项目 ${project.project_id} 数据失败:`, error);
      }
    }

    await this.saveIndex();
    console.log(`清理完成，删除了 ${cleanedCount} 个过期版本`);
  }
}
