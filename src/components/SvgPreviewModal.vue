<template>
  <a-modal
      :open="modelValue"
      @update:open="(value) => emit('update:modelValue', value)"
      :title="title"
      :footer="null"
      :width="600"
      :centered="true"
      @after-open-change="handleModalOpenChange"
    >
    <div class="preview-modal-content">
      <!-- 缩放控制 -->
      <div class="zoom-controls">
        <span class="zoom-info">缩放比例: {{ Math.round(zoomLevel * 100) }}%</span>
        <div class="zoom-buttons">
          <a-button 
            size="small" 
            @click="zoomOut" 
            :disabled="zoomLevel <= 0.5"
            type="default"
            style="min-width: 40px;"
          >
            - <!-- 使用文字替代图标 -->
          </a-button>
          <a-button 
            size="small" 
            @click="resetZoom"
            type="default"
          >
            重置
          </a-button>
          <a-button 
            size="small" 
            @click="zoomIn" 
            :disabled="zoomLevel >= 1.5"
            type="default"
            style="min-width: 40px;"
          >
            + <!-- 使用文字替代图标 -->
          </a-button>
        </div>
      </div>
      
      <!-- 预览图片 -->
      <div 
        class="preview-img-container"
        @wheel.prevent="handleWheelZoom"
      >
        <img 
          :src="src" 
          alt="SVG Preview" 
          class="preview-modal-img"
          :style="{ transform: `scale(${zoomLevel})`, transition: 'transform 0.05s ease' }"
        />
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch } from 'vue';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  src: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: 'SVG Preview'
  }
});

// Emits
const emit = defineEmits(['update:modelValue']);

// 缩放级别状态
const zoomLevel = ref(1);

// 监听弹窗可见性变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    zoomLevel.value = 1.5; // 打开时初始化为150%
  } else {
    zoomLevel.value = 1; // 关闭时重置缩放级别
  }
});

// 放大
const zoomIn = () => {
  // 使用更精确的计算，确保能达到150%
  const newZoomLevel = zoomLevel.value + 0.1;
  zoomLevel.value = Math.min(Math.round(newZoomLevel * 10) / 10, 1.5);
};

// 缩小
const zoomOut = () => {
  // 使用更精确的计算
  const newZoomLevel = zoomLevel.value - 0.1;
  zoomLevel.value = Math.max(Math.round(newZoomLevel * 10) / 10, 0.5);
};

// 重置缩放
const resetZoom = () => {
  zoomLevel.value = 1.5; // 初始化时放大到150%
};

// 处理鼠标滚轮缩放
const handleWheelZoom = (event) => {
  const delta = event.deltaY > 0 ? -0.1 : 0.1; // 提高灵敏度
  const newZoomLevel = zoomLevel.value + delta;
  
  // 限制缩放范围：最小50%，最大150%
  const clampedZoom = Math.max(0.5, Math.min(newZoomLevel, 1.5));
  zoomLevel.value = Math.round(clampedZoom * 10) / 10; // 确保只有一位小数
};

// 处理模态框打开关闭
const handleModalOpenChange = (open) => {
  if (!open) {
    zoomLevel.value = 1; // 关闭时重置缩放级别
    emit('update:modelValue', false);
  }
};
</script>

<style scoped>
/* SVG预览弹窗样式 */
.preview-modal-content {
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

/* 缩放控制样式 */
.zoom-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.zoom-info {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.zoom-buttons {
  display: flex;
  gap: 8px;
}

/* 预览图片容器样式 */
.preview-img-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  overflow: hidden;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  cursor: grab;
}

.preview-img-container:active {
  cursor: grabbing;
}

/* 预览图片样式 */
.preview-modal-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform-origin: center center;
  transition: transform 0.1s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

/* 优化滚动条样式 */
.preview-img-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.preview-img-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.preview-img-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.preview-img-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .preview-modal-content {
    background: #1e293b;
  }
  
  .zoom-controls {
    background: #334155;
  }
  
  .zoom-info {
    color: #f8fafc;
  }
  
  .preview-img-container {
    background: #334155;
  }
  
  .preview-img-container::-webkit-scrollbar-track {
    background: #475569;
  }
  
  .preview-img-container::-webkit-scrollbar-thumb {
    background: #64748b;
  }
  
  .preview-img-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
}
</style>