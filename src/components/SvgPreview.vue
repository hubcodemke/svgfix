<template>
  <div class="svg-preview-container">
    <div class="preview-header-bar">
      <h3 class="preview-title">SVG批量预览</h3>
      <div class="preview-stats">
        <span>{{ files.length }} 个文件</span>
        <span v-if="selectedFile">• {{ selectedFile.name }}</span>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-if="files.length === 0" class="empty-preview">
      <p>选择或处理文件后查看预览</p>
    </div>
    
    <div v-else class="preview-wrapper">
      <!-- 标签页导航 -->
      <div class="preview-tabs">
        <div 
          v-for="file in files" 
          :key="file.id"
          class="preview-tab"
          :class="{ 'active': selectedFile?.id === file.id }"
          @click="selectFile(file)"
        >
          <span class="tab-name">{{ truncateFilename(file.name) }}</span>
          <span class="tab-status" :class="file.status">{{ getStatusText(file.status) }}</span>
        </div>
      </div>
      
      <!-- 预览内容 -->
      <div v-if="selectedFile" class="preview-content">
        <div class="preview-panels">
          <div class="preview-panel">
            <div class="panel-header">
              <h4>原始文件</h4>
              <div class="preview-actions">
                <button class="zoom-btn" @click="zoomOut('original')">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="16"
                    height="16"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>
                <span class="zoom-level">{{ Math.round(zoomLevels.original * 100) }}%</span>
                <button class="zoom-btn" @click="zoomIn('original')">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="16"
                    height="16"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>
                <button class="zoom-btn" @click="resetZoom('original')">
                  重置
                </button>
              </div>
            </div>
            <div class="preview-area">
              <div 
                class="svg-container"
                :style="{ transform: `scale(${zoomLevels.original})` }"
              >
                <div v-if="selectedFile.content" v-html="selectedFile.content"></div>
                <div v-else class="loading-placeholder">
                  <p>加载中...</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="preview-panel">
            <div class="panel-header">
              <h4>处理后</h4>
              <div class="preview-actions">
                <button class="zoom-btn" @click="zoomOut('processed')">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="16"
                    height="16"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>
                <span class="zoom-level">{{ Math.round(zoomLevels.processed * 100) }}%</span>
                <button class="zoom-btn" @click="zoomIn('processed')">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    width="16"
                    height="16"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>
                <button class="zoom-btn" @click="resetZoom('processed')">
                  重置
                </button>
              </div>
            </div>
            <div class="preview-area">
              <div 
                class="svg-container"
                :style="{ transform: `scale(${zoomLevels.processed})` }"
              >
                <div v-if="selectedFile.processedContent" v-html="selectedFile.processedContent"></div>
                <div v-else-if="selectedFile.status === 'completed'" class="error-placeholder">
                  <p>处理失败</p>
                </div>
                <div v-else class="loading-placeholder">
                  <p>{{ getProcessingText(selectedFile.status) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  selectedFileId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['select-file']);

// 计算当前选中的文件
const selectedFile = computed(() => {
  return props.files.find(file => file.id === props.selectedFileId) || props.files[0] || null;
});

// 缩放级别管理
const zoomLevels = ref({
  original: 1,
  processed: 1
});

// 选择文件
const selectFile = (file) => {
  emit('select-file', file);
  // 重置缩放级别
  zoomLevels.value.original = 1;
  zoomLevels.value.processed = 1;
};

// 缩放控制函数
const zoomIn = (type) => {
  if (zoomLevels.value[type] < 3) {
    zoomLevels.value[type] += 0.25;
  }
};

const zoomOut = (type) => {
  if (zoomLevels.value[type] > 0.25) {
    zoomLevels.value[type] -= 0.25;
  }
};

const resetZoom = (type) => {
  zoomLevels.value[type] = 1;
};

// 辅助函数
const truncateFilename = (name) => {
  if (name.length <= 15) return name;
  return name.substring(0, 12) + '...';
};

const getStatusText = (status) => {
  const statusMap = {
    pending: '等待',
    processing: '处理中',
    completed: '完成',
    error: '失败'
  };
  return statusMap[status] || status;
};

const getProcessingText = (status) => {
  const textMap = {
    pending: '等待处理...',
    processing: '处理中...',
    completed: '处理完成',
    error: '处理失败'
  };
  return textMap[status] || '未知状态';
};

// 监听文件变化，自动选择第一个文件
watch(() => props.files, (newFiles) => {
  if (newFiles.length > 0 && !selectedFile.value) {
    selectFile(newFiles[0]);
  }
}, { deep: true });

// 监听选中文件变化，重置缩放
watch(selectedFile, () => {
  zoomLevels.value.original = 1;
  zoomLevels.value.processed = 1;
});
</script>

<style scoped>
.svg-preview-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
}

.preview-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.preview-stats {
  font-size: 14px;
  color: #64748b;
  display: flex;
  gap: 12px;
}

.empty-preview {
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
  background: #f8fafc;
  border-radius: 8px;
  margin: auto;
}

.preview-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* 标签页样式 */
.preview-tabs {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #f1f5f9;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
  scrollbar-width: thin;
}

.preview-tabs::-webkit-scrollbar {
  height: 6px;
}

.preview-tabs::-webkit-scrollbar-track {
  background: #e2e8f0;
  border-radius: 3px;
}

.preview-tabs::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.preview-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 14px;
  flex-shrink: 0;
}

.preview-tab:hover {
  border-color: #6366f1;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
}

.preview-tab.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

.tab-name {
  font-weight: 500;
}

.tab-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 400;
}

.tab-status.pending {
  background: #e2e8f0;
  color: #64748b;
}

.tab-status.processing {
  background: #fef3c7;
  color: #d97706;
}

.tab-status.completed {
  background: #d1fae5;
  color: #059669;
}

.tab-status.error {
  background: #fee2e2;
  color: #dc2626;
}

.preview-tab.active .tab-status {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* 预览内容 */
.preview-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  flex: 1;
  overflow: hidden;
}

.preview-panel {
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-btn {
  padding: 4px 8px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-btn:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.zoom-level {
  font-size: 12px;
  color: #64748b;
  min-width: 40px;
  text-align: center;
}

.preview-area {
  padding: 16px;
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
}

.svg-container {
  transform-origin: center center;
  transition: transform 0.2s ease;
}

.svg-container > div {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.svg-container svg {
  max-width: 100%;
  max-height: calc(100vh - 300px);
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

/* 占位符样式 */
.loading-placeholder,
.error-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 200px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
  color: #64748b;
  font-size: 14px;
}

.error-placeholder {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .svg-preview-container {
    background: #1e293b;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  
  .preview-title {
    color: #f8fafc;
  }
  
  .preview-stats {
    color: #cbd5e1;
  }
  
  .empty-preview {
    background: #334155;
    color: #cbd5e1;
  }
  
  .preview-tabs {
    background: #334155;
  }
  
  .preview-tabs::-webkit-scrollbar-track {
    background: #475569;
  }
  
  .preview-tabs::-webkit-scrollbar-thumb {
    background: #64748b;
  }
  
  .preview-tab {
    background: #475569;
    border-color: #64748b;
    color: #f8fafc;
  }
  
  .preview-tab:hover {
    border-color: #818cf8;
  }
  
  .preview-tab.active {
    background: #6366f1;
    border-color: #6366f1;
  }
  
  .tab-status {
    background: rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
  }
  
  .tab-status.pending {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .tab-status.processing {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }
  
  .tab-status.completed {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
  
  .tab-status.error {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .preview-panel {
    background: #334155;
  }
  
  .panel-header {
    background: #475569;
    border-color: #64748b;
  }
  
  .panel-header h4 {
    color: #f8fafc;
  }
  
  .zoom-btn {
    background: #64748b;
    border-color: #94a3b8;
    color: #f8fafc;
  }
  
  .zoom-btn:hover {
    background: #94a3b8;
    border-color: #cbd5e1;
  }
  
  .zoom-level {
    color: #cbd5e1;
  }
  
  .preview-area {
    background: #334155;
  }
  
  .svg-container svg {
    border-color: #64748b;
  }
  
  .loading-placeholder {
    background: #475569;
    border-color: #64748b;
    color: #cbd5e1;
  }
  
  .error-placeholder {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
}

/* 响应式设计 */
@media (max-width: 900px) {
  .preview-panels {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .preview-area {
    height: 250px;
  }
  
  .svg-container svg {
    max-height: 200px;
  }
}

@media (max-width: 600px) {
  .svg-preview-container {
    padding: 12px;
    min-height: 400px;
  }
  
  .preview-header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .preview-stats {
    font-size: 12px;
    gap: 8px;
  }
  
  .preview-tab {
    font-size: 12px;
    padding: 6px 10px;
  }
  
  .tab-status {
    font-size: 10px;
    padding: 1px 4px;
  }
}
</style>
