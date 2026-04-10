import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// NProgress 基础配置
NProgress.configure({
  showSpinner: false,
  easing: 'ease',
  speed: 400,
  minimum: 0.2
})

let loadCount = 0
let startTimer = null

/**
 * 启动进度条 (带延迟控制以防止闪烁)
 * @param {boolean} immediate 是否立即执行 (默认带有 200ms 延迟)
 */
export function startProgress(immediate = false) {
  loadCount++

  // 核心优化：如果正在加载中，且没有强制立即开始的要求，则直接返回
  if (loadCount > 1) return

  // 设置新 Timer 前，务必先清理可能残留的旧 Timer (严格防御性编程)
  if (startTimer) {
    clearTimeout(startTimer)
    startTimer = null
  }

  if (immediate) {
    NProgress.start()
  } else {
    // 延迟 200ms 开启，避免超短时间任务导致进度条闪烁
    startTimer = setTimeout(() => {
      // 执行时二次校验：确保在 200ms 后依然处于加载状态
      if (loadCount > 0) {
        NProgress.start()
      }
      startTimer = null // 执行完毕后清理引用
    }, 200)
  }
}

/**
 * 结束进度条 (计数统计)
 */
export function doneProgress() {
  loadCount = Math.max(0, loadCount - 1)
  if (loadCount > 0) return

  if (startTimer) {
    clearTimeout(startTimer)
    startTimer = null
  }
  // 宁可多关，不可漏关，确保进度条状态最终一致
  NProgress.done()
}

/**
 * 强制重置并清除进度条 (用于错误、中断等极端情况)
 */
export function clearProgress() {
  loadCount = 0
  if (startTimer) {
    clearTimeout(startTimer)
    startTimer = null
  }
  // 在强制清理函数中，采取“宁可多关，不可漏关”的策略，100% 保证进度条关闭
  NProgress.done()
}

export default {
  start: startProgress,
  done: doneProgress,
  clear: clearProgress
}
