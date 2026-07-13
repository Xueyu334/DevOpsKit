import Prism from 'prismjs'

// 在模块顶级作用域中，将 Prism 挂载至全局 window 上
// 这可以保证基于 ESM 加载顺序（深度优先自上而下），该挂载会在其他依赖全局 Prism 的库（如 vue-diff、marked-prism 等）被评估执行前最先完成
window.Prism = Prism
