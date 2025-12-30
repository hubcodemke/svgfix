<script setup>
import { ref } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, mkdir } from '@tauri-apps/plugin-fs';
import { downloadDir } from '@tauri-apps/api/path';
import DropZone from './components/DropZone.vue';
import FileList from './components/FileList.vue';
import SvgPreview from './components/SvgPreview.vue';

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
  modifyFilename: true, // 是否修改文件名的选项
  downloadFolder: localStorage.getItem('downloadFolder') || '' // 下载文件夹路径
});

// 初始化检查：确保下载文件夹不是根目录或空值
if (!options.value.downloadFolder || options.value.downloadFolder === '/') {
  options.value.downloadFolder = '';
  localStorage.removeItem('downloadFolder');
}

// 配置相关状态
const isSavingConfig = ref(false);
const configMessage = ref('');
const configMessageType = ref(''); // 'success' or 'error'
const showConfigMessage = ref(false);

// 显示配置消息
const showConfigFeedback = (message, type = 'success') => {
  configMessage.value = message;
  configMessageType.value = type;
  showConfigMessage.value = true;
  
  // 3秒后自动隐藏
  setTimeout(() => {
    showConfigMessage.value = false;
  }, 3000);
};

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

// 选择下载文件夹
const selectDownloadFolder = async () => {
  try {
    isSavingConfig.value = true;
    
    // 打开文件夹选择对话框
    const selected = await open({
      directory: true,
      multiple: false,
      title: '选择默认下载文件夹'
    });
    
    // 处理Tauri v2的返回格式
    const folderPath = Array.isArray(selected) ? selected[0] : selected;
    
    if (folderPath && folderPath !== '/') {
      // 更新选项和本地存储
      options.value.downloadFolder = folderPath;
      localStorage.setItem('downloadFolder', folderPath);
      
      showConfigFeedback('下载文件夹设置成功！');
    } else if (folderPath === '/') {
      showConfigFeedback('根目录无法作为下载文件夹，请选择其他文件夹', 'error');
    }
  } catch (error) {
    console.error('Error selecting download folder:', error);
    showConfigFeedback('设置下载文件夹失败：' + (error.message || '未知错误'), 'error');
  } finally {
    isSavingConfig.value = false;
  }
};

// 清除下载文件夹设置
const clearDownloadFolder = () => {
  options.value.downloadFolder = '';
  localStorage.removeItem('downloadFolder');
  showConfigFeedback('已清除默认下载文件夹设置');
};

// 下载单个文件
const downloadFile = async (fileItem) => {
  if (!fileItem.processedContent) return;
  
  console.log('开始下载单个文件:', fileItem.name);
  
  try {
    // 根据选项决定是否修改文件名
    const filename = options.value.modifyFilename 
      ? fileItem.name.replace('.svg', '-cleaned.svg') 
      : fileItem.name;
    
    console.log('生成的文件名:', filename);
    
    let savePath;
    let folderPath;
    
    // 检查是否设置了有效的默认下载文件夹
    if (options.value.downloadFolder && options.value.downloadFolder !== '/') {
      // 使用设置的下载文件夹
      folderPath = options.value.downloadFolder;
      savePath = `${folderPath}/${filename}`;
      console.log('使用设置的下载文件夹:', savePath);
    } else {
      // 没有设置默认下载文件夹或下载文件夹无效，使用系统默认下载位置
      folderPath = await downloadDir();
      savePath = `${folderPath}/${filename}`;
      console.log('使用系统默认下载文件夹:', savePath);
    }
    
    // 确保下载文件夹存在
    try {
      await mkdir(folderPath, { recursive: true });
      console.log('下载文件夹已确保存在:', folderPath);
    } catch (dirError) {
      console.error('创建文件夹失败:', dirError);
      alert(`创建下载文件夹失败: ${dirError.message || '未知错误'}`);
      return;
    }
    
    // 使用Tauri的文件系统API保存文件
    await writeTextFile(savePath, fileItem.processedContent);
    
    console.log('文件下载成功:', filename);
    // 添加下载成功提示
    alert(`文件下载成功: ${filename}\n保存位置: ${savePath}`);
  } catch (error) {
    console.error('Error downloading file:', error);
    alert(`下载文件失败: ${error.message || '未知错误'}`);
  }
};

// 验证SVG格式
const isValidSvg = (content) => {
  try {
    // 简单的SVG验证：检查是否包含<svg>标签
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(content, 'image/svg+xml');
    return svgDoc.getElementsByTagName('svg').length > 0;
  } catch (error) {
    return false;
  }
};

// 清理SVG颜色
const cleanSvgColors = (content, options) => {
  let cleanedContent = content;
  
  // 移除fill属性
  if (options.removeFill) {
    cleanedContent = cleanedContent.replace(/\sfill="[^"]*"/g, '');
    cleanedContent = cleanedContent.replace(/\sfill='[^']*'/g, '');
  }
  
  // 移除stroke属性
  if (options.removeStroke) {
    cleanedContent = cleanedContent.replace(/\sstroke="[^"]*"/g, '');
    cleanedContent = cleanedContent.replace(/\sstroke='[^']*'/g, '');
  }
  
  // 移除color属性
  if (options.removeColor) {
    cleanedContent = cleanedContent.replace(/\scolor="[^"]*"/g, '');
    cleanedContent = cleanedContent.replace(/\scolor='[^']*'/g, '');
  }
  
  return cleanedContent;
};

// 批量下载文件
const downloadAllFiles = async () => {
  console.log('开始批量下载');
  
  const completedFiles = files.value.filter(file => file.status === 'completed');
  if (completedFiles.length === 0) {
    alert('没有已完成处理的文件可以下载');
    return;
  }
  
  console.log('已完成处理的文件数量:', completedFiles.length);
  
  try {
    isDownloading.value = true;
    
    let targetFolder;
    
    // 检查是否设置了有效的默认下载文件夹
    if (options.value.downloadFolder && options.value.downloadFolder !== '/') {
      // 使用设置的下载文件夹
      targetFolder = options.value.downloadFolder;
      console.log('使用设置的下载文件夹:', targetFolder);
    } else {
      // 没有设置默认下载文件夹或下载文件夹无效，使用系统默认下载位置
      targetFolder = await downloadDir();
      console.log('使用系统默认下载文件夹:', targetFolder);
    }
    
    // 确保下载文件夹存在
    try {
      await mkdir(targetFolder, { recursive: true });
      console.log('下载文件夹已确保存在:', targetFolder);
    } catch (dirError) {
      console.error('创建文件夹失败:', dirError);
      alert(`创建下载文件夹失败: ${dirError.message || '未知错误'}`);
      return;
    }
    
    // 逐个保存文件到选择的文件夹
    let successCount = 0;
    for (const file of completedFiles) {
      try {
        // 根据选项决定是否修改文件名
        const filename = options.value.modifyFilename 
          ? file.name.replace('.svg', '-cleaned.svg') 
          : file.name;
        
        const filePath = `${targetFolder}/${filename}`;
        console.log('保存文件到:', filePath);
        
        // 使用Tauri的文件系统API保存文件
        await writeTextFile(filePath, file.processedContent);
        
        successCount++;
        console.log('文件保存成功:', filename);
      } catch (fileError) {
        console.error(`保存文件失败 ${file.name}:`, fileError);
      }
    }
    
    // 批量下载成功提示
    alert(`批量下载完成：成功保存 ${successCount} 个文件到文件夹\n${targetFolder}`);
    
  } catch (error) {
    console.error('Error in batch download:', error);
    alert(`批量下载失败: ${error.message || '未知错误'}`);
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
        
        <!-- 下载文件夹配置 -->
        <div class="options-panel">
          <h3>下载设置</h3>
          <div class="download-folder-config">
            <div class="config-item">
              <label class="config-label">默认下载文件夹</label>
              <div class="config-content">
                <div class="folder-path-display">
                  <span v-if="options.downloadFolder" class="folder-path">{{ options.downloadFolder }}</span>
                  <span v-else class="folder-path-empty">未设置</span>
                </div>
                <div class="config-actions">
                  <button 
                    class="btn btn-primary btn-sm"
                    @click="selectDownloadFolder"
                    :disabled="isSavingConfig"
                  >
                    <span v-if="isSavingConfig" class="loading-spinner-small"></span>
                    {{ isSavingConfig ? '设置中...' : '选择文件夹' }}
                  </button>
                  <button 
                    class="btn btn-secondary btn-sm"
                    @click="clearDownloadFolder"
                    :disabled="!options.downloadFolder || isSavingConfig"
                  >
                    清除
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 配置消息提示 -->
          <div 
            v-if="showConfigMessage" 
            class="config-message" 
            :class="configMessageType"
          >
            {{ configMessage }}
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
  min-width: 350px;
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

/* 下载文件夹配置样式 */
.download-folder-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-label {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.config-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.folder-path-display {
  min-height: 24px;
  display: flex;
  align-items: center;
}

.folder-path {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #3b82f6;
  word-break: break-all;
  white-space: pre-wrap;
  overflow: visible;
  text-overflow: unset;
}

.folder-path-empty {
  font-style: italic;
  color: #94a3b8;
}

.config-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.loading-spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 6px;
}

.config-message {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

.config-message.success {
  background: #ecfdf5;
  color: #10b981;
  border: 1px solid #d1fae5;
}

.config-message.error {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fee2e2;
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
  
  /* 深色主题下的下载配置样式 */
  .config-label {
    color: #f8fafc;
  }
  
  .config-content {
    background: #334155;
    border-color: #475569;
  }
  
  .folder-path {
    color: #60a5fa;
  }
  
  .folder-path-empty {
    color: #cbd5e1;
  }
  
  .config-message.success {
    background: #0f1f17;
    color: #10b981;
    border: 1px solid #164e36;
  }
  
  .config-message.error {
    background: #2c1818;
    color: #ef4444;
    border: 1px solid #4c1d1d;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

