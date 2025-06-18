// API响应基础类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 系统状态类型
export interface SystemStatus {
  is_running: boolean;
  current_task: CrawlTask | null;
  total_projects: number;
  total_versions: number;
  last_crawl_time: string | null;
  storage_info: {
    data_dir: string;
    total_size: number;
    file_count: number;
  };
}

// 健康检查类型
export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  storage: {
    totalProjects: number;
    totalVersions: number;
    totalSize: number;
    fileCount: number;
  };
}

// 统计信息类型
export interface SystemStats {
  total_projects: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
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

// 爬虫任务类型
export interface CrawlTask {
  id: string;
  start_id?: number;
  end_id?: number;
  target_ids?: number[];
  delay: number;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
}

// 爬虫配置类型
export interface CrawlerConfig {
  default_delay: number;
  min_delay: number;
  max_delay: number;
  concurrency: number;
  max_retries: number;
  timeout: number;
}

// 爬虫控制请求类型
export interface CrawlControlRequest {
  action: 'start' | 'stop' | 'pause' | 'resume';
  config?: {
    start_id?: number;
    end_id?: number;
    target_ids?: number[];
    delay?: number;
  };
}

// 项目状态枚举
export type ProjectStatus = '众筹中' | '成功' | '失败' | '准备中';

// 回报档位类型
export interface RewardTier {
  id: number;
  title: string;
  price: number; // 价格（数字格式）
  original_price_str: string; // 原始价格字符串
  content: string;
  backer_count: number; // 支持人数
  max_total: number; // 最大支持数量，0表示无限制
  remaining_count: number; // 剩余数量
  is_limited: boolean; // 是否限量
  status: number; // 档位状态
  reward_day: string; // 发货时间
  if_show: number; // 是否显示
}

// 项目数据类型
export interface ProjectData {
  id: number;
  name: string;
  short_title: string;
  category: string;
  user_id: number;
  create_time: string;
  start_time: string;
  end_time: string;
  online_time: string;
  goal_amount: number;
  raised_amount: number;
  backer_count: number;
  completion_rate: number;
  status: ProjectStatus;
  comment_count: number;
  favor_count: number;
  subscribe_count: number;
  reward_tiers_count: number;
  reward_tiers: RewardTier[]; // 详细的回报档位信息
  description: string;
  logo: string;
  video: string;
  location: {
    province: string;
    city: string;
  };
}

// 项目索引类型
export interface ProjectIndex {
  project_id: number;
  name: string;
  category: string;
  status: ProjectStatus;
  first_crawl_time: string;
  last_crawl_time: string;
  version_count: number;
  file_path: string;
}

// 项目版本类型
export interface ProjectVersion {
  project_id: number;
  version: number;
  crawl_time: string;
  data: ProjectData;
}

// 项目查询参数类型
export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  sort_by?: 'name' | 'category' | 'status' | 'first_crawl_time' | 'last_crawl_time';
  sort_order?: 'asc' | 'desc';
  keyword?: string;
}

// 搜索参数类型
export interface SearchParams {
  keyword: string;
  category?: string;
  status?: ProjectStatus;
}
