<script setup lang="ts">
import { ref } from 'vue';
import SystemConfig from './components/SystemConfig.vue';
import SystemStatus from './components/SystemStatus.vue';
import CrawlerControl from './components/CrawlerControl.vue';
import ProjectList from './components/ProjectList.vue';
import ProjectDetail from './components/ProjectDetail.vue';

// 响应式数据
const activeTab = ref('status');
const selectedProjectId = ref<number | null>(null);
const showProjectDetail = ref(false);

// 方法
const switchTab = (tab: string) => {
  activeTab.value = tab;
  // 切换标签时关闭项目详情
  closeProjectViews();
};

const viewProject = (projectId: number) => {
  selectedProjectId.value = projectId;
  showProjectDetail.value = true;
};

const closeProjectViews = () => {
  showProjectDetail.value = false;
  selectedProjectId.value = null;
};
</script>

<template>
  <div class="app">
    <!-- 头部 -->
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">Modian Insight</h1>
        <div class="header-info">
          <span class="version">v1.0.0</span>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="app-main">
      <!-- 侧边栏导航 -->
      <nav class="app-sidebar">
        <ul class="nav-menu">
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'status' }"
              @click="switchTab('status')"
            >
              <span class="nav-icon">📊</span>
              <span class="nav-text">系统状态</span>
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'crawler' }"
              @click="switchTab('crawler')"
            >
              <span class="nav-icon">🕷️</span>
              <span class="nav-text">爬虫控制</span>
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'projects' }"
              @click="switchTab('projects')"
            >
              <span class="nav-icon">📁</span>
              <span class="nav-text">项目数据</span>
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              :class="{ active: activeTab === 'config' }"
              @click="switchTab('config')"
            >
              <span class="nav-icon">⚙️</span>
              <span class="nav-text">系统配置</span>
            </button>
          </li>
        </ul>
      </nav>

      <!-- 内容区域 -->
      <div class="app-content">
        <!-- 项目详情视图 -->
        <ProjectDetail
          v-if="showProjectDetail"
          :project-id="selectedProjectId"
          @close="closeProjectViews"
        />

        <!-- 标签页内容 -->
        <div v-else class="tab-content">
          <!-- 系统状态 -->
          <SystemStatus v-if="activeTab === 'status'" />

          <!-- 爬虫控制 -->
          <CrawlerControl v-else-if="activeTab === 'crawler'" />

          <!-- 项目数据 -->
          <ProjectList
            v-else-if="activeTab === 'projects'"
            @view-project="viewProject"
          />

          <!-- 系统配置 -->
          <SystemConfig v-else-if="activeTab === 'config'" />
        </div>
      </div>
    </main>

    <!-- 底部 -->
    <footer class="app-footer">
      <div class="footer-content">
        <span>&copy; 2025 Modian Insight</span>
        <span>基于 Vue 3 + TypeScript + Vite 构建</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.version {
  background: #1890ff;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.app-main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  width: 100%;
}

.app-sidebar {
  background: white;
  border-radius: 8px;
  padding: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 100px;
}

.nav-menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin-bottom: 4px;
}

.nav-link {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: none;
  color: #666;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 0;
}

.nav-link:hover {
  background-color: #f5f5f5;
  color: #333;
}

.nav-link.active {
  background-color: #e6f7ff;
  color: #1890ff;
  border-right: 3px solid #1890ff;
}

.nav-icon {
  font-size: 18px;
  width: 20px;
  text-align: center;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
}

.app-content {
  min-height: 600px;
}

.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.app-footer {
  background: white;
  border-top: 1px solid #e8e8e8;
  margin-top: 24px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-main {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .app-sidebar {
    position: static;
    order: 2;
  }

  .nav-menu {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    padding: 0 16px;
  }

  .nav-item {
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .nav-link {
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    min-width: 80px;
    text-align: center;
  }

  .nav-icon {
    font-size: 16px;
  }

  .nav-text {
    font-size: 12px;
  }

  .header-content {
    padding: 12px 16px;
  }

  .app-title {
    font-size: 20px;
  }

  .footer-content {
    flex-direction: column;
    gap: 8px;
    text-align: center;
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 18px;
  }

  .header-info {
    gap: 8px;
  }

  .version {
    font-size: 10px;
    padding: 2px 6px;
  }
}
</style>
