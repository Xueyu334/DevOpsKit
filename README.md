# DevOpsKit

DevOpsKit 是一个基于 Vue 3 + Vite + Element Plus 构建的前端工具箱，面向研发、测试和运维场景，提供文本处理、字符编码速查、编解码、摘要计算和测试数据生成等常用能力。

**演示地址：[https://www.xueyu123.work/dev-ops-kit](https://www.xueyu123.work/dev-ops-kit)**

项目当前以 SPA 形式运行，首页和顶部导航由配置驱动，新增工具时只需要补页面、路由和配置即可接入。

## 当前功能

### 文本与代码处理

| 工具 | 路由 | 功能说明 |
| --- | --- | --- |
| 文本比对 | `/text-diff` | 支持普通文本和代码差异对比，提供并排和统一视图。 |
| JSON 工具 | `/json-tools` | 提供 JSON 格式化、压缩、解析和结构查看能力。 |
| ASCII 码对照表 | `/ascii-table` | 查看 `0-127` ASCII 十进制、十六进制、二进制、字符与控制符说明，支持按十进制、十六进制、二进制、字符和控制符缩写快速检索。 |

### 编解码与加密

| 工具 | 路由 | 功能说明 |
| --- | --- | --- |
| Base64 编解码 | `/base64` | 支持文本 Base64 编码、解码和复制。 |
| Hash 生成器 | `/hash-gen` | 在浏览器本地计算文本摘要，支持 `MD5`、`SHA-1`、`SHA-256`、`SHA-384`、`SHA-512`，支持单项复制和全部复制。 |

### 网络与其它配置

| 工具 | 路由 | 功能说明 |
| --- | --- | --- |
| URL 编解码 | `/url-encode` | 支持 URL / URI 编码与解码。 |

### 容器与部署

| 工具 | 路由 | 功能说明 |
| --- | --- | --- |
| Docker 命令速查 | `/docker-commands` | 分类展示 Docker 常用命令（镜像、容器、网络、数据卷、系统、Compose），支持关键词模糊搜索与高亮。 |
| Nginx 参考手册 | `/nginx-reference` | 分类展示 Nginx 常用命令与配置片段（基础命令、进程控制、日志排查、配置示例），支持关键词模糊搜索与高亮。 |

### 便民与生成

| 工具 | 路由 | 功能说明 |
| --- | --- | --- |
| 身份证号码生成器 | `/id-card-generator` | 支持区域码自动提示、生日和性别输入，生成符合校验位规则的 18 位号码，仅用于测试和演示。 |
| 二维码生成器 | `/qrcode-generator` | 根据输入的文本或链接生成高度自定义的二维码，支持 Logo、颜色、尺寸调节及导出。 |
| Mermaid 图表渲染 | `/mermaid-editor` | 支持 Mermaid 语法的实时渲染，可导出为 SVG 或 PNG 图片。 |

## 技术栈

```text
- Vue 3
- Vite 7
- Vue Router 5
- Element Plus
- VueUse
- mermaid
- hash-wasm
- china-area-data
- fuse.js
- vue-diff
- qrcode.vue
- unplugin-auto-import
- unplugin-vue-components
- unplugin-icons
- vite-plugin-compression
- vite-plugin-vue-devtools
```

## 运行要求

- Node.js: `^20.19.0 || >=22.12.0`
- npm: 建议使用与 Node.js 配套的较新版本

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

默认使用 Vite 开发服务器，端口为 `5173`，监听 `0.0.0.0`，并自动打开浏览器。

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 本地预览构建结果

```bash
npm run preview
```

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动本地开发服务 |
| `npm run build` | 构建生产包 |
| `npm run preview` | 本地预览生产构建 |

## 项目结构

```text
src/
├─ assets/                  # 全局样式和静态资源
├─ composables/             # 可复用逻辑，如 useUniversalSearch
├─ utils/                   # 纯 JS 工具函数，如文本转义、高亮等
├─ config/
│  └─ tool-categories.js    # 首页工具分类与导航配置
├─ layout/                  # 页面整体布局
├─ router/
│  └─ index.js              # 路由定义与页面标题处理
├─ views/
│  ├─ Home.vue              # 首页
│  ├─ text-diff/            # 文本比对
│  ├─ json-tools/           # JSON 工具
│  ├─ ascii-table/          # ASCII 码对照表
│  ├─ base64/               # Base64 编解码
│  ├─ hash-gen/             # Hash 生成器
│  ├─ url-encode/           # URL 编解码
│  ├─ docker-commands/      # Docker 命令速查
│  ├─ nginx-reference/      # Nginx 参考手册
│  ├─ id-card-generator/    # 身份证号码生成器
│  ├─ qrcode-generator/     # 二维码生成器
│  ├─ mermaid-editor/       # Mermaid 图表渲染
│  └─ not-found/            # 404 页面
├─ auto-imports.d.ts        # 自动导入类型声明
├─ components.d.ts          # 自动注册组件类型声明
├─ App.vue
└─ main.js
```

## 开发约定

### UI 与页面实现

- 优先使用 Element Plus 组件，不重复造基础 UI。
- 新页面优先使用 Vue 3 Composition API 和 `<script setup>`。
- 页面目录使用 kebab-case，例如 `id-card-generator`、`hash-gen`。
- 路由名使用 camelCase，例如 `idCardGenerator`、`hashGen`。

### 自动导入

项目已启用以下自动导入和自动注册能力：

- Vue API
- Vue Router API
- VueUse API
- Element Plus 组件与常用 API
- Iconify 图标组件（当前启用 `ep` 图标集，组件前缀为 `Icon`）

例如可以直接使用：

```vue
<IconEpInfoFilled />
```

如果现有自动导入已覆盖，不要再手动添加重复 import。

### 公共能力

- 文本处理工具（如转义、高亮、归一化）统一存放在 `src/utils/text.js`。
- 模糊搜索逻辑统一封装在 `src/composables/useUniversalSearch.js`。
- 文本复制统一通过 `src/composables/useCopyText.js` 处理。
- 需要复用的逻辑优先抽到 `composables/` 或 `utils/`，避免散落在页面中重复实现。
- 工具内聚逻辑可以放在各自页面目录下，例如 `src/views/ascii-table/composables/`。
- 首页卡片、顶部菜单和工具分类都由 `src/config/tool-categories.js`驱动。

## 配置说明

### `VITE_PUBLIC_PATH`

Vite 的 `base` 通过 `VITE_PUBLIC_PATH` 控制：

```bash
VITE_PUBLIC_PATH=/
```

部署到子路径时可这样设置：

```bash
VITE_PUBLIC_PATH=/devopskit/
```

未设置时默认使用 `/`。

## 构建与部署

项目为纯前端静态站点，`npm run build` 后可直接部署 `dist/` 到任意静态资源服务器，例如：

- Nginx
- OSS / COS 静态网站托管
- Vercel
- Netlify
- GitHub Pages

当前构建配置包括：

- 生产环境关闭 sourcemap
- 超过阈值的资源自动生成 gzip 文件
- 依赖按包进行 chunk 拆分

## 如何新增一个工具

通常按下面步骤接入：

1. 在 `src/views/` 下创建工具目录和页面文件。
2. 在 `src/router/index.js` 中注册路由。
3. 在 `src/config/tool-categories.js` 中补充工具元数据。
4. 如有公共逻辑，抽取到 `src/composables/` 或其他共享模块。
5. 运行 `npm run build` 验证打包是否通过。

如果工具涉及图标，优先直接使用已接入的 Iconify 自动注册组件。

## 手动验证建议

当前仓库未集成自动化测试，提交前建议至少完成以下检查：

- 执行 `npm run build`
- 验证首页卡片跳转是否正常
- 验证本次修改涉及的工具流程
- 验证 ASCII 搜索、结果联动和总表高亮是否正常
- 验证浅色 / 深色主题下的显示是否正常
- 验证桌面端和移动端布局是否可用

## 注意事项

- Hash 生成器当前面向文本摘要场景，计算在浏览器本地完成，不会上传输入文本。
- `MD5` 和 `SHA-1` 仅适合兼容、校验等非安全敏感场景，不建议用于新的安全设计。
- 身份证号码生成器仅用于测试、联调和演示，不得用于任何违法或不当用途。
- 首页中带有预留入口的工具不代表已经具备可用实现。

## Roadmap

- 补充更多通用编解码和摘要能力
- 逐步补充自动化测试
- 继续优化首页检索、分类和工具体验
- 补充更多容器与部署相关工具（如 Kubernetes 命令速查）
