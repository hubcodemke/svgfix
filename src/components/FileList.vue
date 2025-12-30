<template>
  <div class="file-list-container">
    <h3 class="file-list-title">文件列表</h3>
    
    <!-- 文件数量警告 -->
    <div v-if="files.length > 500" class="file-count-warning">
      <svg 
        class="warning-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>文件数量已超过500个，仅显示前500个文件</span>
    </div>
    
    <!-- 操作按钮行 - 移到文件列表之前 -->
    <div v-if="files.length > 0" class="file-list-footer">
      <div class="file-count">{{ files.length }} 个文件</div>
      <div class="action-buttons">
        <button 
          class="btn btn-secondary"
          @click="$emit('clear-all')"
        >
          清空列表
        </button>
        <button 
          class="btn btn-primary"
          @click="$emit('process-all')"
          :disabled="isProcessing"
        >
          <span v-if="isProcessing" class="loading-spinner"></span>
          {{ isProcessing ? '处理中...' : '开始处理' }}
        </button>
        <button 
          class="btn btn-success"
          @click="$emit('download-all')"
          :disabled="files.filter(f => f.status === 'completed').length === 0 || isDownloading"
        >
          <span v-if="isDownloading" class="loading-spinner"></span>
          {{ isDownloading ? '下载中...' : '批量下载' }}
        </button>
      </div>
    </div>
    
    <div v-if="files.length === 0" class="empty-state">
      <p>暂无文件，请拖拽或选择SVG文件</p>
    </div>
    <div v-else class="file-list-wrapper">
      <div class="file-list">
        <div 
          v-for="file in displayFiles" 
          :key="file.id" 
          class="file-item"
          :class="{ 'processing': file.status === 'processing', 'completed': file.status === 'completed', 'error': file.status === 'error', 'selected': selectedFileId === file.id }"
          @click="$emit('file-selected', file)"
        >
          <div class="file-info">
            <svg 
              class="file-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <div class="file-details">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-size">{{ formatFileSize(file.size) }}</div>
            </div>
          </div>
          <div class="file-status">
            <div v-if="file.status === 'pending'" class="status pending">
              <span class="status-indicator"></span>
              等待处理
            </div>
            <div v-else-if="file.status === 'processing'" class="status processing">
              <span class="status-indicator loading"></span>
              处理中
            </div>
            <div v-else-if="file.status === 'completed'" class="status completed">
              <svg 
                class="status-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              已完成
            </div>
            <div v-else-if="file.status === 'error'" class="status error">
              <svg 
                class="status-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              处理失败
            </div>
          </div>
          <button 
            v-if="file.status === 'completed'" 
            class="download-btn"
            @click.stop="$emit('download-file', file)"
            :disabled="isDownloading"
          >
            <svg 
              class="btn-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span v-if="isDownloading" class="btn-loading"></span>
            {{ isDownloading ? '下载中' : '下载' }}
          </button>
        </div>
      </div>
      
      <!-- 分页控制 -->
      <div v-if="files.length > 100" class="pagination">
        <button 
          class="btn btn-secondary btn-sm"
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
        >
          上一页
        </button>
        <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
        <button 
          class="btn btn-secondary btn-sm"
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  isProcessing: {
    type: Boolean,
    default: false
  },
  isDownloading: {
    type: Boolean,
    default: false
  },
  selectedFileId: {
    type: String,
    default: ''
  }
});

defineEmits(['process-all', 'clear-all', 'download-file', 'download-all', 'file-selected']);

// 分页相关状态
const currentPage = ref(1);
const pageSize = ref(100);

// 计算要显示的文件列表（最多显示500个文件）
const displayFiles = computed(() => {
  // 限制最多显示500个文件
  const maxFiles = props.files.slice(0, 500);
  
  // 计算分页
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  
  return maxFiles.slice(startIndex, endIndex);
});

// 计算总页数
const totalPages = computed(() => {
  const maxFiles = Math.min(props.files.length, 500);
  return Math.ceil(maxFiles / pageSize.value);
});

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
.file-list-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
}

.file-list-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  background: #f8fafc;
  border-radius: 8px;
}

.file-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

/* 文件数量警告样式 */
.file-count-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  margin-bottom: 16px;
}

.warning-icon {
  width: 16px;
  height: 16px;
  color: #f59e0b;
}

.file-count-warning span {
  font-size: 14px;
  color: #d97706;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.page-info {
  font-size: 14px;
  color: #64748b;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.file-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: transparent;
  transition: all 0.3s ease;
}

.file-item:hover {
  border-color: #6366f1;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.15);
  transform: translateX(4px);
}

.file-item.selected {
  border-color: #6366f1;
  background: #e0e7ff;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);
}

.file-item.selected::before {
  background: #6366f1;
}

.file-item:hover::before {
  background: #6366f1;
  opacity: 0.5;
}

.file-item:active {
  transform: translateY(1px);
  transition: all 0.1s ease;
}

.file-item.processing {
  border-color: #f59e0b;
  background: #fffbeb;
}

.file-item.completed {
  border-color: #10b981;
  background: #ecfdf5;
}

.file-item.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-icon {
  width: 32px;
  height: 32px;
  color: #6366f1;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.file-size {
  font-size: 12px;
  color: #64748b;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 12px;
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-indicator.loading {
  background: #f59e0b;
  animation: pulse 1.5s infinite;
}

.status.pending {
  color: #94a3b8;
}

.status.processing {
  color: #f59e0b;
}

.status.completed {
  color: #10b981;
}

.status.error {
  color: #ef4444;
}

.status-icon {
  width: 16px;
  height: 16px;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-btn:hover {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.file-list-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
  margin-bottom: 20px;
}

.file-count {
  color: #64748b;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #f1f5f9;
  color: #64748b;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #475569;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-success:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

.btn-loading {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 6px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .file-list-container {
    background: #1e293b;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  
  .file-list-title {
    color: #f8fafc;
  }
  
  .empty-state {
    background: #334155;
    color: #cbd5e1;
  }
  
  .file-item {
    background: #334155;
    border-color: #475569;
  }
  
  .file-item:hover {
    border-color: #6366f1;
  }
  
  .file-item.processing {
    border-color: #f59e0b;
    background: #3f3411;
  }
  
  .file-item.completed {
    border-color: #10b981;
    background: #0f1f17;
  }
  
  .file-item.error {
    border-color: #ef4444;
    background: #2c1818;
  }
  
  .file-name {
    color: #f8fafc;
  }
  
  .file-size {
    color: #cbd5e1;
  }
  
  .status.pending {
    color: #cbd5e1;
  }
  
  .status-indicator {
    background: #cbd5e1;
  }
  
  .file-list-footer {
    border-top-color: #475569;
  }
  
  .file-count {
    color: #cbd5e1;
  }
  
  .btn-secondary {
    background: #475569;
    color: #cbd5e1;
  }
  
  .btn-secondary:hover {
    background: #64748b;
    color: #f8fafc;
  }
}
</style>
