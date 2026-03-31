# DevOpsKit

DevOpsKit 是一个基于 Vue 3 + Vite + Element Plus 构建的前端工具箱项目，面向研发、测试和运维场景，提供常见文本处理、编码转换和测试数据生成能力。

项目当前以单页应用（SPA）的形式运行，首页通过配置驱动展示工具卡片，已实现的工具可直接访问，对外预留了后续扩展入口。

## 功能概览

### 已实现

| 工具 | 路由 | 说明 |
| --- | --- | --- |
| 文本比对 | `/text-diff` | 支持普通文本和代码差异对比，提供并排和统一视图。 |
| JSON 工具 | `/json-tools` | 提供 JSON 格式化、压缩、解析和结构查看能力。 |
| Base64 编解码 | `/base64` | 支持文本 Base64 编码、解码和复制。 |
| URL 编解码 | `/url-encode` | 支持 URL / URI 编码与解码。 |
| 身份证号码生成器 | `/id-card-generator` | 按区域码、生日、性别生成符合校验规则的 18 位号码，仅用于测试和演示。 |

### 已预留入口

- Hash 生成器
- Cron 表达式工具

这些工具已在首页配置中预留展示位，但当前尚未实现完整页面。

## 技术栈

- Vue 3
- Vite
- Vue Router
- Element Plus
- VueUse
- `unplugin-auto-import`
- `unplugin-vue-components`
- `vite-plugin-compression`

## 运行要求

- Node.js: `^20.19.0 || >=22.12.0`
- npm: 建议使用与 Node.js 配套的较新版本

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

默认使用 Vite 开发服务器，端口为 `5173`，并监听 `0.0.0.0`，便于局域网设备访问。

### 3. 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 4. 本地预览构建结果

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
├─ config/
│  └─ tool-categories.js    # 首页工具分类与卡片配置
├─ layout/                  # 页面整体布局
├─ router/
│  └─ index.js              # 路由定义和页面标题处理
├─ views/
│  ├─ Home.vue              # 首页
│  ├─ text-diff/            # 文本比对
│  ├─ json-tools/           # JSON 工具
│  ├─ base64/               # Base64 编解码
│  ├─ url-encode/           # URL 编解码
│  ├─ id-card-generator/    # 身份证号码生成器
│  └─ not-found/            # 404 页面
├─ App.vue
└─ main.js
```

## 开发约定

### UI 组件

项目使用 Element Plus 作为主要 UI 组件库。新增功能时，优先复用 Element Plus 组件，避免重复造轮子。

### 自动导入

项目已启用：

- Vue API 自动导入
- Vue Router API 自动导入
- VueUse API 自动导入
- Element Plus 组件自动导入

如果现有能力已覆盖，不要再手动添加重复 import。

### 目录与命名

- 页面目录使用 kebab-case，例如 `id-card-generator`
- 路由名使用 camelCase，例如 `idCardGenerator`
- 视图文件优先使用 Vue 3 Composition API 和 `<script setup>`

## 配置说明

### `VITE_PUBLIC_PATH`

Vite 的 `base` 通过 `VITE_PUBLIC_PATH` 控制：

```bash
VITE_PUBLIC_PATH=/
```

适用于部署到子路径场景，例如：

```bash
VITE_PUBLIC_PATH=/devopskit/
```

如果未设置，默认使用 `/`。

## 构建与部署

项目为纯前端静态站点，`npm run build` 后可直接部署 `dist/` 目录到任意静态资源服务器，例如：

- Nginx
- OSS / COS 静态网站托管
- Vercel
- Netlify
- GitHub Pages

当前构建配置包括：

- 关闭生产环境 sourcemap
- 对超过阈值的资源生成 gzip 压缩文件
- 按依赖进行 chunk 拆分

## 如何新增一个工具

新增工具时，通常需要以下几步：

1. 在 `src/views/` 下创建新的工具目录和页面文件。
2. 在 `src/router/index.js` 中注册路由。
3. 在 `src/config/tool-categories.js` 中补充卡片元数据。
4. 如需公共逻辑或样式，再抽取到 `src/assets/` 或独立模块。
5. 运行 `npm run build` 验证是否可正常打包。

## 手动验证建议

当前仓库未集成自动化测试。提交前建议至少完成以下检查：

- 执行 `npm run build`
- 验证首页卡片跳转是否正常
- 验证本次修改涉及的工具流程
- 验证浅色 / 深色主题下的显示是否正常
- 验证移动端和窄屏下的布局是否可用

## 注意事项

- 身份证号码生成器仅用于测试、联调和演示，不得用于任何违法或不当用途。
- 首页中带有预留入口的工具不代表已经具备可用实现。

## Roadmap

- 完成 Hash 生成器
- 完成 Cron 表达式工具
- 逐步补充自动化测试
- 继续优化首页检索与工具分类体验
