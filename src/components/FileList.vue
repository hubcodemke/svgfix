<template>
  <div class="file-list-container">
    <!-- 固定头部 -->
    <div class="file-list-header">
      <!-- 文件数量警告 -->
      <a-alert 
        v-if="files.length > 500" 
        message="文件数量已超过500个，仅显示前500个文件" 
        type="warning" 
        show-icon 
        style="margin-bottom: 16px;"
      />
      
      <!-- 操作按钮行 - 固钉效果 -->
      <div v-if="files.length > 0" class="file-list-footer-sticky">
        <div class="file-count">{{ files.length }} 个文件</div>
        <div class="action-buttons">
          <a-button 
            type="default" 
            @click="$emit('clear-all')"
            size="small"
          >
            清空列表
          </a-button>
          <a-button 
            type="primary" 
            @click="$emit('process-all')"
            :loading="isProcessing"
            size="small"
          >
            开始处理
          </a-button>
          <a-button 
            type="success" 
            @click="$emit('download-all')"
            :loading="isDownloading"
            :disabled="files.filter(f => f.status === 'completed').length === 0"
            size="small"
          >
            批量下载
          </a-button>
        </div>
      </div>
    </div>
    
    <!-- 可滚动内容区 -->
    <div class="file-list-content">
      <div v-if="files.length === 0" class="empty-state">
        <a-empty description="暂无文件，请拖拽或选择SVG文件" />
      </div>
      
      <div v-else class="files-container">
        <!-- 使用ul li实现单列文件列表 -->
        <ul class="file-list">
          <li 
            v-for="file in displayFiles" 
            :key="file.id" 
            class="file-list-item"
            :class="{ 'selected': selectedFileId === file.id }"
            @click="$emit('file-selected', file)"
          >
            <!-- SVG图标区域：原图和处理后图 -->
            <div class="file-svg-container">
              <!-- 原图部分 -->
              <div class="svg-section original">
                <span class="svg-label">原图：</span>
                <div class="svg-preview">
                  <div v-if="file.content" class="svg-preview-inner">
                    <img 
                      :src="'data:image/svg+xml;utf8,' + encodeURIComponent(file.content)" 
                      alt="Original SVG" 
                      class="svg-img"
                    />
                  </div>
                  <a-icon v-else type="file-svg" :style="{ fontSize: '32px', color: '#6366f1' }" />
                </div>
              </div>
              
              <!-- 连接符号和处理后部分 -->
              <template v-if="file.processedContent">
                <div class="svg-arrow">→</div>
                <div class="svg-section processed">
                  <span class="svg-label">处理后：</span>
                  <div class="svg-preview processed">
                    <img 
                      :src="'data:image/svg+xml;utf8,' + encodeURIComponent(file.processedContent)" 
                      alt="Processed SVG" 
                      class="svg-img"
                    />
                  </div>
                </div>
              </template>
            </div>
            
            <!-- 文件信息 -->
            <div class="file-info">
              <a-tooltip :title="file.name" placement="top">
                <div class="file-name">{{ file.name }}</div>
              </a-tooltip>
              <div class="file-size">{{ formatFileSize(file.size) }}</div>
            </div>
            
            <!-- 处理状态 -->
            <div class="file-status">
              <a-tag 
                v-if="file.status === 'pending'" 
                color="default"
                size="small"
              >
                等待处理
              </a-tag>
              <a-tag 
                v-else-if="file.status === 'processing'" 
                color="warning"
                size="small"
              >
                <template #icon>
                  <a-icon type="loading" spin />
                </template>
                处理中
              </a-tag>
              <a-tag 
                v-else-if="file.status === 'completed'" 
                color="success"
                size="small"
              >
                已完成
              </a-tag>
              <a-tag 
                v-else-if="file.status === 'error'" 
                color="error"
                size="small"
              >
                处理失败
              </a-tag>
            </div>
            
            <!-- 下载按钮 -->
            <div class="file-actions">
              <a-button 
                v-if="file.status === 'completed'" 
                type="primary" 
                size="small"
                @click.stop="$emit('download-file', file)"
                :loading="isDownloading"
              >
                下载
              </a-button>
            </div>
          </li>
        </ul>
        
        <!-- 分页控制 -->
        <a-pagination 
          v-if="files.length > 100" 
          :current="currentPage" 
          :total="Math.min(files.length, 500)" 
          :page-size="pageSize" 
          @change="handlePageChange"
          style="margin-top: 16px; text-align: center;"
          size="small"
        />
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

// 分页变化处理
const handlePageChange = (page) => {
  currentPage.value = page;
};

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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin: 0 0 20px 0;
}

.file-list-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
}

/* 文件列表容器 */
.file-list-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 400px;
  max-height: 600px;
}

/* 固定头部 */
.file-list-header {
  background: white;
  padding: 12px 20px 0 20px;
  z-index: 10;
  position: sticky;
  top: 0;
}

/* 可滚动内容区 */
.file-list-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 20px 20px 20px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

/* 空状态样式 */
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

/* 文件列表容器样式 */
.files-container {
  width: 100%;
}

/* 文件列表样式 */
.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* 文件列表项样式 */
.file-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  height: auto;
}

.file-list-item:hover {
  border-color: #6366f1;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.file-list-item.selected {
  border-color: #6366f1;
  background: #e0e7ff;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);
}

/* 文件SVG容器 */
.file-svg-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 16px;
}

/* SVG部分 */
.svg-section {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* SVG标签 */
.svg-label {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
}

/* 连接箭头 */
.svg-arrow {
  font-size: 16px;
  color: #6366f1;
  font-weight: 600;
  margin: 0 4px;
}

/* SVG预览样式 */
.svg-preview {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 1px solid #e2e8f0;
}

/* 处理后的图特殊样式 */
.svg-preview.processed {
  background: #ecfdf5;
  border: 1px solid #10b981;
}

/* 处理后的图标识 */
.svg-preview.processed::after {
  display: none;
}

/* SVG图片样式 */
.svg-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* SVG预览内部容器 */
.svg-preview-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 文件信息区域 */
.file-info {
  flex: 1;
  margin-right: 16px;
}

/* 文件名称 */
.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

/* 文件大小 */
.file-size {
  font-size: 12px;
  color: #64748b;
}

/* 文件状态 */
.file-status {
  margin-right: 16px;
}

/* 文件操作按钮 */
.file-actions {
  display: flex;
  align-items: center;
}

/* 文件列表底部样式 - 固定效果 */
.file-list-footer-sticky {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0 12px 0;
}

.file-count {
  color: #64748b;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .file-list-container {
    background: #1e293b;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  
  .file-list-header {
    background: #1e293b;
    border-bottom-color: #475569;
  }
  
  .file-list-item {
    background: #1e293b;
    border-color: #475569;
  }
  
  .file-name {
    color: #f8fafc;
  }
  
  .file-size {
    color: #cbd5e1;
  }
  
  .svg-preview {
    background: #334155;
  }
  
  .file-count {
    color: #cbd5e1;
  }
  
  .file-list-footer-sticky {
    border-bottom-color: #475569;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-list-item {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .file-info {
    flex: 1;
    min-width: 150px;
  }
  
  .file-name {
    max-width: 100%;
  }
  
  .file-status {
    margin-right: auto;
  }
  
  .file-list-footer-sticky {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .file-count {
    text-align: center;
  }
}

/* 文件名称样式 */
.file-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

/* 文件大小样式 */
.file-size {
  font-size: 12px;
  color: #64748b;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .file-name {
    color: #f8fafc;
  }
  
  .file-size {
    color: #cbd5e1;
  }
  
  .svg-preview {
    background: #334155;
  }
}
</style>
