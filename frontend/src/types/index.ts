// 导出所有类型定义
export * from './api';

// 应用配置类型
export interface AppConfig {
  apiBaseUrl: string;
  defaultPageSize: number;
  refreshInterval: number;
}

// 组件状态类型
export interface ComponentState {
  loading: boolean;
  error: string | null;
}

// 表格列配置类型
export interface TableColumn {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, record: any) => string;
}

// 表单字段类型
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  validation?: (value: any) => string | null;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// 路由类型
export interface Route {
  path: string;
  name: string;
  component: any;
  meta?: {
    title?: string;
    requiresAuth?: boolean;
  };
}
