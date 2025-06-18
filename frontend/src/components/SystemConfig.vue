<template>
  <div class="system-config">
    <div class="config-header">
      <h3>系统配置</h3>
      <button 
        class="btn btn-secondary"
        @click="resetToDefault"
        :disabled="loading"
      >
        重置默认
      </button>
    </div>

    <div class="config-form">
      <div class="form-group">
        <label for="apiBaseUrl">后端服务地址</label>
        <div class="input-group">
          <input
            id="apiBaseUrl"
            v-model="formData.apiBaseUrl"
            type="url"
            class="form-control"
            placeholder="http://localhost:3000"
            :disabled="loading"
          />
          <button 
            class="btn btn-primary"
            @click="testConnection"
            :disabled="loading || !formData.apiBaseUrl"
          >
            {{ loading ? '测试中...' : '测试连接' }}
          </button>
        </div>
        <div v-if="connectionStatus" class="connection-status" :class="connectionStatus.type">
          {{ connectionStatus.message }}
        </div>
      </div>

      <div class="form-group">
        <label for="defaultPageSize">默认分页大小</label>
        <select
          id="defaultPageSize"
          v-model.number="formData.defaultPageSize"
          class="form-control"
          :disabled="loading"
        >
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>

      <div class="form-group">
        <label for="refreshInterval">自动刷新间隔 (秒)</label>
        <input
          id="refreshInterval"
          v-model.number="formData.refreshInterval"
          type="number"
          min="1"
          max="300"
          class="form-control"
          :disabled="loading"
        />
      </div>

      <div class="form-actions">
        <button 
          class="btn btn-primary"
          @click="saveConfig"
          :disabled="loading || !hasChanges"
        >
          保存配置
        </button>
        <button 
          class="btn btn-secondary"
          @click="cancelChanges"
          :disabled="loading || !hasChanges"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { config } from '../services/config';
import { isValidUrl } from '../utils';
import type { AppConfig } from '../types';

// 响应式数据
const loading = ref(false);
const originalConfig = ref<AppConfig | null>(null);
const formData = reactive<AppConfig>({
  apiBaseUrl: '',
  defaultPageSize: 20,
  refreshInterval: 5000,
});

const connectionStatus = ref<{
  type: 'success' | 'error';
  message: string;
} | null>(null);

// 计算属性
const hasChanges = computed(() => {
  if (!originalConfig.value) return false;
  
  return (
    formData.apiBaseUrl !== originalConfig.value.apiBaseUrl ||
    formData.defaultPageSize !== originalConfig.value.defaultPageSize ||
    formData.refreshInterval !== originalConfig.value.refreshInterval
  );
});

// 方法
const loadConfig = () => {
  const currentConfig = config.get();
  originalConfig.value = { ...currentConfig };
  Object.assign(formData, {
    ...currentConfig,
    refreshInterval: currentConfig.refreshInterval / 1000, // 转换为秒
  });
};

const testConnection = async () => {
  if (!formData.apiBaseUrl || !isValidUrl(formData.apiBaseUrl)) {
    connectionStatus.value = {
      type: 'error',
      message: '请输入有效的URL地址'
    };
    return;
  }

  loading.value = true;
  connectionStatus.value = null;

  try {
    // 临时设置API地址进行测试
    const originalUrl = config.apiBaseUrl;
    config.setApiBaseUrl(formData.apiBaseUrl);
    
    const isConnected = await config.validateConnection();
    
    if (isConnected) {
      connectionStatus.value = {
        type: 'success',
        message: '连接成功！'
      };
    } else {
      connectionStatus.value = {
        type: 'error',
        message: '连接失败，请检查地址是否正确'
      };
      // 恢复原来的URL
      config.setApiBaseUrl(originalUrl);
    }
  } catch (error) {
    connectionStatus.value = {
      type: 'error',
      message: '连接测试失败'
    };
  } finally {
    loading.value = false;
  }
};

const saveConfig = async () => {
  if (!isValidUrl(formData.apiBaseUrl)) {
    connectionStatus.value = {
      type: 'error',
      message: '请输入有效的URL地址'
    };
    return;
  }

  loading.value = true;

  try {
    config.update({
      apiBaseUrl: formData.apiBaseUrl,
      defaultPageSize: formData.defaultPageSize,
      refreshInterval: formData.refreshInterval * 1000, // 转换为毫秒
    });

    originalConfig.value = { ...config.get() };
    connectionStatus.value = {
      type: 'success',
      message: '配置保存成功！'
    };
  } catch (error) {
    connectionStatus.value = {
      type: 'error',
      message: '保存配置失败'
    };
  } finally {
    loading.value = false;
  }
};

const cancelChanges = () => {
  if (originalConfig.value) {
    Object.assign(formData, {
      ...originalConfig.value,
      refreshInterval: originalConfig.value.refreshInterval / 1000,
    });
  }
  connectionStatus.value = null;
};

const resetToDefault = () => {
  config.reset();
  loadConfig();
  connectionStatus.value = {
    type: 'success',
    message: '已重置为默认配置'
  };
};

// 生命周期
onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.system-config {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.config-header h3 {
  margin: 0;
  color: #333;
}

.config-form {
  max-width: 600px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
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

.input-group {
  display: flex;
  gap: 8px;
}

.input-group .form-control {
  flex: 1;
}

.connection-status {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.connection-status.success {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.connection-status.error {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
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
