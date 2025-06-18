<template>
  <div class="project-versions">
    <div class="versions-header">
      <div class="header-title">
        <h3>项目版本历史</h3>
        <div v-if="selectedVersion" class="project-info">
          <span class="project-id">ID: {{ selectedVersion.project_id }}</span>
          <span class="project-name">{{ selectedVersion.data.name }}</span>
        </div>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-secondary"
          @click="$emit('close')"
        >
          返回
        </button>
        <button
          class="btn btn-primary"
          @click="refreshVersions"
          :disabled="loading"
        >
          {{ loading ? '刷新中...' : '刷新' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else class="versions-content">
      <!-- 版本列表 -->
      <div class="versions-list">
        <div v-if="loading && versions.length === 0" class="loading-message">
          加载中...
        </div>
        <div v-else-if="versions.length === 0" class="empty-message">
          暂无版本数据
        </div>
        <div v-else>
          <div 
            v-for="(version, index) in versions" 
            :key="`${version.project_id}-${version.version}`"
            class="version-item"
            :class="{ 'selected': selectedVersion?.version === version.version }"
            @click="selectVersion(version)"
          >
            <div class="version-header">
              <div class="version-info">
                <span class="version-number">版本 {{ version.version }}</span>
                <span class="version-time">{{ formatDateTime(version.crawl_time) }}</span>
              </div>
              <div class="version-changes">
                <span v-if="index < versions.length - 1" class="change-indicator">
                  {{ getChangeIndicator(version, versions[index + 1]) }}
                </span>
              </div>
            </div>
            <div class="version-summary">
              <div class="summary-item">
                <span class="summary-label">筹款:</span>
                <span class="summary-value">{{ formatCurrency(version.data.raised_amount) }}</span>
                <span v-if="index < versions.length - 1" class="summary-change" :class="getChangeClass('raised_amount', version, versions[index + 1])">
                  {{ getChangeText('raised_amount', version, versions[index + 1]) }}
                </span>
              </div>
              <div class="summary-item">
                <span class="summary-label">支持者:</span>
                <span class="summary-value">{{ formatNumber(version.data.backer_count) }}</span>
                <span v-if="index < versions.length - 1" class="summary-change" :class="getChangeClass('backer_count', version, versions[index + 1])">
                  {{ getChangeText('backer_count', version, versions[index + 1]) }}
                </span>
              </div>
              <div class="summary-item">
                <span class="summary-label">完成率:</span>
                <span class="summary-value">{{ formatPercentage(version.data.completion_rate) }}</span>
                <span v-if="index < versions.length - 1" class="summary-change" :class="getChangeClass('completion_rate', version, versions[index + 1])">
                  {{ getChangeText('completion_rate', version, versions[index + 1]) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 版本详情 -->
      <div v-if="selectedVersion" class="version-detail">
        <h4>版本 {{ selectedVersion.version }} 详情</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">爬取时间:</span>
            <span class="detail-value">{{ formatDateTime(selectedVersion.crawl_time) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">项目状态:</span>
            <span 
              class="detail-value status-badge"
              :style="{ backgroundColor: getStatusColor(selectedVersion.data.status) }"
            >
              {{ selectedVersion.data.status }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">目标金额:</span>
            <span class="detail-value">{{ formatCurrency(selectedVersion.data.goal_amount) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">已筹金额:</span>
            <span class="detail-value">{{ formatCurrency(selectedVersion.data.raised_amount) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">支持人数:</span>
            <span class="detail-value">{{ formatNumber(selectedVersion.data.backer_count) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">完成率:</span>
            <span class="detail-value">{{ formatPercentage(selectedVersion.data.completion_rate) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">评论数:</span>
            <span class="detail-value">{{ formatNumber(selectedVersion.data.comment_count) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">点赞数:</span>
            <span class="detail-value">{{ formatNumber(selectedVersion.data.favor_count) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">关注数:</span>
            <span class="detail-value">{{ formatNumber(selectedVersion.data.subscribe_count) }}</span>
          </div>
        </div>

        <!-- 回报档位信息 -->
        <div v-if="selectedVersion.data.reward_tiers && selectedVersion.data.reward_tiers.length > 0" class="reward-tiers-section">
          <h5>回报档位 ({{ selectedVersion.data.reward_tiers.length }}个)</h5>
          <div class="reward-tiers-list">
            <div
              v-for="tier in selectedVersion.data.reward_tiers"
              :key="tier.id"
              class="reward-tier-item"
            >
              <div class="tier-header">
                <span class="tier-title">{{ tier.title }}</span>
                <span class="tier-price">¥{{ formatNumber(tier.price) }}</span>
              </div>
              <div class="tier-stats">
                <div class="tier-stat">
                  <span class="stat-label">支持人数:</span>
                  <span class="stat-value">{{ formatNumber(tier.backer_count) }}</span>
                </div>
                <div v-if="tier.is_limited" class="tier-stat">
                  <span class="stat-label">剩余数量:</span>
                  <span class="stat-value">{{ formatNumber(tier.remaining_count) }}</span>
                </div>
                <div v-if="tier.is_limited" class="tier-stat">
                  <span class="stat-label">总数量:</span>
                  <span class="stat-value">{{ formatNumber(tier.max_total) }}</span>
                </div>
                <div v-if="tier.reward_day" class="tier-stat">
                  <span class="stat-label">发货时间:</span>
                  <span class="stat-value">{{ tier.reward_day }}</span>
                </div>
              </div>
              <div v-if="tier.content" class="tier-content">
                {{ tier.content }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.total > 0" class="pagination">
        <div class="pagination-info">
          共 {{ pagination.total }} 个版本，第 {{ pagination.page }} / {{ pagination.total_pages }} 页
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { api } from '../services/api';
import { config } from '../services/config';
import { formatDateTime, formatCurrency, formatNumber, formatPercentage, getStatusColor } from '../utils';
import type { ProjectVersion } from '../types';

// Props
const props = defineProps<{
  projectId: number | null;
}>();

// 事件定义
defineEmits<{
  close: [];
}>();

// 响应式数据
const loading = ref(false);
const error = ref<string | null>(null);
const versions = ref<ProjectVersion[]>([]);
const selectedVersion = ref<ProjectVersion | null>(null);

const pagination = reactive({
  total: 0,
  page: 1,
  limit: config.defaultPageSize,
  total_pages: 0,
});

// 方法
const loadVersions = async () => {
  if (!props.projectId) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await api.getProjectVersions(
      props.projectId,
      pagination.page,
      pagination.limit
    );
    
    if (response.success && response.data) {
      versions.value = response.data.items;
      Object.assign(pagination, response.data);
      
      // 默认选择第一个版本
      if (versions.value.length > 0 && !selectedVersion.value) {
        selectedVersion.value = versions.value[0];
      }
    } else {
      error.value = response.message || '获取版本历史失败';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取版本历史失败';
    console.error('获取版本历史失败:', err);
  } finally {
    loading.value = false;
  }
};

const selectVersion = (version: ProjectVersion) => {
  selectedVersion.value = version;
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= pagination.total_pages) {
    pagination.page = page;
    loadVersions();
  }
};

const refreshVersions = () => {
  loadVersions();
};

const getChangeIndicator = (current: ProjectVersion, previous: ProjectVersion): string => {
  const raisedChange = current.data.raised_amount - previous.data.raised_amount;
  const backerChange = current.data.backer_count - previous.data.backer_count;
  
  if (raisedChange > 0 || backerChange > 0) {
    return '📈';
  } else if (raisedChange < 0 || backerChange < 0) {
    return '📉';
  } else {
    return '➖';
  }
};

const getChangeText = (field: string, current: ProjectVersion, previous: ProjectVersion): string => {
  const currentValue = (current.data as any)[field];
  const previousValue = (previous.data as any)[field];
  const change = currentValue - previousValue;
  
  if (change === 0) return '';
  
  const sign = change > 0 ? '+' : '';
  
  if (field === 'raised_amount') {
    return `${sign}${formatCurrency(Math.abs(change))}`;
  } else if (field === 'completion_rate') {
    return `${sign}${change.toFixed(1)}%`;
  } else {
    return `${sign}${change}`;
  }
};

const getChangeClass = (field: string, current: ProjectVersion, previous: ProjectVersion): string => {
  const currentValue = (current.data as any)[field];
  const previousValue = (previous.data as any)[field];
  const change = currentValue - previousValue;
  
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
};

// 监听项目ID变化
watch(() => props.projectId, (newId) => {
  if (newId) {
    pagination.page = 1;
    selectedVersion.value = null;
    loadVersions();
  } else {
    versions.value = [];
    selectedVersion.value = null;
  }
}, { immediate: true });
</script>

<style scoped>
.project-versions {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.versions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.versions-header h3 {
  margin: 0;
  color: #333;
}

.project-info {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.project-id {
  font-weight: 500;
  color: #1890ff;
}

.project-name {
  font-weight: 500;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.error-message, .loading-message, .empty-message {
  padding: 16px;
  text-align: center;
  border-radius: 4px;
}

.error-message {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.loading-message, .empty-message {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.versions-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: 70vh;
}

.versions-list {
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.version-item {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  cursor: pointer;
  transition: background-color 0.3s;
}

.version-item:hover {
  background-color: #f5f5f5;
}

.version-item.selected {
  background-color: #e6f7ff;
  border-left: 4px solid #1890ff;
}

.version-item:last-child {
  border-bottom: none;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.version-number {
  font-weight: 600;
  color: #333;
}

.version-time {
  font-size: 12px;
  color: #666;
}

.change-indicator {
  font-size: 18px;
}

.version-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 12px;
  color: #666;
  min-width: 50px;
}

.summary-value {
  font-weight: 500;
  color: #333;
}

.summary-change {
  font-size: 12px;
  font-weight: 500;
}

.summary-change.positive {
  color: #52c41a;
}

.summary-change.negative {
  color: #ff4d4f;
}

.summary-change.neutral {
  color: #666;
}

.version-detail {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 16px;
  overflow-y: auto;
}

.version-detail h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.detail-value {
  color: #333;
  text-align: right;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

/* 回报档位样式 */
.reward-tiers-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.reward-tiers-section h5 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.reward-tiers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.reward-tier-item {
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background-color: #fafafa;
}

.tier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tier-title {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.tier-price {
  font-weight: 600;
  color: #1890ff;
  font-size: 14px;
}

.tier-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.tier-stat {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-label {
  color: #666;
}

.stat-value {
  color: #333;
  font-weight: 500;
}

.tier-content {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e8e8e8;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.pagination-info {
  color: #666;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  gap: 8px;
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

@media (max-width: 768px) {
  .versions-content {
    grid-template-columns: 1fr;
    height: auto;
  }

  .version-detail {
    max-height: 400px;
  }
}
</style>
