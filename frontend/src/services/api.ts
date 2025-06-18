import type {
  ApiResponse,
  PaginatedResponse,
  SystemStatus,
  HealthCheck,
  SystemStats,
  CrawlTask,
  CrawlerConfig,
  CrawlControlRequest,
  ProjectData,
  ProjectIndex,
  ProjectVersion,
  ProjectQueryParams,
  SearchParams
} from '../types';

// API客户端类
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // 移除末尾斜杠
  }

  // 设置基础URL
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API请求失败: ${url}`, error);
      throw error;
    }
  }

  // GET请求
  private async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST请求
  private async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // 系统管理API
  async getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
    return this.get<SystemStatus>('/system/status');
  }

  async getHealthCheck(): Promise<ApiResponse<HealthCheck>> {
    return this.get<HealthCheck>('/system/health');
  }

  async getSystemStats(): Promise<ApiResponse<SystemStats>> {
    return this.get<SystemStats>('/system/stats');
  }

  async cleanupData(retentionDays: number): Promise<ApiResponse<void>> {
    return this.post<void>('/system/cleanup', { retention_days: retentionDays });
  }

  // 爬虫控制API
  async controlCrawler(request: CrawlControlRequest): Promise<ApiResponse<{ task_id?: string }>> {
    return this.post<{ task_id?: string }>('/crawler/control', request);
  }

  async getCurrentTask(): Promise<ApiResponse<CrawlTask>> {
    return this.get<CrawlTask>('/crawler/task');
  }

  async getCrawlerConfig(): Promise<ApiResponse<CrawlerConfig>> {
    return this.get<CrawlerConfig>('/crawler/config');
  }

  async testCrawlProject(projectId: number, save: boolean = false): Promise<ApiResponse<ProjectData>> {
    const query = save ? '?save=true' : '';
    return this.get<ProjectData>(`/crawler/test/${projectId}${query}`);
  }

  // 项目数据API
  async getProjects(params: ProjectQueryParams = {}): Promise<ApiResponse<PaginatedResponse<ProjectIndex>>> {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });

    const queryString = query.toString();
    const endpoint = queryString ? `/projects?${queryString}` : '/projects';
    
    return this.get<PaginatedResponse<ProjectIndex>>(endpoint);
  }

  async getProject(projectId: number): Promise<ApiResponse<ProjectVersion>> {
    return this.get<ProjectVersion>(`/projects/${projectId}`);
  }

  async getProjectVersions(
    projectId: number,
    page: number = 1,
    limit: number = 20,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<PaginatedResponse<ProjectVersion>>> {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);

    return this.get<PaginatedResponse<ProjectVersion>>(`/projects/${projectId}/versions?${query}`);
  }

  async getCategories(): Promise<ApiResponse<string[]>> {
    return this.get<string[]>('/projects/categories');
  }

  async searchProjects(params: SearchParams): Promise<ApiResponse<ProjectIndex[]>> {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });

    return this.get<ProjectIndex[]>(`/projects/search?${query}`);
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// 创建默认API客户端实例
export const apiClient = new ApiClient();

// 导出API方法的简化版本
export const api = {
  // 系统管理
  getSystemStatus: () => apiClient.getSystemStatus(),
  getHealthCheck: () => apiClient.getHealthCheck(),
  getSystemStats: () => apiClient.getSystemStats(),
  cleanupData: (days: number) => apiClient.cleanupData(days),

  // 爬虫控制
  controlCrawler: (request: CrawlControlRequest) => apiClient.controlCrawler(request),
  getCurrentTask: () => apiClient.getCurrentTask(),
  getCrawlerConfig: () => apiClient.getCrawlerConfig(),
  testCrawlProject: (id: number, save?: boolean) => apiClient.testCrawlProject(id, save),

  // 项目数据
  getProjects: (params?: ProjectQueryParams) => apiClient.getProjects(params),
  getProject: (id: number) => apiClient.getProject(id),
  getProjectVersions: (id: number, page?: number, limit?: number, startDate?: string, endDate?: string) => 
    apiClient.getProjectVersions(id, page, limit, startDate, endDate),
  getCategories: () => apiClient.getCategories(),
  searchProjects: (params: SearchParams) => apiClient.searchProjects(params),

  // 工具方法
  setBaseUrl: (url: string) => apiClient.setBaseUrl(url),
  testConnection: () => apiClient.testConnection(),
};
