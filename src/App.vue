<script setup>
import { ref } from 'vue';
import DropZone from './components/DropZone.vue';
import FileList from './components/FileList.vue';
import SvgPreview from './components/SvgPreview.vue';
import { cleanSvgColors, isValidSvg } from './utils/svgCleaner';

// 文件列表
const files = ref([]);
const isProcessing = ref(false);
const selectedFile = ref(null);

// 处理选项
const options = ref({
  removeFill: true,
  removeStroke: true,
  removeColor: true,
  preserveBlack: false,
  preserveWhite: false,
  preserveTransparent: false,
  modifyFilename: true // 是否修改文件名的选项
});

// 下载状态管理
const isDownloading = ref(false);

// 生成唯一ID的计数器
let idCounter = 0;

// 处理文件选择
const handleFilesSelected = (selectedFiles) => {
  selectedFiles.forEach(file => {
    files.value.push({
      id: `file-${++idCounter}-${Date.now()}`,
      name: file.name,
      size: file.size,
      file: file,
      status: 'pending',
      content: null,
      processedContent: null
    });
  });
  
  // 如果是第一个文件，自动选中
  if (files.value.length === 1) {
    selectedFile.value = files.value[0];
  }
};

// 处理单个文件
const processFile = async (fileItem) => {
  try {
    fileItem.status = 'processing';
    
    // 读取文件内容
    const reader = new FileReader();
    const content = await new Promise((resolve, reject) => {
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(fileItem.file);
    });
    
    fileItem.content = content;
    
    // 验证SVG
    if (!isValidSvg(content)) {
      fileItem.status = 'error';
      return;
    }
    
    // 清理SVG颜色
    const cleanedContent = cleanSvgColors(content, options.value);
    fileItem.processedContent = cleanedContent;
    
    fileItem.status = 'completed';
    
    // 如果当前没有选中文件或选中的是正在处理的文件，更新选中状态
    if (!selectedFile.value || selectedFile.value.id === fileItem.id) {
      selectedFile.value = fileItem;
    }
  } catch (error) {
    console.error('Error processing file:', error);
    fileItem.status = 'error';
  }
};

// 处理所有文件
const processAllFiles = async () => {
  if (files.value.length === 0) return;
  
  isProcessing.value = true;
  
  // 按顺序处理文件
  for (const file of files.value) {
    if (file.status === 'pending' || file.status === 'error') {
      await processFile(file);
    }
  }
  
  isProcessing.value = false;
};

// 清空所有文件
const clearAllFiles = () => {
  files.value = [];
  selectedFile.value = null;
};

// 下载单个文件
const downloadFile = async (fileItem) => {
  if (!fileItem.processedContent) return;
  
  try {
    // 转换处理后的内容为Blob
    const blob = new Blob([fileItem.processedContent], { type: 'image/svg+xml' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // 根据选项决定是否修改文件名
    const filename = options.value.modifyFilename 
      ? fileItem.name.replace('.svg', '-cleaned.svg') 
      : fileItem.name;
    link.download = filename;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Error downloading file:', error);
    alert(`下载文件失败: ${error.message}`);
  }
};

// 批量下载文件
const downloadAllFiles = async () => {
  const completedFiles = files.value.filter(file => file.status === 'completed');
  if (completedFiles.length === 0) {
    alert('没有已完成处理的文件可以下载');
    return;
  }
  
  try {
    isDownloading.value = true;
    
    // 由于浏览器限制，批量下载会逐个触发下载
    for (const file of completedFiles) {
      await downloadFile(file);
      // 等待100ms，避免浏览器阻止连续下载
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    alert(`已开始下载 ${completedFiles.length} 个文件`);
  } catch (error) {
    console.error('Error in batch download:', error);
    alert(`批量下载失败: ${error.message}`);
  } finally {
    isDownloading.value = false;
  }
};

// 选择文件进行预览
const selectFileForPreview = (fileItem) => {
  selectedFile.value = fileItem;
};
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>SVG颜色清理工具</h1>
      <p>移除或标准化SVG文件中的颜色属性</p>
    </header>
    
    <main class="app-main">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <!-- 选项设置 -->
        <div class="options-panel">
          <h3>处理选项</h3>
          <div class="options-grid">
            <label class="option-item">
              <input 
                type="checkbox" 
                v-model="options.removeFill"
              />
              <span>移除填充色 (fill)</span>
            </label>
            <label class="option-item">
              <input 
                type="checkbox" 
                v-model="options.removeStroke"
              />
              <span>移除描边色 (stroke)</span>
            </label>
            <label class="option-item">
              <input 
                type="checkbox" 
                v-model="options.removeColor"
              />
              <span>移除颜色属性 (color)</span>
            </label>
            <label class="option-item">
              <input 
                type="checkbox" 
                v-model="options.preserveBlack"
              />
              <span>保留黑色 (#000)</span>
            </label>
            <label class="option-item">
              <input 
                type="checkbox" 
                v-model="options.preserveWhite"
              />
              <span>保留白色 (#fff)</span>
            </label>
            <label class="option-item">
            <input 
              type="checkbox" 
              v-model="options.preserveTransparent"
            />
            <span>保留透明色</span>
          </label>
          <label class="option-item">
            <input 
              type="checkbox" 
              v-model="options.modifyFilename"
            />
            <span>修改文件名 (添加 -cleaned 后缀)</span>
          </label>
          </div>
        </div>
        
        <!-- 文件拖放区域 -->
        <DropZone @files-selected="handleFilesSelected" />
        
        <!-- 文件列表 -->
      <FileList 
        :files="files" 
        :is-processing="isProcessing"
        :is-downloading="isDownloading"
        :selected-file-id="selectedFile?.id || ''"
        @process-all="processAllFiles"
        @clear-all="clearAllFiles"
        @download-file="downloadFile"
        @download-all="downloadAllFiles"
        @file-selected="selectFileForPreview"
      />
      </div>
      
      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- SVG预览 -->
        <SvgPreview 
          :files="files"
          :selected-file-id="selectedFile?.id || ''"
          @select-file="selectFileForPreview"
        />
      </div>
    </main>
    
    <footer class="app-footer">
      <p>SVG颜色清理工具 © 2024</p>
    </footer>
  </div>
</template>

<style>
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  
  color: #1e293b;
  background-color: #f8fafc;
  
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  min-height: 100vh;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 10px;
}

.app-header p {
  font-size: 1.1rem;
  color: #64748b;
}

.app-main {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.left-panel {
  flex: 1;
  min-width: 320px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  flex: 2;
  min-width: 400px;
  display: flex;
  flex-direction: column;
}

.options-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.options-panel h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 15px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.option-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #6366f1;
}

.app-footer {
  text-align: center;
  margin-top: 40px;
  padding: 20px 0;
  color: #64748b;
  font-size: 14px;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  :root {
    color: #f8fafc;
    background-color: #0f172a;
  }
  
  .app-header h1 {
    color: #f8fafc;
  }
  
  .app-header p {
    color: #cbd5e1;
  }
  
  .options-panel {
    background: #1e293b;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  
  .options-panel h3 {
    color: #f8fafc;
  }
  
  .option-item span {
    color: #cbd5e1;
  }
  
  .app-footer {
    color: #94a3b8;
  }
}

/* 优化滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
  transition: background 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 深色主题滚动条 */
@media (prefers-color-scheme: dark) {
  ::-webkit-scrollbar-track {
    background: #1e293b;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #475569;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
}

/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 加载动画 */
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

.app-container {
  animation: fadeIn 0.5s ease-out;
}

/* 优化按钮过渡效果 */
button {
  transition: all 0.2s ease;
}

/* 优化输入框样式 */
input[type="checkbox"] {
  transition: all 0.2s ease;
}

/* 优化面板阴影效果 */
.options-panel,
.file-list-container,
.svg-preview-container,
.drop-zone {
  transition: all 0.3s ease;
}

/* 优化文本选择样式 */
::selection {
  background: rgba(99, 102, 241, 0.2);
  color: #6366f1;
}

@media (prefers-color-scheme: dark) {
  ::selection {
    background: rgba(99, 102, 241, 0.3);
    color: #a5b4fc;
  }
}
</style>

