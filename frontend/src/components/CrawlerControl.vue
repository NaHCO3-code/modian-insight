<template>
  <div class="crawler-control">
    <div class="control-header">
      <h3>爬虫控制</h3>
      <div class="control-actions">
        <button 
          class="btn btn-success"
          @click="startCrawler"
          :disabled="loading || isRunning"
        >
          启动
        </button>
        <button 
          class="btn btn-warning"
          @click="pauseCrawler"
          :disabled="loading || !isRunning || isPaused"
        >
          暂停
        </button>
        <button 
          class="btn btn-primary"
          @click="resumeCrawler"
          :disabled="loading || !isPaused"
        >
          恢复
        </button>
        <button 
          class="btn btn-danger"
          @click="stopCrawler"
          :disabled="loading || !isRunning"
        >
          停止
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <!-- 爬取配置 -->
    <div class="config-section">
      <h4>爬取配置</h4>
      <div class="config-form">
        <div class="form-row">
          <div class="form-group">
            <label>
              <input 
                type="radio" 
                v-model="crawlMode" 
                value="range"
                :disabled="loading || isRunning"
              />
              ID范围爬取
            </label>
          </div>
          <div class="form-group">
            <label>
              <input 
                type="radio" 
                v-model="crawlMode" 
                value="specific"
                :disabled="loading || isRunning"
              />
              指定ID爬取
            </label>
          </div>
        </div>

        <div v-if="crawlMode === 'range'" class="range-config">
          <div class="form-row">
            <div class="form-group">
              <label for="startId">起始ID</label>
              <input
                id="startId"
                v-model.number="config.start_id"
                type="number"
                class="form-control"
                placeholder="100000"
                :disabled="loading || isRunning"
              />
            </div>
            <div class="form-group">
              <label for="endId">结束ID</label>
              <input
                id="endId"
                v-model.number="config.end_id"
                type="number"
                class="form-control"
                placeholder="100100"
                :disabled="loading || isRunning"
              />
            </div>
          </div>
        </div>

        <div v-if="crawlMode === 'specific'" class="specific-config">
          <div class="form-group">
            <label for="targetIds">目标ID列表 (用逗号分隔)</label>
            <textarea
              id="targetIds"
              v-model="targetIdsText"
              class="form-control"
              placeholder="114514, 123456, 789012"
              rows="3"
              :disabled="loading || isRunning"
            ></textarea>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="delay">延迟时间 (毫秒)</label>
            <input
              id="delay"
              v-model.number="config.delay"
              type="number"
              class="form-control"
              :min="crawlerConfig?.min_delay || 500"
              :max="crawlerConfig?.max_delay || 5000"
              :disabled="loading || isRunning"
            />
            <div class="form-help">
              建议范围: {{ crawlerConfig?.min_delay || 500 }} - {{ crawlerConfig?.max_delay || 5000 }}ms
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 当前任务信息 -->
    <div v-if="currentTask" class="task-section">
      <h4>当前任务</h4>
      <div class="task-info">
        <div class="task-item">
          <span class="task-label">任务ID:</span>
          <span class="task-value">{{ currentTask.id }}</span>
        </div>
        <div class="task-item">
          <span class="task-label">状态:</span>
          <span class="task-value" :style="{ color: getTaskStatusColor(currentTask.status) }">
            {{ getTaskStatusText(currentTask.status) }}
          </span>
        </div>
        <div class="task-item">
          <span class="task-label">进度:</span>
          <span class="task-value">
            {{ currentTask.progress.completed }} / {{ currentTask.progress.total }}
            (失败: {{ currentTask.progress.failed }})
          </span>
        </div>
        <div v-if="currentTask.start_id" class="task-item">
          <span class="task-label">ID范围:</span>
          <span class="task-value">{{ currentTask.start_id }} - {{ currentTask.end_id }}</span>
        </div>
        <div v-if="currentTask.target_ids" class="task-item">
          <span class="task-label">目标ID:</span>
          <span class="task-value">{{ currentTask.target_ids.join(', ') }}</span>
        </div>
        <div class="task-item">
          <span class="task-label">延迟:</span>
          <span class="task-value">{{ currentTask.delay }}ms</span>
        </div>
        <div class="task-item">
          <span class="task-label">创建时间:</span>
          <span class="task-value">{{ formatDateTime(currentTask.created_at) }}</span>
        </div>
        <div v-if="currentTask.started_at" class="task-item">
          <span class="task-label">开始时间:</span>
          <span class="task-value">{{ formatDateTime(currentTask.started_at) }}</span>
        </div>
      </div>
    </div>

    <!-- 测试单个项目 -->
    <div class="test-section">
      <h4>测试爬取</h4>
      <div class="test-form">
        <div class="form-row">
          <div class="form-group">
            <label for="testProjectId">项目ID</label>
            <input
              id="testProjectId"
              v-model.number="testProjectId"
              type="number"
              class="form-control"
              placeholder="114514"
              :disabled="loading"
            />
          </div>
          <div class="form-group">
            <label>
              <input 
                type="checkbox" 
                v-model="saveTestData"
                :disabled="loading"
              />
              保存测试数据
            </label>
          </div>
        </div>
        <button 
          class="btn btn-primary"
          @click="testCrawl"
          :disabled="loading || !testProjectId"
        >
          {{ loading ? '测试中...' : '测试爬取' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { api } from '../services/api';
import { formatDateTime, getTaskStatusColor } from '../utils';
import type { CrawlTask, CrawlerConfig } from '../types';

// 响应式数据
const loading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const currentTask = ref<CrawlTask | null>(null);
const crawlerConfig = ref<CrawlerConfig | null>(null);

const crawlMode = ref<'range' | 'specific'>('range');
const targetIdsText = ref('');
const testProjectId = ref<number | null>(null);
const saveTestData = ref(false);

const config = reactive({
  start_id: 100000,
  end_id: 100100,
  delay: 1000,
});

// 计算属性
const isRunning = computed(() => currentTask.value?.status === 'running');
const isPaused = computed(() => currentTask.value?.status === 'paused');

// 方法
const clearMessages = () => {
  error.value = null;
  successMessage.value = null;
};

const showError = (message: string) => {
  error.value = message;
  successMessage.value = null;
};

const showSuccess = (message: string) => {
  successMessage.value = message;
  error.value = null;
};

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

const parseTargetIds = (): number[] => {
  return targetIdsText.value
    .split(',')
    .map(id => parseInt(id.trim()))
    .filter(id => !isNaN(id));
};

const startCrawler = async () => {
  clearMessages();
  
  if (crawlMode.value === 'range') {
    if (!config.start_id || !config.end_id || config.start_id >= config.end_id) {
      showError('请输入有效的ID范围');
      return;
    }
  } else {
    const targetIds = parseTargetIds();
    if (targetIds.length === 0) {
      showError('请输入有效的目标ID列表');
      return;
    }
  }

  loading.value = true;

  try {
    const request = {
      action: 'start' as const,
      config: {
        delay: config.delay,
        ...(crawlMode.value === 'range' 
          ? { start_id: config.start_id, end_id: config.end_id }
          : { target_ids: parseTargetIds() }
        )
      }
    };

    const response = await api.controlCrawler(request);
    
    if (response.success) {
      showSuccess('爬虫启动成功');
      await refreshCurrentTask();
    } else {
      showError(response.message || '启动失败');
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : '启动失败');
  } finally {
    loading.value = false;
  }
};

const pauseCrawler = async () => {
  await controlCrawler('pause', '爬虫暂停成功');
};

const resumeCrawler = async () => {
  await controlCrawler('resume', '爬虫恢复成功');
};

const stopCrawler = async () => {
  await controlCrawler('stop', '爬虫停止成功');
};

const controlCrawler = async (action: 'pause' | 'resume' | 'stop', successMsg: string) => {
  clearMessages();
  loading.value = true;

  try {
    const response = await api.controlCrawler({ action });
    
    if (response.success) {
      showSuccess(successMsg);
      await refreshCurrentTask();
    } else {
      showError(response.message || '操作失败');
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : '操作失败');
  } finally {
    loading.value = false;
  }
};

const testCrawl = async () => {
  if (!testProjectId.value) {
    showError('请输入项目ID');
    return;
  }

  clearMessages();
  loading.value = true;

  try {
    const response = await api.testCrawlProject(testProjectId.value, saveTestData.value);
    
    if (response.success) {
      showSuccess(`测试爬取成功: ${response.data?.name || '未知项目'}`);
    } else {
      showError(response.message || '测试失败');
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : '测试失败');
  } finally {
    loading.value = false;
  }
};

const refreshCurrentTask = async () => {
  try {
    const response = await api.getCurrentTask();
    if (response.success && response.data) {
      currentTask.value = response.data;
    }
  } catch (err) {
    console.error('获取当前任务失败:', err);
  }
};

const loadCrawlerConfig = async () => {
  try {
    const response = await api.getCrawlerConfig();
    if (response.success && response.data) {
      crawlerConfig.value = response.data;
      config.delay = response.data.default_delay;
    }
  } catch (err) {
    console.error('获取爬虫配置失败:', err);
  }
};

// 生命周期
onMounted(() => {
  loadCrawlerConfig();
  refreshCurrentTask();
});
</script>

<style scoped>
.crawler-control {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.control-header h3 {
  margin: 0;
  color: #333;
}

.control-actions {
  display: flex;
  gap: 8px;
}

.error-message, .success-message {
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.error-message {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.success-message {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.config-section, .task-section, .test-section {
  margin-bottom: 32px;
}

.config-section h4, .task-section h4, .test-section h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333;
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

.form-control:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-help {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.task-info {
  background: #fafafa;
  border-radius: 6px;
  padding: 16px;
  border: 1px solid #e8e8e8;
}

.task-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-item:last-child {
  margin-bottom: 0;
}

.task-label {
  color: #666;
  font-weight: 500;
}

.task-value {
  color: #333;
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

.btn-success {
  background-color: #52c41a;
  border-color: #52c41a;
  color: white;
}

.btn-warning {
  background-color: #faad14;
  border-color: #faad14;
  color: white;
}

.btn-danger {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

.btn:hover:not(:disabled) {
  opacity: 0.8;
}
</style>
