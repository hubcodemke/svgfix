<template>
  <div 
    class="drop-zone"
    :class="{ 'drag-over': isDragOver }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver" 
    @dragleave.prevent="handleDragLeave" 
    @drop.prevent="handleDrop"
    @click="handleClick"
  >
    <div class="drop-zone-content">
      <a-icon type="cloud-upload" :style="{ fontSize: '64px', color: '#6366f1' }" />
      <h2 class="drop-zone-title">拖拽SVG文件到此处</h2>
      <p class="drop-zone-subtitle">或点击选择文件</p>
      <input 
        ref="fileInput"
        type="file"
        accept=".svg"
        multiple
        class="file-input"
        @change="handleFileSelect"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['files-selected']);

const isDragOver = ref(false);
const fileInput = ref(null);
let dragCounter = 0;

// 通用拖拽事件处理
const handleDragEnter = (event) => {
  // 防止事件冒泡导致多次触发
  event.stopPropagation();
  event.preventDefault();
  
  console.log('Drag enter:', event);
  
  dragCounter++;
  isDragOver.value = true;
};

const handleDragOver = (event) => {
  // 必须阻止默认行为，否则drop事件不会触发
  event.stopPropagation();
  event.preventDefault();
  
  console.log('Drag over:', event);
  
  isDragOver.value = true;
  
  // 添加必要的数据传输类型支持
  event.dataTransfer.dropEffect = 'copy';
  event.dataTransfer.effectAllowed = 'copy';
};

const handleDragLeave = (event) => {
  event.stopPropagation();
  event.preventDefault();
  
  console.log('Drag leave:', event);
  
  dragCounter--;
  if (dragCounter === 0) {
    isDragOver.value = false;
  }
};

const handleDrop = (event) => {
  event.stopPropagation();
  event.preventDefault();
  
  console.log('Drop event:', event);
  
  dragCounter = 0;
  isDragOver.value = false;
  
  try {
    const files = Array.from(event.dataTransfer.files);
    console.log('Dropped files:', files);
    processFiles(files);
  } catch (error) {
    console.error('Error handling drop event:', error);
  }
};

const handleClick = () => {
  fileInput.value.click();
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  processFiles(files);
};

const processFiles = (files) => {
  const svgFiles = files.filter(file => {
    // 检查文件扩展名
    const isSvgExt = file.name.toLowerCase().endsWith('.svg');
    // 检查MIME类型
    const isSvgType = file.type === 'image/svg+xml' || file.type === '';
    return isSvgExt && isSvgType;
  });
  
  if (svgFiles.length > 0) {
    emit('files-selected', svgFiles);
  }
};

// 添加全局事件监听以确保Tauri环境下正常工作
onMounted(() => {
  // 移除全局事件监听，因为它们可能与元素事件冲突
  // 在Tauri 2中，元素级别的拖拽事件应该能够正常工作
});

onUnmounted(() => {
  // 清理逻辑
});
</script>

<style scoped>
.drop-zone {
  border: 2px dashed #6366f1;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #f8fafc;
  cursor: pointer;
  margin: 20px 0;
  min-height: 120px;
}

.drop-zone:hover {
  background-color: #f1f5f9;
  border-color: #4f46e5;
}

.drop-zone.drag-over {
  background-color: #e0e7ff;
  border-color: #4f46e5;
  transform: scale(1.01);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.2);
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.drop-zone-icon {
  width: 64px;
  height: 64px;
  color: #6366f1;
  transition: all 0.3s ease;
}

.drop-zone.drag-over .drop-zone-icon {
  transform: scale(1.1);
  color: #4f46e5;
}

.drop-zone-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.drop-zone-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.file-input {
  display: none;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .drop-zone {
    background-color: #1e293b;
    border-color: #6366f1;
  }
  
  .drop-zone:hover {
    background-color: #334155;
  }
  
  .drop-zone.drag-over {
    background-color: #4f46e520;
  }
  
  .drop-zone-title {
    color: #f8fafc;
  }
  
  .drop-zone-subtitle {
    color: #cbd5e1;
  }
}
</style>
