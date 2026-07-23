# DevOpsKit

DevOpsKit 是一个基于 Vue 3 + Vite + Element Plus 构建的前端工具箱，面向研发、测试和运维场景，提供文本处理、字符编码速查、编解码、摘要计算、时间戳转换和测试数据生成等常用能力。

**演示地址：[https://www.xueyu123.work/dev-ops-kit](https://www.xueyu123.work/dev-ops-kit)**

项目当前以 SPA 形式运行，首页和顶部导航由配置驱动，集成高度自动化的工程化工具，新增功能极其方便。

## 当前功能

### 🛠️ 开发与文本处理

| 工具 | 路由 | 功能说明 |
| --- | --- | --- |
| 文本比对 | `/text-diff` | 支持代码与文本差异对比，提供并排 (Split) 和统一 (Unified) 视图。 |
| JSON 工具 | `/json-tools` | 提供格式化、压缩、转译、解析及树形结构查看。 |
| PDM 解析 | `/pdm-parser` | 本地解析 PowerDesigner .pdm 文件，提取表结构、字段、主键与备注并导出文档。 |
| Mermaid 渲染 | `/mermaid-editor` | 支持交互式 Mermaid 语法渲染，可快速生成流程图、时序图并导出图片。 |
| ASCII 码对照表 | `/ascii-table` | 完整的 ASCII 码表速查，支持多种进制和控制字符的模糊搜索。 |
| ASCII 艺术字 | `/ascii-banner` | 生成 Spring Boot 风格的艺术字 Banner，支持多种字体及中文支持。 |
| 正则测试 | `/regex-tester` | 在线测试正则表达式，支持全局、忽略大小写匹配，实时展示匹配结果及分组信息。 |
| 文件在线预览 | `/file-viewer` | 支持 PDF、Office 文档、图片、音视频、代码/文本及压缩包的在线预览。支持本地文件拖拽与网络 URL 链接解析预览（自动处理 Content-Disposition 请求头获取文件名）。 |

### 🔐 编解码与安全

| 工具 | 路由 | 功能说明 |
| --- | --- | --- |
| Base64 编解码 | `/base64` | 快速进行 Base64 文本的互转及复制。 |
| 图片转 Base64 | `/image-to-base64` | 支持图片预览、格式检测及多种输出语法（CSS/HTML）。 |
| Base64 转图片 | `/base64-to-image` | 将 Base64 还原为图片并提供详细指标及下载。 |
| URL 编解码 | `/url-encode` | 处理 URI 字符串中的特殊字符转义，解决中文乱码。 |
| Unicode 编码转换 | `/unicode-converter` | 提供文本与 Unicode 转义序列 (\uXXXX)、HTML 字符实体间的双向转换。 |
| HTML 编解码 | `/html-encode` | 对 HTML 特殊字符 (&lt;, &gt;, &amp;, &quot;) 进行实体转义与还原，避免误解析。 |
| Hash 生成器 | `/hash-gen` | 本地计算 MD5, SHA1, SHA256 等摘要，支持文件/文本，保证隐私。 |
| 密码生成器 | `/password-generator` | 支持长度、字符集自定义，可排除混淆字符，支持强密码批量生成。 |

### 📊 数据转换与便民

| 工具 | 路由 | 功能说明 |
| --- | --- | --- |
| 时间戳转换 | `/timestamp-converter` | Unix 时间戳（秒/毫秒）与日期互转，支持 **全球 27 个时区**。 |
| 二维码生成器 | `/qrcode-generator` | 自定义 Logo、颜色、尺寸，快速生成并下载高清二维码。 |
| MP3 截取 | `/mp3-cutter` | 上传 MP3 后选择时间段，支持片段实时试听并导出为 MP3。 |
| 身份证生成器 | `/id-card-generator` | 生成符合校验位规则的虚拟身份证号，用于研发联调模拟。 |
| 颜色转换器 | `/color-converter` | 支持 HEX / RGB / HSL 联动转换，自动生成衍生色（Tints/Shades）及 UI 状态色。 |
| 进制转换 | `/base-converter` | 支持 2, 8, 10, 16 进制实时互转，支持 BigInt 大数及分段预览。 |
| CSS 渐变生成器 | `/css-gradient` | 本地生成跨浏览器兼容的线性/径向渐变代码，支持多色预设与随机化。 |

### 🚀 运维与部署备查

| 工具 | 路由 | 功能说明 |
| --- | --- | --- |
| Docker 备查 | `/docker-commands` | 镜像、容器、网络、Compose 等分类整理的常用 Docker 命令集。 |
| Nginx 备查 | `/nginx-reference` | 包含常用 CLI 命令及反向代理、SSL 等常用配置模板。 |

## 技术栈

- **框架**: [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`)
- **构建**: [Vite 7](https://vitejs.dev/)
- **UI**: [Element Plus](https://element-plus.org/)
- **工具库**: [VueUse](https://vueuse.org/), [Day.js](https://day.js.org/) (时区处理)
- **工程化**: [unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import), [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components), [unplugin-icons](https://github.com/unplugin/unplugin-icons)
- **算法/解析**: `mermaid`, `hash-wasm`, `figlet`, `canvas`, `vue-diff`, `pdfjs-dist`, `@open-file-viewer/vue`

## 快速开始

1. **克隆并安装依赖**:
   ```bash
   npm install
   ```
2. **启动开发环境**:
   ```bash
   npm run dev
   ```
3. **构建生产版本**:
   ```bash
   npm run build
   ```

## 项目结构

```text
src/
├─ config/
│  └─ tool-categories.js    # 导航、分类及工具元数据配置 (驱动型)
├─ views/
│  ├─ ascii-banner/         # ASCII 艺术字生成 (New!)
│  ├─ pdm-parser/           # PDM 解析 (New!)
│  ├─ regex-tester/         # 正则表达式测试 (New!)
│  ├─ mp3-cutter/           # MP3 音频截取 (New!)
│  ├─ base-converter/       # 进制转换
│  ├─ image-to-base64/      # 图片转 Base64
│  ├─ base64-to-image/      # Base64 转图片
│  ├─ timestamp-converter/   # 时间戳转换
│  ├─ unicode-converter/    # Unicode 编码转换 (New!)
│  ├─ html-encode/           # HTML 编解码 (New!)
│  ├─ css-gradient/         # CSS 渐变生成器 (New!)
│  ├─ file-viewer/          # 文件在线预览 (New!)
│  ├─ ...                   # 其他工具页面
├─ layout/                  # 响应式布局组件
├─ router/                  # 动态路由配置
├─ utils/
│  └─ nprogress.js          # 增强型进度条控制 (带防抖优化)
├─ App.vue
└─ main.js                  # 入口文件
```

## 开发约定

- **自动导入**: 项目已启用全量自动导入，Vue API、Element Plus 组件、VueUse 方法、Iconify 图标（前缀为 `IconEp`）等**无需手动 import**。
- **配置驱动**: 新增工具需在 `src/config/tool-categories.js` 补充元数据，首页和菜单将自动渲染。
- **命名规范**: 页面目录使用 `kebab-case`，路由名使用 `camelCase`。

## 注意事项

- **数据隐私**: 所有转换逻辑（如 Hash、密码、图片处理）均在浏览器本地完成，**绝不上传**您的任何隐私数据。
- **合规使用**: 身份证生成等工具仅供研发调试使用，严禁用于任何非法途径。

## 🛣️ 发展路线图 (Roadmap)

### 🛠️ 研发与文本处理
- [x] **文本差异比对**：支持 Split / Unified 视图与超大代码/文本差异比对
- [x] **ASCII 艺术字生成**：支持 Spring Boot Banner 风格与多字体预设
- [x] **PowerDesigner 解析**：本地解析 PDM 文件提取表结构并导出文档
- [x] **文件在线预览**：支持 PDF、Office 文档、图片、音视频及压缩包本地在线预览
- [x] **正则在线测试**：支持实时分组匹配与常用正则表达式库

### 🔐 编解码与安全
- [x] **Base64 编解码**：支持文本/图片双向转换与 Data URI 生成
- [x] **Unicode 编码转换**：支持文本与 Unicode 转义序列 (`\uXXXX`) 及 HTML 字符实体互转
- [x] **HTML 编解码**：对 HTML 敏感字符（`<`, `>`, `&`, `"`, `'`）进行实体转义与还原
- [x] **摘要计算与强密码生成**：支持 MD5/SHA1/SHA256 摘要与高强度规则随机密码生成

### 📊 数据转换与实用功能
- [x] **全球 27 时区时间戳转换**：接入 Day.js 提供精准全球时区转换与格式化
- [x] **多进制转换器**：支持 2 / 8 / 10 / 16 进制大数实时互转
- [x] **CSS 渐变生成器**：支持线性/径向渐变在线预览与 CSS 代码一键导出

### 📌 规划中功能 (Upcoming Features)
- [ ] **图片在线压缩与裁剪**：支持质量调优、常用尺寸压制与 WebP 格式导出
- [ ] **JWT 解码与校验**：解析 Header/Payload、签名状态及 Token 过期时间推算
- [ ] **Cron 表达式生成与测试**：可视化配置定时任务 Cron 表达式及运行时间推演
- [ ] **单元测试体系**：引入 Vitest 建立核心编解码与数据解析算法自动化测试
