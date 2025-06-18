/**
 * API 相关类型定义
 */

// 通用API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 爬取控制请求
export interface CrawlControlRequest {
  action: 'start' | 'stop' | 'pause' | 'resume';
  config?: {
    start_id?: number;
    end_id?: number;
    target_ids?: number[];
    delay?: number;
  };
}

// 项目查询参数
export interface ProjectQueryParams extends PaginationParams {
  category?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: 'create_time' | 'raised_amount' | 'backer_count' | 'completion_rate';
  sort_order?: 'asc' | 'desc';
}

// 项目版本查询参数
export interface ProjectVersionQueryParams extends PaginationParams {
  project_id: number;
  start_date?: string;
  end_date?: string;
}

// 系统状态
export interface SystemStatus {
  is_running: boolean;
  current_task?: any;
  total_projects: number;
  total_versions: number;
  last_crawl_time?: string | undefined;
  storage_info: {
    data_dir: string;
    total_size: number;
    file_count: number;
  };
}

// 统计数据
export interface ProjectStats {
  total_projects: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  total_raised_amount: number;
  average_completion_rate: number;
  most_popular_categories: Array<{
    category: string;
    count: number;
  }>;
  recent_activity: Array<{
    date: string;
    new_projects: number;
    completed_projects: number;
  }>;
}
