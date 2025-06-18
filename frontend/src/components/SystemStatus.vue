<template>
  <div class="system-status">
    <div class="status-header">
      <h3>系统状态</h3>
      <button 
        class="btn btn-primary"
        @click="refreshStatus"
        :disabled="loading"
      >
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span>{{ error }}</span>
      </div>
      <button class="btn btn-secondary" @click="refreshStatus">重试</button>
    </div>

    <div v-else class="status-content">
      <!-- 系统概览 -->
      <div class="status-section">
        <h4>系统概览</h4>
        <div class="status-cards">
          <div class="status-card">
            <div class="card-icon" :style="{ color: systemStatus?.is_running ? '#52c41a' : '#ff4d4f' }">
              {{ systemStatus?.is_running ? '🟢' : '🔴' }}
            </div>
            <div class="card-content">
              <div class="card-title">爬虫状态</div>
              <div class="card-value">{{ systemStatus?.is_running ? '运行中' : '已停止' }}</div>
            </div>
          </div>

          <div class="status-card">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <div class="card-title">项目总数</div>
              <div class="card-value">{{ formatNumber(systemStatus?.total_projects || 0) }}</div>
            </div>
          </div>

          <div class="status-card">
            <div class="card-icon">📝</div>
            <div class="card-content">
              <div class="card-title">版本总数</div>
              <div class="card-value">{{ formatNumber(systemStatus?.total_versions || 0) }}</div>
            </div>
          </div>

          <div class="status-card">
            <div class="card-icon">💾</div>
            <div class="card-content">
              <div class="card-title">存储大小</div>
              <div class="card-value">{{ formatFileSize(systemStatus?.storage_info?.total_size || 0) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 当前任务 -->
      <div v-if="systemStatus?.current_task" class="status-section">
        <h4>当前任务</h4>
        <div class="task-info">
          <div class="task-header">
            <span class="task-id">{{ systemStatus.current_task.id }}</span>
            <span class="task-status" :style="{ color: getTaskStatusColor(systemStatus.current_task.status) }">
              {{ getTaskStatusText(systemStatus.current_task.status) }}
            </span>
          </div>
          <div class="task-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: `${getTaskProgress(systemStatus.current_task)}%` }"
              ></div>
            </div>
            <div class="progress-text">
              {{ systemStatus.current_task.progress.completed }} / {{ systemStatus.current_task.progress.total }}
              (失败: {{ systemStatus.current_task.progress.failed }})
            </div>
          </div>
          <div class="task-details">
            <div v-if="systemStatus.current_task.start_id">
              范围: {{ systemStatus.current_task.start_id }} - {{ systemStatus.current_task.end_id }}
            </div>
            <div v-if="systemStatus.current_task.target_ids">
              目标ID: {{ systemStatus.current_task.target_ids.join(', ') }}
            </div>
            <div>延迟: {{ systemStatus.current_task.delay }}ms</div>
            <div>创建时间: {{ formatDateTime(systemStatus.current_task.created_at) }}</div>
          </div>
        </div>
      </div>

      <!-- 健康检查 -->
      <div class="status-section">
        <h4>健康检查</h4>
        <div class="health-info">
          <div class="health-item">
            <span class="health-label">状态:</span>
            <span class="health-value" :style="{ color: healthCheck?.status === 'healthy' ? '#52c41a' : '#ff4d4f' }">
              {{ healthCheck?.status === 'healthy' ? '健康' : '异常' }}
            </span>
          </div>
          <div class="health-item">
            <span class="health-label">运行时间:</span>
            <span class="health-value">{{ formatDuration(healthCheck?.uptime || 0) }}</span>
          </div>
          <div class="health-item">
            <span class="health-label">内存使用:</span>
            <span class="health-value">{{ formatFileSize(healthCheck?.memory?.heapUsed || 0) }}</span>
          </div>
        </div>
      </div>

      <!-- 最后更新时间 -->
      <div class="last-update">
        最后更新: {{ lastUpdateTime ? formatDateTime(lastUpdateTime) : '未知' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { api } from '../services/api';
import { config } from '../services/config';
import { formatNumber, formatFileSize, formatDateTime, formatDuration, getTaskStatusColor } from '../utils';
import type { SystemStatus, HealthCheck } from '../types';

// 响应式数据
const loading = ref(false);
const error = ref<string | null>(null);
const systemStatus = ref<SystemStatus | null>(null);
const healthCheck = ref<HealthCheck | null>(null);
const lastUpdateTime = ref<string | null>(null);

let refreshTimer: number | null = null;

// 方法
const getTaskStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '等待中',
    'running': '运行中',
    'paused': '已暂停',
    'completed': '已完成',
    'failed': '失败'
  };
  return statusMap[status] || status;
};

const getTaskProgress = (task: any): number => {
  if (!task || task.progress.total === 0) return 0;
  return Math.round((task.progress.completed / task.progress.total) * 100);
};

const refreshStatus = async () => {
  loading.value = true;
  error.value = null;

  try {
    const [statusResponse, healthResponse] = await Promise.all([
      api.getSystemStatus(),
      api.getHealthCheck()
    ]);

    if (statusResponse.success) {
      systemStatus.value = statusResponse.data;
    }

    if (healthResponse.success) {
      healthCheck.value = healthResponse.data;
    }

    lastUpdateTime.value = new Date().toISOString();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取系统状态失败';
    console.error('获取系统状态失败:', err);
  } finally {
    loading.value = false;
  }
};

const startAutoRefresh = () => {
  refreshTimer = setInterval(refreshStatus, config.refreshInterval);
};

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

// 生命周期
onMounted(() => {
  refreshStatus();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.system-status {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.status-header h3 {
  margin: 0;
  color: #333;
}

.error-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  color: #ff4d4f;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-section {
  margin-bottom: 32px;
}

.status-section h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.card-icon {
  font-size: 24px;
  margin-right: 12px;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.card-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.task-info {
  background: #fafafa;
  border-radius: 6px;
  padding: 16px;
  border: 1px solid #e8e8e8;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-id {
  font-family: monospace;
  font-size: 14px;
  color: #666;
}

.task-status {
  font-weight: 600;
}

.task-progress {
  margin-bottom: 12px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background-color: #1890ff;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.task-details {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.health-info {
  background: #fafafa;
  border-radius: 6px;
  padding: 16px;
  border: 1px solid #e8e8e8;
}

.health-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.health-item:last-child {
  margin-bottom: 0;
}

.health-label {
  color: #666;
}

.health-value {
  font-weight: 500;
}

.last-update {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.btn {
  padding: 8px 16px;
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

.btn-primary {
  background-color: #1890ff;
  border-color: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.btn-secondary {
  background-color: white;
  border-color: #d9d9d9;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  border-color: #40a9ff;
  color: #1890ff;
}
</style>
