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
      <!-- 控制区域 -->
      <div class="zoom-controls">
        <!-- 缩放信息只在视图模式显示 -->
        <span v-if="!isSourceMode" class="zoom-info">缩放比例: {{ Math.round(zoomLevel * 100) }}%</span>
        
        <!-- 控制按钮 -->
          <div class="control-buttons">
            <!-- 缩放按钮只在视图模式显示 -->
            <div v-if="!isSourceMode" class="zoom-buttons">
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
              <!-- 颜色选择器 -->
              <div class="color-picker-container">
                <a-button 
                  size="small" 
                  @click="showColorPicker = !showColorPicker"
                  type="default"
                  style="display: flex; align-items: center; gap: 4px;"
                >
                  <div 
                    class="color-indicator"
                    :style="{ backgroundColor: svgColor }"
                  ></div>
                  SVG颜色
                </a-button>
                <div v-if="showColorPicker" class="color-picker-popup">
                  <input 
                    type="color" 
                    v-model="svgColor" 
                    class="color-input"
                    @input="updateSvgColor"
                  />
                  <a-button 
                    size="small" 
                    @click="clearSvgColor"
                    type="default"
                  >
                    清空
                  </a-button>
                </div>
              </div>
            </div>
          
          <!-- 视图/源码切换按钮 -->
          <a-button 
            size="small" 
            @click="toggleDisplayMode"
            :type="isSourceMode ? 'default' : 'primary'"
          >
            {{ isSourceMode ? '视图' : '源码' }}
          </a-button>
          
          <!-- 源码模式下显示复制按钮 -->
          <a-button 
            v-if="isSourceMode" 
            size="small" 
            @click="copySvgSource"
            type="primary"
            icon="copy"
            style="margin-left: 8px;"
          >
            复制
          </a-button>
        </div>
      </div>
      
      <!-- 预览内容：根据模式切换显示 -->
      <template v-if="!isSourceMode">
        <!-- 预览图片 -->
        <div 
          class="preview-img-container"
          @wheel.prevent="handleWheelZoom"
        >
          <div 
            ref="svgContainer"
            class="preview-modal-svg"
            :style="{ transform: `scale(${zoomLevel})`, transition: 'transform 0.05s ease' }"
          ></div>
        </div>
      </template>
      <template v-else>
        <!-- 源码视图 -->
        <div class="preview-source-container">
          <pre class="source-pre"><code class="source-code">{{ svgSource }}</code></pre>
        </div>
      </template>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { message } from 'ant-design-vue';

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

// 显示模式状态：'view' 或 'source'
const displayMode = ref('view');

// SVG源码
const svgSource = ref('');

// SVG内联元素引用
const svgContainer = ref(null);

// SVG颜色状态
const svgColor = ref('#000000');

// 颜色选择状态
const showColorPicker = ref(false);

// 计算属性：是否为源码模式
const isSourceMode = computed(() => displayMode.value === 'source');

// 解析SVG源码
const parseSvgSource = (src) => {
  try {
    if (src.startsWith('data:image/svg+xml;utf8,')) {
      // 从Data URL中提取编码的SVG内容
      const encodedSvg = src.replace('data:image/svg+xml;utf8,', '');
      // 解码SVG内容
      const decodedSvg = decodeURIComponent(encodedSvg);
      svgSource.value = decodedSvg;
      renderInlineSvg(decodedSvg);
    } else {
      // 如果不是Data URL，尝试直接使用（可能是其他格式，这里做简单处理）
      svgSource.value = src;
      renderInlineSvg(src);
    }
  } catch (error) {
    console.error('解析SVG源码时出错:', error);
    svgSource.value = '解析SVG源码失败，请检查文件格式';
  }
};

// 渲染内联SVG
const renderInlineSvg = (svgContent) => {
  if (svgContainer.value) {
    svgContainer.value.innerHTML = svgContent;
    updateSvgColor();
  }
};

// 更新SVG颜色
const updateSvgColor = () => {
  if (svgContainer.value) {
    const svgElement = svgContainer.value.querySelector('svg');
    if (svgElement) {
      // 查找所有需要改变颜色的元素
      const elements = svgElement.querySelectorAll('path, circle, rect, line, polygon, polyline, ellipse, g');
      elements.forEach(element => {
        // 保存原始颜色（如果还没有保存）
        if (!element.dataset.originalFill) {
          element.dataset.originalFill = element.getAttribute('fill') || '';
        }
        if (!element.dataset.originalStroke) {
          element.dataset.originalStroke = element.getAttribute('stroke') || '';
        }
        
        // 只修改有颜色的元素或黑色元素
        if (element.dataset.originalFill && element.dataset.originalFill !== 'none') {
          element.setAttribute('fill', svgColor.value);
        }
        if (element.dataset.originalStroke && element.dataset.originalStroke !== 'none') {
          element.setAttribute('stroke', svgColor.value);
        }
      });
    }
  }
};

// 清空SVG颜色，恢复原始颜色
const clearSvgColor = () => {
  if (svgContainer.value) {
    const svgElement = svgContainer.value.querySelector('svg');
    if (svgElement) {
      // 查找所有需要恢复颜色的元素
      const elements = svgElement.querySelectorAll('path, circle, rect, line, polygon, polyline, ellipse, g');
      elements.forEach(element => {
        // 恢复原始填充色
        if (element.dataset.originalFill !== undefined) {
          if (element.dataset.originalFill === '') {
            element.removeAttribute('fill');
          } else {
            element.setAttribute('fill', element.dataset.originalFill);
          }
        }
        // 恢复原始描边色
        if (element.dataset.originalStroke !== undefined) {
          if (element.dataset.originalStroke === '') {
            element.removeAttribute('stroke');
          } else {
            element.setAttribute('stroke', element.dataset.originalStroke);
          }
        }
      });
    }
  }
  // 重置颜色状态为默认值
  svgColor.value = '#000000';
};

// 监听src变化，解析SVG源码
watch(() => props.src, (newSrc) => {
  parseSvgSource(newSrc);
}, { immediate: true });

// 监听弹窗可见性变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    zoomLevel.value = 3.0; // 打开时初始化为300%
  } else {
    zoomLevel.value = 1; // 关闭时重置缩放级别
    displayMode.value = 'view'; // 关闭时重置为视图模式
  }
});

// 切换显示模式
const toggleDisplayMode = () => {
  displayMode.value = isSourceMode.value ? 'view' : 'source';
};

// 放大
  const zoomIn = () => {
    // 使用更精确的计算，确保能达到300%
    const newZoomLevel = zoomLevel.value + 0.1;
    zoomLevel.value = Math.min(Math.round(newZoomLevel * 10) / 10, 3.0);
  };

// 缩小
const zoomOut = () => {
  // 使用更精确的计算
  const newZoomLevel = zoomLevel.value - 0.1;
  zoomLevel.value = Math.max(Math.round(newZoomLevel * 10) / 10, 0.5);
};

// 重置缩放
  const resetZoom = () => {
    zoomLevel.value = 3.0; // 初始化时放大到300%
  };

// 处理鼠标滚轮缩放
  const handleWheelZoom = (event) => {
    const delta = event.deltaY > 0 ? -0.1 : 0.1; // 提高灵敏度
    const newZoomLevel = zoomLevel.value + delta;
    
    // 限制缩放范围：最小50%，最大300%
    const clampedZoom = Math.max(0.5, Math.min(newZoomLevel, 3.0));
    zoomLevel.value = Math.round(clampedZoom * 10) / 10; // 确保只有一位小数
  };

// 处理模态框打开关闭
  const handleModalOpenChange = (open) => {
    if (!open) {
      zoomLevel.value = 1; // 关闭时重置缩放级别
      displayMode.value = 'view'; // 关闭时重置为视图模式
      emit('update:modelValue', false);
    }
  };

// 复制SVG源码
const copySvgSource = () => {
  try {
    // 尝试使用现代浏览器的Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      // 使用Clipboard API
      navigator.clipboard.writeText(svgSource.value)
        .then(() => {
          message.success('复制成功');
        })
        .catch(err => {
          console.error('Clipboard API复制失败:', err);
          // 回退到传统方法
          fallbackCopyTextToClipboard(svgSource.value);
        });
    } else {
      // 不支持Clipboard API，使用传统方法
      fallbackCopyTextToClipboard(svgSource.value);
    }
  } catch (error) {
    console.error('解析或复制SVG源码时出错:', error);
    message.error('复制失败，请手动复制');
  }
};

// 传统的复制方法，作为fallback
const fallbackCopyTextToClipboard = (text) => {
  try {
    // 创建临时textarea元素
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 设置样式，确保元素不可见但可选中
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    
    // 添加到DOM并选中内容
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // 执行复制命令
    const successful = document.execCommand('copy');
    
    // 移除临时元素
    document.body.removeChild(textArea);
    
    if (successful) {
      message.success('复制成功');
    } else {
      message.error('复制失败，请手动复制');
    }
  } catch (err) {
    console.error('传统方法复制失败:', err);
    message.error('复制失败，请手动复制');
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

.control-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
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

/* 预览SVG样式 */
.preview-modal-svg {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  transform-origin: center center;
  transition: transform 0.1s ease;
}

.preview-modal-svg svg {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

/* 颜色选择器样式 */
.color-picker-container {
  position: relative;
  display: flex;
  align-items: center;
}

.color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #d9d9d9;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.color-picker-popup {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input {
  width: 40px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  background: transparent;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
  border-radius: 4px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 深色主题适配 - 颜色选择器 */
@media (prefers-color-scheme: dark) {
  .color-picker-popup {
    background: #334155;
  }
  
  .color-indicator {
    border-color: #64748b;
  }
}

/* 源码视图容器样式 */
.preview-source-container {
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 16px;
  overflow: hidden;
}

/* 源码pre样式 */
.source-pre {
  margin: 0;
  padding: 16px;
  background: #f6f8fa;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 源码code样式 */
.source-code {
  color: #24292e;
  tab-size: 2;
}

/* 优化滚动条样式 */
.preview-img-container::-webkit-scrollbar,
.source-pre::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.preview-img-container::-webkit-scrollbar-track,
.source-pre::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.preview-img-container::-webkit-scrollbar-thumb,
.source-pre::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.preview-img-container::-webkit-scrollbar-thumb:hover,
.source-pre::-webkit-scrollbar-thumb:hover {
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
  
  .preview-source-container {
    background: #334155;
  }
  
  .source-pre {
    background: #1e293b;
    border: 1px solid #475569;
  }
  
  .source-code {
    color: #e2e8f0;
  }
  
  .preview-img-container::-webkit-scrollbar-track,
  .source-pre::-webkit-scrollbar-track {
    background: #475569;
  }
  
  .preview-img-container::-webkit-scrollbar-thumb,
  .source-pre::-webkit-scrollbar-thumb {
    background: #64748b;
  }
  
  .preview-img-container::-webkit-scrollbar-thumb:hover,
  .source-pre::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
}
</style>