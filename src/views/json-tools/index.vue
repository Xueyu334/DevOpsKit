<template>
  <div class="app-container">
    <div class="tool-header mb-4">
      <div class="tool-title">
        <span class="icon-bracket">{ }</span>
        JSON在线解析
        <span class="subtitle">(双击自动格式化)</span>
      </div>
      <div>
        <el-popover placement="bottom-end" title="渲染设置" :width="180" trigger="click">
          <template #reference>
            <el-button plain>
              <template #icon>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path
                    d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </template>
              显示选项
            </el-button>
          </template>
          <div style="display: flex; flex-direction: column; padding-top: 8px;">
            <el-checkbox v-model="options.color" @change="debouncedUpdate" style="margin-right: 0;">JSON
              着色渲染</el-checkbox>
            <el-checkbox v-model="options.showIndex" @change="debouncedUpdate"
              style="margin-right: 0;">显示数组索引</el-checkbox>
            <el-checkbox v-model="options.showType" @change="debouncedUpdate"
              style="margin-right: 0;">显示数据类型</el-checkbox>
            <el-checkbox v-model="options.compress" @change="debouncedUpdate"
              style="margin-right: 0;">同行紧凑输出</el-checkbox>
          </div>
        </el-popover>
      </div>
    </div>

    <div class="panel-container" ref="containerRef">
      <div class="panel left-panel" :style="{ flex: `0 0 ${leftWidth}px` }">
        <div class="panel-header">
          <div class="font-bold">RAW INPUT</div>
          <div class="flex gap-2">
            <el-button size="small" plain @click="handleFormat">格式化</el-button>
            <el-button size="small" plain @click="handleCompress">压缩</el-button>
            <el-button size="small" plain @click="handleEscape">转义</el-button>
            <el-button size="small" plain @click="handleUnescape">去转义</el-button>
            <el-button size="small" type="danger" plain @click="handleClear" title="清空" style="padding: 5px 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </el-button>
          </div>
        </div>
        <textarea v-model="rawInput" class="editor-area" spellcheck="false"
          placeholder="在此输入或粘贴您的 JSON 数据... (双击任意处自动格式化)" @input="debouncedUpdate" @dblclick="handleFormat"></textarea>
      </div>

      <div class="gutter" @mousedown="startResizing"></div>

      <div class="panel right-panel">
        <div class="panel-header" :class="{ 'error-header': hasError }">
          <div style="flex: 1;">String Parse (Strict)</div>
          <div style="flex: 1; padding-left: 8px;">JS Eval (Relaxed)</div>
        </div>
        <div class="result-area">
          <div class="parse-col" v-html="stringResultHtml" @click="handleToggle"></div>
          <div class="eval-col" v-html="evalResultHtml" @click="handleToggle"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

const rawInput = ref('');
const options = reactive({
  color: true,
  compress: false,
  showIndex: false,
  showType: false
});

const stringResultHtml = ref('<span class="status-tip">等待输入...</span>');
const evalResultHtml = ref('<span class="status-tip">等待输入...</span>');
const hasError = ref(false);

const leftWidth = ref(400); // 初始左侧面板宽度
const containerRef = ref(null);
let isResizing = false;

import JsonWorker from './json.worker.js?worker';

let worker = null;

onMounted(() => {
  worker = new JsonWorker();

  worker.onmessage = function (e) {
    const { id, success, html, error } = e.data;

    if (id === 'strict') {
      if (success) {
        stringResultHtml.value = html;
        hasError.value = false;
      } else {
        stringResultHtml.value = `<div class="error-box">Error: ${error}</div>`;
        hasError.value = true;
      }
    } else if (id === 'relaxed') {
      if (success) {
        evalResultHtml.value = html;
      } else {
        evalResultHtml.value = `<div class="error-box italic">Eval error: ${error}</div>`;
      }
    }
  };

  // 绑定全局鼠标事件处理拖拽
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopResizing);

  // 容器初始大小适配
  if (containerRef.value) {
    leftWidth.value = containerRef.value.getBoundingClientRect().width * 0.4;
  }
});

onUnmounted(() => {
  if (worker) worker.terminate();
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResizing);
});

// 节流工具
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const update = () => {
  const val = rawInput.value.trim();
  if (!val) {
    stringResultHtml.value = '<span class="status-tip">等待输入...</span>';
    evalResultHtml.value = '<span class="status-tip">等待输入...</span>';
    hasError.value = false;
    return;
  }

  const workerOptions = {
    compress: options.compress,
    showIndex: options.showIndex,
    showType: options.showType,
    color: options.color
  };

  worker.postMessage({ id: 'strict', type: 'strict', content: val, options: workerOptions });
  worker.postMessage({ id: 'relaxed', type: 'relaxed', content: val, options: workerOptions });
};

const debouncedUpdate = debounce(update, 300);

// 折叠树的事件代理
const handleToggle = (e) => {
  const target = e.target;
  if (target && target.classList.contains('json-toggle')) {
    const parent = target.parentElement;
    const list = parent.querySelector('.json-tree');
    const indicator = parent.querySelector('.json-size-indicator');

    if (list.classList.contains('folded')) {
      list.classList.remove('folded');
      if (indicator) indicator.style.display = 'none';
      target.innerText = '-';
    } else {
      list.classList.add('folded');
      if (indicator) indicator.style.display = 'inline';
      target.innerText = '+';
    }
  }
};

// 工具栏功能
const handleClear = () => {
  rawInput.value = '';
  stringResultHtml.value = '<span class="status-tip">等待输入...</span>';
  evalResultHtml.value = '<span class="status-tip">等待输入...</span>';
  hasError.value = false;
};

const handleFormat = () => {
  const val = rawInput.value.trim();
  if (!val) return;
  try {
    let obj;
    try {
      obj = JSON.parse(val);
    } catch (e) {
      obj = new Function(`return (${val})`)();
    }
    rawInput.value = JSON.stringify(obj, null, 2);
    update();
    ElMessage.success('格式化完成');
  } catch (e) {
    ElMessage.error('格式化失败: ' + e.message);
  }
};

const handleCompress = () => {
  const val = rawInput.value.trim();
  if (!val) return;
  try {
    let obj;
    try {
      obj = JSON.parse(val);
    } catch (e) {
      obj = new Function(`return (${val})`)();
    }
    rawInput.value = JSON.stringify(obj);
    update();
    ElMessage.success('压缩完成');
  } catch (e) {
    ElMessage.error('压缩失败: ' + e.message);
  }
};

const handleUnescape = () => {
  let val = rawInput.value.trim();
  if (!val) return;

  try {
    if (val.startsWith('"') && val.endsWith('"')) {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'string') {
        rawInput.value = parsed;
        update();
        ElMessage.success('去除转义成功');
        return;
      }
    }
  } catch (e) { }

  val = val.replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\\n')
    .replace(/\\r/g, '\\r')
    .replace(/\\t/g, '\\t')
    .replace(/\\b/g, '\\b')
    .replace(/\\f/g, '\\f');

  if (val.startsWith('"') && val.endsWith('"')) {
    let inner = val.slice(1, -1);
    if ((inner.startsWith('{') && inner.endsWith('}')) || (inner.startsWith('[') && inner.endsWith(']'))) {
      val = inner;
    }
  }

  rawInput.value = val;
  update();
  ElMessage.success('部分去除转义完成');
};

const handleEscape = () => {
  let val = rawInput.value.trim();
  if (!val) return;

  try {
    let obj;
    try { obj = JSON.parse(val); } catch (e) { obj = new Function(`return (${val})`)(); }
    val = JSON.stringify(obj);
  } catch (e) { }

  rawInput.value = JSON.stringify(val);
  update();
  ElMessage.success('添加转义完成');
};

// 拖动布局逻辑
const startResizing = () => {
  isResizing = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const handleMouseMove = (e) => {
  if (!isResizing || !containerRef.value) return;
  const containerRect = containerRef.value.getBoundingClientRect();
  const newLeftWidth = e.clientX - containerRect.left;
  if (newLeftWidth > 200 && newLeftWidth < containerRect.width - 200) {
    leftWidth.value = newLeftWidth;
  }
};

const stopResizing = () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = '';
  }
};

</script>

<style scoped>
.app-container {
  padding: 24px;
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
}

.mb-4 {
  margin-bottom: 16px;
}

.flex {
  display: flex;
}

.gap-2 {
  gap: 8px;
}

/* 头部件 */
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tool-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-bracket {
  font-family: inherit;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 20px;
  color: #6366f1;
  background: #eef2ff;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
}

html.dark .icon-bracket {
  background: rgba(99, 102, 241, 0.2);
}

.subtitle {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 4px 10px;
  border-radius: 6px;
}

.font-bold {
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* 布局区域 */
.panel-container {
  display: flex;
  flex: 1;
  min-height: 0;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
}

/* 面板通用 */
.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color);
}

.left-panel {
  border-right: 1px solid var(--el-border-color-light);
}

.right-panel {
  flex: 1;
}

/* 顶部标题栏 */
.panel-header {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-header {
  background: var(--el-color-danger) !important;
  color: #fff !important;
}

/* 编辑区 */
.editor-area {
  flex: 1;
  width: 100%;
  border: none;
  padding: 16px;
  font-family: inherit;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  resize: none;
  outline: none;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  line-height: 1.5;
}

.editor-area::placeholder {
  color: var(--el-text-color-placeholder);
}

/* 结果区 */
.result-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.parse-col,
.eval-col {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
}

.parse-col {
  border-right: 1px solid var(--el-border-color-light);
}

.pl-8 {
  padding-left: 8px;
}

.status-tip {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.error-box {
  color: var(--el-color-danger);
  padding: 12px;
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: 4px;
  background: var(--el-color-danger-light-9);
}

/* 伸缩条 (Resizer) */
.gutter {
  width: 10px;
  margin: 0 -5px;
  cursor: col-resize;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.15s ease;
  flex: 0 0 auto;
  z-index: 10;
  position: relative;
}

.gutter:hover {
  background: var(--el-color-primary-light-9);
}

.gutter::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 40px;
  background: var(--el-border-color);
  border-radius: 2px;
  transition: all 0.15s ease;
  left: 50%;
  transform: translateX(-50%);
}

.gutter:hover::after {
  background: var(--el-color-primary);
  height: 60px;
}

/* ---- 以下为通过 v-html 灌入的 JSON 解析器核心 CSS ---- */
:deep(.json-tree) {
  line-height: 1.5;
  list-style: none;
  padding-left: 20px;
  margin: 0;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.json-tree li) {
  position: relative;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 展开收起按钮 */
:deep(.json-toggle) {
  cursor: pointer;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  user-select: none;
  margin-right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  line-height: 1;
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
  font-size: 10px;
  background: var(--el-fill-color-blank);
}

:deep(.json-toggle:hover) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

:deep(.folded) {
  display: none;
}

:deep(.json-size-indicator) {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
  padding: 0 4px;
}

/* 语法高亮色系 mapped element plus darkmode compatible */
:deep(.json-key-0) {
  color: #ef4444;
}

:deep(.json-key-1) {
  color: #f97316;
}

:deep(.json-key-2) {
  color: #d97706;
}

:deep(.json-key-3) {
  color: #84cc16;
}

:deep(.json-key-4) {
  color: #10b981;
}

:deep(.json-key-5) {
  color: #06b6d4;
}

:deep(.json-key-6) {
  color: #3b82f6;
}

:deep(.json-key-7) {
  color: #8b5cf6;
}

:deep(.json-key-8) {
  color: #d946ef;
}

:deep(.json-string) {
  color: #059669;
}

:deep(.json-number) {
  color: #7c3aed;
  font-weight: 500;
}

:deep(.json-boolean) {
  color: #ea580c;
  font-weight: 600;
}

:deep(.json-null) {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

:deep(.json-bracket) {
  color: var(--el-text-color-regular);
}

:deep(.json-key) {
  font-weight: 500;
}

/* 暗色模式强兼容 */
html.dark :deep(.json-string) {
  color: #34d399;
}

html.dark :deep(.json-number) {
  color: #a78bfa;
}

html.dark :deep(.json-boolean) {
  color: #fb923c;
}

html.dark :deep(.json-key-0) {
  color: #fca5a5;
}

html.dark :deep(.json-key-1) {
  color: #fdba74;
}

html.dark :deep(.json-key-4) {
  color: #6ee7b7;
}

html.dark :deep(.json-key-6) {
  color: #93c5fd;
}

:deep(.json-type) {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  font-weight: 500;
  opacity: 0.6;
  margin-left: 6px;
  text-transform: uppercase;
}

:deep(.type-string) {
  color: #10b981;
}

:deep(.type-number) {
  color: #8b5cf6;
}

:deep(.type-boolean) {
  color: #f59e0b;
}

:deep(.type-object) {
  color: #f43f5e;
}

:deep(.type-array) {
  color: #3b82f6;
}
</style>
