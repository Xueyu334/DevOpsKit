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
      ElementPlus()
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
      sourcemap: false, // 生产环境是否生成 source map（建议为 false，减少体积、防源码泄露）
      chunkSizeWarningLimit: 1500, // 触发大文件体积警告的阈值 (单位 kb)
      rollupOptions: {
        output: {
          // 静态资源分类打包，让所有的文件都有自己的独立目录
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          // 只保留少量稳定 vendor chunk，避免按包拆分导致请求数过多
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('element-plus')) return 'element-plus'
              if (
                id.includes('/vue/') ||
                id.includes('/@vue/') ||
                id.includes('vue-router') ||
                id.includes('@vueuse')
              ) {
                return 'vue'
              }
              return 'vendor'
            }
          }
        }
      }
    }
  }
})
