import type { AppConfig } from '../types';
import { apiClient } from './api';

// 默认配置
const DEFAULT_CONFIG: AppConfig = {
  apiBaseUrl: 'http://localhost:3000',
  defaultPageSize: 20,
  refreshInterval: 5000, // 5秒
};

// 配置管理类
export class ConfigService {
  private config: AppConfig;
  private readonly STORAGE_KEY = 'modian-crawler-config';

  constructor() {
    this.config = this.loadConfig();
    this.applyConfig();
  }

  // 从localStorage加载配置
  private loadConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (error) {
      console.warn('加载配置失败，使用默认配置:', error);
    }
    return { ...DEFAULT_CONFIG };
  }

  // 保存配置到localStorage
  private saveConfig(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  }

  // 应用配置到相关服务
  private applyConfig(): void {
    // 设置API客户端的基础URL
    apiClient.setBaseUrl(this.config.apiBaseUrl);
  }

  // 获取当前配置
  getConfig(): AppConfig {
    return { ...this.config };
  }

  // 更新配置
  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    this.applyConfig();
  }

  // 重置为默认配置
  resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
    this.applyConfig();
  }

  // 获取特定配置项
  get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  get defaultPageSize(): number {
    return this.config.defaultPageSize;
  }

  get refreshInterval(): number {
    return this.config.refreshInterval;
  }

  // 设置特定配置项
  setApiBaseUrl(url: string): void {
    this.updateConfig({ apiBaseUrl: url });
  }

  setDefaultPageSize(size: number): void {
    this.updateConfig({ defaultPageSize: size });
  }

  setRefreshInterval(interval: number): void {
    this.updateConfig({ refreshInterval: interval });
  }

  // 验证API连接
  async validateApiConnection(): Promise<boolean> {
    try {
      return await apiClient.testConnection();
    } catch {
      return false;
    }
  }
}

// 创建配置服务实例
export const configService = new ConfigService();

// 导出配置相关的便捷方法
export const config = {
  get: () => configService.getConfig(),
  update: (updates: Partial<AppConfig>) => configService.updateConfig(updates),
  reset: () => configService.resetConfig(),
  
  // 快捷访问器
  get apiBaseUrl() { return configService.apiBaseUrl; },
  get defaultPageSize() { return configService.defaultPageSize; },
  get refreshInterval() { return configService.refreshInterval; },
  
  // 快捷设置器
  setApiBaseUrl: (url: string) => configService.setApiBaseUrl(url),
  setDefaultPageSize: (size: number) => configService.setDefaultPageSize(size),
  setRefreshInterval: (interval: number) => configService.setRefreshInterval(interval),
  
  // 验证方法
  validateConnection: () => configService.validateApiConnection(),
};
