import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'
import ElementPlus from 'unplugin-element-plus/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  const env = loadEnv(mode, process.cwd(), '')
  const publicBase = env.VITE_PUBLIC_PATH?.trim() || '/'

  return {
    plugins: [
      vue(),
      vueJsx(),
      command === 'serve' ? vueDevTools() : null,
      AutoImport({
        imports: ['vue', 'vue-router', '@vueuse/core'], // 开启对应库的 API 自动导入
        resolvers: [
          ElementPlusResolver(),
          IconsResolver({
            prefix: 'Icon',
            enabledCollections: ['ep']
          })
        ],
        dts: fileURLToPath(new URL('./src/auto-imports.d.ts', import.meta.url)),
        eslintrc: {
          enabled: false // 1、改为true用于生成eslint配置。2、生成后改回false，避免重复生成消耗
        }
      }),
      Components({
        resolvers: [
          ElementPlusResolver(),
          IconsResolver({
            prefix: 'Icon',
            enabledCollections: ['ep']
          })
        ],
        dts: fileURLToPath(new URL('./src/components.d.ts', import.meta.url))
      }),
      Icons({
        autoInstall: true
      }),
      // 配置 gzip 压缩，体积大于 10KB 的文件进行压缩
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz'
      }),
      ElementPlus(),
      visualizer({
        open: false,
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: publicBase, // 部署基本路径将根据环境变量 `.env` 决定，空字符串回退为根路径
    server: {
      port: 5173, // 端口号
      host: '0.0.0.0', // 监听所有网卡，允许局域网手机访问（需通过 IP）
      open: true, // 启动后是否自动打开浏览器
      cors: true // 允许跨域
      // proxy: {      // 本地开发代理配置，用于解决接口跨域问题
      //   '/api': {
      //     target: 'http://localhost:8080', // 后端接口地址
      //     changeOrigin: true, // 是否改变源地址
      //     rewrite: (path) => path.replace(/^\/api/, '') // 路径重写
      //   }
      // }
    },
    build: {
      outDir: 'dist', // 打包输出的文件夹名
      sourcemap: mode === 'preview', // 预览模式开启 sourcemap 以便调试，生产环境保持关闭
      chunkSizeWarningLimit: 1500, // 触发大文件体积警告的阈值 (单位 kb)
      rollupOptions: {
        // 告诉打包工具哪些库不需要打包进最终的 bundle
        external: ['mermaid', 'vue', 'vue-demi', 'vue-router'],
        output: {
          // 将外部依赖映射到 CDN 地址，利用浏览器原生的 ESM 加载能力
          paths: {
            'vue': 'https://cdn.jsdelivr.net/npm/vue@3.5.30/+esm',
            'vue-router': 'https://cdn.jsdelivr.net/npm/vue-router@5.0.4/+esm',
            'vue-demi': 'https://cdn.jsdelivr.net/npm/vue-demi@0.14.10/+esm',
            'mermaid': 'https://cdn.jsdelivr.net/npm/mermaid@11.14.0/dist/mermaid.esm.min.mjs'
          },
          // 静态资源分类打包，让所有的文件都有自己的独立目录
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          // 优化分包策略，将体积较大的库拆分出来
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 核心 UI 库
              if (id.includes('element-plus')) {
                return 'element-plus'
              }
              // 巨型数据文件
              if (id.includes('china-area-data')) {
                return 'china-area-data'
              }
              // 文本搜索处理库
              if (id.includes('fuse.js')) {
                return 'fuse'
              }
              // 其他稳定库
              if (id.includes('hash-wasm')) {
                return 'hash-wasm'
              }
              if (id.includes('vue-diff')) {
                return 'vue-diff'
              }
              if (id.includes('figlet')) {
                return 'figlet'
              }

              // 其他第三方库进入 vendor
              return 'vendor'
            }
          }
        }
      }
    }
  }
})
