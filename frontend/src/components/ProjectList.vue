<template>
  <div class="project-list">
    <div class="list-header">
      <h3>项目列表</h3>
      <div class="header-actions">
        <button 
          class="btn btn-primary"
          @click="refreshList"
          :disabled="loading"
        >
          {{ loading ? '刷新中...' : '刷新' }}
        </button>
      </div>
    </div>

    <!-- 搜索和过滤 -->
    <div class="filters">
      <div class="filter-row">
        <div class="filter-group">
          <input
            v-model="filters.keyword"
            type="text"
            class="form-control"
            placeholder="搜索项目ID或名称..."
            @input="debouncedSearch"
          />
        </div>
        <div class="filter-group">
          <select v-model="filters.category" class="form-control" @change="applyFilters">
            <option value="">所有分类</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <select v-model="filters.status" class="form-control" @change="applyFilters">
            <option value="">所有状态</option>
            <option value="众筹中">众筹中</option>
            <option value="成功">成功</option>
            <option value="失败">失败</option>
            <option value="准备中">准备中</option>
          </select>
        </div>
        <div class="filter-group">
          <select v-model="filters.sort_by" class="form-control" @change="applyFilters">
            <option value="last_crawl_time">最后爬取时间</option>
            <option value="first_crawl_time">首次爬取时间</option>
            <option value="name">项目名称</option>
            <option value="category">分类</option>
            <option value="status">状态</option>
          </select>
        </div>
        <div class="filter-group">
          <select v-model="filters.sort_order" class="form-control" @change="applyFilters">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- 项目表格 -->
    <div class="table-container">
      <table class="project-table">
        <thead>
          <tr>
            <th>项目ID</th>
            <th>项目名称</th>
            <th>分类</th>
            <th>状态</th>
            <th>版本数</th>
            <th>首次爬取</th>
            <th>最后爬取</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && projects.length === 0">
            <td colspan="8" class="loading-cell">加载中...</td>
          </tr>
          <tr v-else-if="projects.length === 0">
            <td colspan="8" class="empty-cell">暂无数据</td>
          </tr>
          <tr v-else v-for="project in projects" :key="project.project_id">
            <td>{{ project.project_id }}</td>
            <td class="project-name">
              <span :title="project.name">{{ project.name }}</span>
            </td>
            <td>{{ project.category }}</td>
            <td>
              <span 
                class="status-badge"
                :style="{ backgroundColor: getStatusColor(project.status) }"
              >
                {{ project.status }}
              </span>
            </td>
            <td>{{ project.version_count }}</td>
            <td>{{ formatDateTime(project.first_crawl_time) }}</td>
            <td>{{ formatDateTime(project.last_crawl_time) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-sm btn-primary"
                  @click="viewProject(project.project_id)"
                >
                  查看详情
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="pagination.total > 0" class="pagination">
      <div class="pagination-info">
        共 {{ pagination.total }} 条记录，第 {{ pagination.page }} / {{ pagination.total_pages }} 页
      </div>
      <div class="pagination-controls">
        <button 
          class="btn btn-sm"
          @click="goToPage(1)"
          :disabled="pagination.page === 1 || loading"
        >
          首页
        </button>
        <button 
          class="btn btn-sm"
          @click="goToPage(pagination.page - 1)"
          :disabled="pagination.page === 1 || loading"
        >
          上一页
        </button>
        <span class="page-input">
          <input
            v-model.number="pageInput"
            type="number"
            :min="1"
            :max="pagination.total_pages"
            @keyup.enter="goToPage(pageInput)"
          />
        </span>
        <button 
          class="btn btn-sm"
          @click="goToPage(pagination.page + 1)"
          :disabled="pagination.page === pagination.total_pages || loading"
        >
          下一页
        </button>
        <button 
          class="btn btn-sm"
          @click="goToPage(pagination.total_pages)"
          :disabled="pagination.page === pagination.total_pages || loading"
        >
          末页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { api } from '../services/api';
import { config } from '../services/config';
import { formatDateTime, getStatusColor, debounce } from '../utils';
import type { ProjectIndex, ProjectQueryParams } from '../types';

// 事件定义
const emit = defineEmits<{
  viewProject: [projectId: number];
}>();

// 响应式数据
const loading = ref(false);
const error = ref<string | null>(null);
const projects = ref<ProjectIndex[]>([]);
const categories = ref<string[]>([]);
const pageInput = ref(1);

const filters = reactive<ProjectQueryParams>({
  page: 1,
  limit: config.defaultPageSize,
  keyword: '',
  category: '',
  status: undefined,
  sort_by: 'last_crawl_time',
  sort_order: 'desc',
});

const pagination = reactive({
  total: 0,
  page: 1,
  limit: config.defaultPageSize,
  total_pages: 0,
});

// 防抖搜索
const debouncedSearch = debounce(() => {
  filters.page = 1;
  applyFilters();
}, 500);

// 方法
const loadProjects = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.getProjects(filters);
    
    if (response.success && response.data) {
      projects.value = response.data.items;
      Object.assign(pagination, response.data);
      pageInput.value = pagination.page;
    } else {
      error.value = response.message || '获取项目列表失败';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取项目列表失败';
    console.error('获取项目列表失败:', err);
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const response = await api.getCategories();
    if (response.success && response.data) {
      categories.value = response.data;
    }
  } catch (err) {
    console.error('获取分类列表失败:', err);
  }
};

const applyFilters = () => {
  filters.page = 1;
  loadProjects();
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= pagination.total_pages) {
    filters.page = page;
    loadProjects();
  }
};

const refreshList = () => {
  loadProjects();
};

const viewProject = (projectId: number) => {
  emit('viewProject', projectId);
};

// 生命周期
onMounted(() => {
  loadCategories();
  loadProjects();
});
</script>

<style scoped>
.project-list {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.list-header h3 {
  margin: 0;
  color: #333;
}

.filters {
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 150px;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.error-message {
  padding: 12px 16px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  color: #ff4d4f;
  margin-bottom: 16px;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 24px;
}

.project-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.project-table th,
.project-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.project-table th {
  background-color: #fafafa;
  font-weight: 600;
  color: #333;
}

.project-name {
  max-width: 200px;
}

.project-name span {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.loading-cell,
.empty-cell {
  text-align: center;
  color: #666;
  font-style: italic;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-info {
  color: #666;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-input input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  text-align: center;
}

.btn {
  padding: 6px 12px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-primary {
  background-color: #1890ff;
  border-color: #1890ff;
  color: white;
}

.btn-secondary {
  background-color: white;
  border-color: #d9d9d9;
  color: #333;
}

.btn:hover:not(:disabled) {
  opacity: 0.8;
}
</style>
