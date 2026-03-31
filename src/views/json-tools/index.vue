<script setup>
import {onMounted, onUnmounted, reactive, ref} from 'vue';
import {ElMessage} from 'element-plus';
import JsonWorker from './json.worker.js?worker';

const EMPTY_STATE_HTML = '<span class="status-tip">等待输入...</span>';

const renderOptionItems = [
  {key: 'color', label: 'JSON 着色渲染'},
  {key: 'showIndex', label: '显示数组索引'},
  {key: 'showType', label: '显示数据类型'},
  {key: 'compress', label: '同行紧凑输出'}
];

const rawInput = ref('');
const options = reactive({
  color: true,
  compress: false,
  showIndex: false,
  showType: false
});

const stringResultHtml = ref(EMPTY_STATE_HTML);
const evalResultHtml = ref(EMPTY_STATE_HTML);
const hasError = ref(false);

const leftWidth = ref(400);
const containerRef = ref(null);
let isResizing = false;
let worker = null;

const setIdleState = () => {
  stringResultHtml.value = EMPTY_STATE_HTML;
  evalResultHtml.value = EMPTY_STATE_HTML;
  hasError.value = false;
};

const buildErrorHtml = (message, modifierClass = '') =>
    `<div class="error-box${modifierClass ? ` ${modifierClass}` : ''}">${message}</div>`;

const parseJsonLike = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return new Function(`return (${value})`)();
  }
};

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
    setIdleState();
    return;
  }

  if (!worker) {
    return;
  }

  const workerOptions = {
    compress: options.compress,
    showIndex: options.showIndex,
    showType: options.showType,
    color: options.color
  };

  worker.postMessage({id: 'strict', type: 'strict', content: val, options: workerOptions});
  worker.postMessage({id: 'relaxed', type: 'relaxed', content: val, options: workerOptions});
};

const debouncedUpdate = debounce(update, 300);

const handleToggle = (e) => {
  const target = e.target;
  if (!target?.classList.contains('json-toggle')) {
    return;
  }

  const parent = target.parentElement;
  const list = parent?.querySelector('.json-tree');
  const indicator = parent?.querySelector('.json-size-indicator');

  if (!list) {
    return;
  }

  if (list.classList.contains('folded')) {
    list.classList.remove('folded');
    if (indicator) indicator.style.display = 'none';
    target.innerText = '-';
    return;
  }

  list.classList.add('folded');
  if (indicator) indicator.style.display = 'inline';
  target.innerText = '+';
};

const transformParsedInput = (formatter, successMessage, errorPrefix) => {
  const val = rawInput.value.trim();
  if (!val) {
    return;
  }

  try {
    rawInput.value = formatter(parseJsonLike(val));
    update();
    ElMessage.success(successMessage);
  } catch (e) {
    ElMessage.error(`${errorPrefix}: ${e.message}`);
  }
};

const handleClear = () => {
  rawInput.value = '';
  setIdleState();
};

const handleFormat = () => {
  transformParsedInput((obj) => JSON.stringify(obj, null, 2), '格式化完成', '格式化失败');
};

const handleCompress = () => {
  transformParsedInput((obj) => JSON.stringify(obj), '压缩完成', '压缩失败');
};

const handleUnescape = () => {
  let val = rawInput.value.trim();
  if (!val) {
    return;
  }

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
  } catch {
  }

  val = val.replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\\n')
      .replace(/\\r/g, '\\r')
      .replace(/\\t/g, '\\t')
      .replace(/\\b/g, '\\b')
      .replace(/\\f/g, '\\f');

  if (val.startsWith('"') && val.endsWith('"')) {
    const inner = val.slice(1, -1);
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
  if (!val) {
    return;
  }

  try {
    val = JSON.stringify(parseJsonLike(val));
  } catch {
  }

  rawInput.value = JSON.stringify(val);
  update();
  ElMessage.success('添加转义完成');
};

const startResizing = () => {
  isResizing = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const handleMouseMove = (e) => {
  if (!isResizing || !containerRef.value) {
    return;
  }

  const containerRect = containerRef.value.getBoundingClientRect();
  const newLeftWidth = e.clientX - containerRect.left;
  if (newLeftWidth > 200 && newLeftWidth < containerRect.width - 200) {
    leftWidth.value = newLeftWidth;
  }
};

const stopResizing = () => {
  if (!isResizing) {
    return;
  }

  isResizing = false;
  document.body.style.cursor = 'default';
  document.body.style.userSelect = '';
};

onMounted(() => {
  worker = new JsonWorker();

  worker.onmessage = (e) => {
    const {id, success, html, error} = e.data;

    if (id === 'strict') {
      if (success) {
        stringResultHtml.value = html;
        hasError.value = false;
      } else {
        stringResultHtml.value = buildErrorHtml(`Error: ${error}`);
        hasError.value = true;
      }
      return;
    }

    evalResultHtml.value = success ? html : buildErrorHtml(`Eval error: ${error}`, 'error-box--italic');
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopResizing);

  if (containerRef.value) {
    leftWidth.value = containerRef.value.getBoundingClientRect().width * 0.4;
  }
});

onUnmounted(() => {
  if (worker) worker.terminate();
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResizing);
});
</script>

<template>
  <div class="app-container">
    <div class="tool-header">
      <div class="tool-title">
        <span class="icon-bracket">{ }</span>
        JSON在线解析
        <span class="subtitle">(双击自动格式化)</span>
      </div>
      <el-popover :width="180" placement="bottom-end" title="渲染设置" trigger="click">
        <template #reference>
          <el-button plain>
            <template #icon>
              <el-icon>
                <IconEpSetting/>
              </el-icon>
            </template>
            显示选项
          </el-button>
        </template>
        <div class="settings-panel">
          <el-checkbox
              v-for="item in renderOptionItems"
              :key="item.key"
              v-model="options[item.key]"
              class="settings-checkbox"
              @change="debouncedUpdate"
          >
            {{ item.label }}
          </el-checkbox>
        </div>
      </el-popover>
    </div>

    <div ref="containerRef" class="panel-container">
      <div :style="{ flexBasis: `${leftWidth}px` }" class="panel left-panel">
        <div class="panel-header">
          <div class="panel-title">RAW INPUT</div>
          <div class="panel-actions">
            <el-button plain size="small" @click="handleFormat">格式化</el-button>
            <el-button plain size="small" @click="handleCompress">压缩</el-button>
            <el-button plain size="small" @click="handleEscape">转义</el-button>
            <el-button plain size="small" @click="handleUnescape">去转义</el-button>
            <el-button
                class="panel-action-icon"
                plain
                size="small"
                title="清空"
                type="danger"
                @click="handleClear"
            >
              <el-icon>
                <IconEpDelete/>
              </el-icon>
            </el-button>
          </div>
        </div>
        <textarea
            v-model="rawInput"
            class="editor-area"
            placeholder="在此输入或粘贴您的 JSON 数据... (双击任意处自动格式化)"
            spellcheck="false"
            @dblclick="handleFormat"
            @input="debouncedUpdate"
        ></textarea>
      </div>

      <div class="gutter" @mousedown="startResizing"></div>

      <div class="panel right-panel">
        <div :class="{ 'error-header': hasError }" class="panel-header panel-header--split">
          <div class="panel-header-cell">String Parse (Strict)</div>
          <div class="panel-header-cell panel-header-cell--offset">JS Eval (Relaxed)</div>
        </div>
        <div class="result-area">
          <div class="result-col parse-col" @click="handleToggle" v-html="stringResultHtml"></div>
          <div class="result-col eval-col" @click="handleToggle" v-html="evalResultHtml"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  --json-font-family: 'Consolas', 'Monaco', monospace;
  --panel-padding: 16px;
  --panel-radius: 8px;
  --panel-border: 1px solid var(--el-border-color-light);
  --panel-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  --panel-header-height: 42px;
  --gutter-width: 10px;
  --gutter-offset: -5px;
  --transition-fast: 0.15s ease;
  --icon-bracket-bg: #eef2ff;
  --json-key-0-color: #ef4444;
  --json-key-1-color: #f97316;
  --json-key-2-color: #d97706;
  --json-key-3-color: #84cc16;
  --json-key-4-color: #10b981;
  --json-key-5-color: #06b6d4;
  --json-key-6-color: #3b82f6;
  --json-key-7-color: #8b5cf6;
  --json-key-8-color: #d946ef;
  --json-string-color: #059669;
  --json-number-color: #7c3aed;
  --json-boolean-color: #ea580c;
  --json-type-string-color: #10b981;
  --json-type-number-color: #8b5cf6;
  --json-type-boolean-color: #f59e0b;
  --json-type-object-color: #f43f5e;
  --json-type-array-color: #3b82f6;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  padding: 10px 24px;
}

html.dark .app-container {
  --icon-bracket-bg: rgba(99, 102, 241, 0.2);
  --json-key-0-color: #fca5a5;
  --json-key-1-color: #fdba74;
  --json-key-4-color: #6ee7b7;
  --json-key-6-color: #93c5fd;
  --json-string-color: #34d399;
  --json-number-color: #a78bfa;
  --json-boolean-color: #fb923c;
}

.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.tool-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 700;
}

.icon-bracket {
  padding: 4px 12px;
  border-radius: 6px;
  background: var(--icon-bracket-bg);
  color: #6366f1;
  font: 600 20px/1 var(--json-font-family);
}

.subtitle {
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 500;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.settings-checkbox {
  margin-right: 0;
}

.panel-container {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: var(--panel-border);
  border-radius: var(--panel-radius);
  background: var(--el-bg-color);
  box-shadow: var(--panel-shadow);
}

.panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color);
}

.left-panel {
  flex: 0 0 400px;
  border-right: var(--panel-border);
}

.right-panel {
  flex: 1;
}

.panel-header {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--panel-header-height);
  padding: 0 var(--panel-padding);
  border-bottom: var(--panel-border);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.panel-title {
  font-weight: 700;
  letter-spacing: 0.05em;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.panel-action-icon {
  padding: 5px 8px;
}

.panel-header--split {
  justify-content: flex-start;
}

.panel-header-cell {
  flex: 1;
  min-width: 0;
}

.panel-header-cell--offset {
  padding-left: 8px;
}

.error-header {
  background: var(--el-color-danger);
  color: #fff;
}

.editor-area,
.result-col {
  color: var(--el-text-color-primary);
  font: 13px/1.5 var(--json-font-family);
}

.editor-area {
  flex: 1;
  width: 100%;
  padding: var(--panel-padding);
  border: 0;
  outline: none;
  resize: none;
  background: var(--el-bg-color);
}

.editor-area::placeholder {
  color: var(--el-text-color-placeholder);
}

.result-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.result-col {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: var(--panel-padding);
}

.parse-col {
  border-right: var(--panel-border);
}

.gutter {
  position: relative;
  z-index: 10;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: var(--gutter-width);
  margin: 0 var(--gutter-offset);
  cursor: col-resize;
  background: transparent;
  transition: background var(--transition-fast);
}

.gutter:hover {
  background: var(--el-color-primary-light-9);
}

.gutter::after {
  content: '';
  position: absolute;
  left: 50%;
  width: 4px;
  height: 40px;
  border-radius: 2px;
  transform: translateX(-50%);
  background: var(--el-border-color);
  transition: background var(--transition-fast),
  height var(--transition-fast);
}

.gutter:hover::after {
  height: 60px;
  background: var(--el-color-primary);
}

:deep(.status-tip) {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

:deep(.error-box) {
  padding: 12px;
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: 4px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

:deep(.error-box--italic) {
  font-style: italic;
}

:deep(.json-tree) {
  margin: 0;
  padding-left: 20px;
  list-style: none;
  line-height: 1.5;
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

:deep(.json-toggle) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-right: 6px;
  border: 1px solid var(--el-border-color);
  border-radius: 3px;
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  user-select: none;
}

:deep(.json-toggle:hover) {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

:deep(.folded) {
  display: none;
}

:deep(.json-size-indicator) {
  padding: 0 4px;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
}

:deep(.json-key) {
  font-weight: 500;
}

:deep(.json-key-0) {
  color: var(--json-key-0-color);
}

:deep(.json-key-1) {
  color: var(--json-key-1-color);
}

:deep(.json-key-2) {
  color: var(--json-key-2-color);
}

:deep(.json-key-3) {
  color: var(--json-key-3-color);
}

:deep(.json-key-4) {
  color: var(--json-key-4-color);
}

:deep(.json-key-5) {
  color: var(--json-key-5-color);
}

:deep(.json-key-6) {
  color: var(--json-key-6-color);
}

:deep(.json-key-7) {
  color: var(--json-key-7-color);
}

:deep(.json-key-8) {
  color: var(--json-key-8-color);
}

:deep(.json-string) {
  color: var(--json-string-color);
}

:deep(.json-number) {
  color: var(--json-number-color);
  font-weight: 500;
}

:deep(.json-boolean) {
  color: var(--json-boolean-color);
  font-weight: 600;
}

:deep(.json-null) {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

:deep(.json-bracket) {
  color: var(--el-text-color-regular);
}

:deep(.json-type) {
  margin-left: 6px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  opacity: 0.6;
}

:deep(.type-string) {
  color: var(--json-type-string-color);
}

:deep(.type-number) {
  color: var(--json-type-number-color);
}

:deep(.type-boolean) {
  color: var(--json-type-boolean-color);
}

:deep(.type-object) {
  color: var(--json-type-object-color);
}

:deep(.type-array) {
  color: var(--json-type-array-color);
}
</style>
