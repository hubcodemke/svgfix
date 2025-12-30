# SVG颜色清理桌面应用

一个基于 Tauri + Vue 3 开发的 SVG 颜色清理桌面应用，支持批量处理 SVG 文件，将其中的 fill 和 stroke 属性统一设置为 `currentColor`，方便在不同主题下使用。

## 主要功能

- **拖拽上传**：支持将 SVG 文件拖拽到应用窗口进行处理
- **批量处理**：一次性处理多个 SVG 文件
- **颜色统一**：将 SVG 元素的 fill 和 stroke 属性统一设置为 `currentColor`
- **批量下载**：处理完成后可批量下载所有文件
- **预览功能**：支持查看处理前后的 SVG 效果
- **文件名修改**：提供选项可以修改输出文件名
- **加载状态**：处理中和下载过程中显示加载状态
- **跨平台支持**：支持 macOS、Windows 和 Linux

## 技术栈

- **前端框架**：Vue 3 (Composition API)
- **构建工具**：Vite
- **桌面框架**：Tauri 2
- **后端语言**：Rust
- **UI 组件**：Ant Design Vue

## 安装和使用

### 环境要求

- Node.js 18+
- pnpm
- Rust 1.75+
- Tauri CLI

### 开发环境设置

1. 克隆仓库
   ```bash
   git clone <repository-url>
   cd svgfix
   ```

2. 安装依赖
   ```bash
   pnpm install
   ```

3. 启动开发服务器
   ```bash
   pnpm tauri dev
   ```

### 使用方法

1. 启动应用后，将 SVG 文件拖拽到应用窗口的拖拽区域
2. 等待文件处理完成
3. 可以选择修改输出文件名
4. 点击"批量下载"按钮下载处理后的文件
5. 可以在预览区域查看处理前后的效果

## 构建说明

### 构建特定平台版本

- **macOS (ARM64)**：
  ```bash
  pnpm build && pnpm tauri build --target aarch64-apple-darwin
  ```

- **macOS (Intel)**：
  ```bash
  pnpm build && pnpm tauri build --target x86_64-apple-darwin
  ```

- **Windows**：
  ```bash
  pnpm build && pnpm tauri build --target x86_64-pc-windows-msvc
  ```

- **Linux**：
  ```bash
  pnpm build && pnpm tauri build --target x86_64-unknown-linux-gnu
  ```

### 构建所有平台版本

**注意**：跨平台构建需要特定的构建环境，建议在目标平台上进行构建。

```bash
# 构建当前平台版本
pnpm build:all
```

## 项目结构

```
.
├── src/                      # 前端源码
│   ├── components/           # Vue 组件
│   │   ├── DropZone.vue      # 拖拽区域组件
│   │   ├── FileList.vue      # 文件列表组件
│   │   └── SvgPreview.vue    # SVG 预览组件
│   ├── utils/                # 工具函数
│   │   └── svgCleaner.js     # SVG 清理逻辑
│   ├── App.vue               # 主应用组件
│   └── main.js               # 应用入口
├── src-tauri/                # Tauri 后端
│   ├── capabilities/         # 权限配置
│   ├── src/                  # Rust 源码
│   └── tauri.conf.json       # Tauri 配置
├── index.html                # HTML 入口
├── package.json              # 前端依赖
└── vite.config.js            # Vite 配置
```

## 许可证

MIT License

## 开发说明

### 调试注意事项

- 在开发模式下，应用运行在本地开发服务器上
- 生产构建会生成独立的桌面应用
- Tauri 应用的拖拽功能需要在 `tauri.conf.json` 中设置 `dragDropEnabled: false` 才能正常工作

### 代码规范

- 使用 Vue 3 Composition API
- 遵循 ESLint 和 Prettier 规范
- Rust 代码遵循 Rust 社区规范

## 贡献

欢迎提交 Issue 和 Pull Request！
