self.onmessage = function (e) {
  const { id, type, content, options } = e.data;

  if (!content) {
    self.postMessage({ id, success: false, error: 'Empty content' });
    return;
  }

  try {
    let obj;
    if (type === 'strict') {
      obj = JSON.parse(content);
    } else if (type === 'relaxed') {
      try {
        // Relaxed Eval (supports non-standard JSON)
        // eslint-disable-next-line no-new-func
        obj = new Function('return (' + content + ')')();
      } catch (err) {
        throw new Error(err.message);
      }
    }

    const html = renderJSON(obj, 0, options);
    self.postMessage({ id, success: true, html });
  } catch (err) {
    self.postMessage({ id, success: false, error: err.message });
  }
};

function renderJSON(obj, depth = 0, options) {
  const { compress, showType, showIndex, color } = options;

  if (compress) {
    return '<span class="json-string">' + JSON.stringify(obj) + '</span>';
  }

  if (obj === null) {
    const value = '<span class="json-null">null</span>';
    return value + (showType ? ' <span class="json-type type-null">null</span>' : '');
  }
  if (typeof obj === 'number') {
    const value = '<span class="json-number">' + obj + '</span>';
    return value + (showType ? ' <span class="json-type type-number">number</span>' : '');
  }
  if (typeof obj === 'boolean') {
    const value = '<span class="json-boolean">' + obj + '</span>';
    return value + (showType ? ' <span class="json-type type-boolean">boolean</span>' : '');
  }
  if (typeof obj === 'string') {
    const value = '<span class="json-string">"' + escapeHtml(obj) + '"</span>';
    return value + (showType ? ' <span class="json-type type-string">string</span>' : '');
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '<span class="json-bracket">[]</span>' + (showType ? ' <span class="json-type type-array">array</span>' : '');
    let html = '<span class="json-toggle">-</span><span class="json-bracket">[</span>';
    html += '<span class="json-size-indicator" style="display:none">' + obj.length + '</span>';
    html += '<ul class="json-tree">';
    obj.forEach((item, index) => {
      html += '<li>' + (showIndex ? '<span style="color:#999; margin-right:5px; font-size:12px">' + index + ':</span>' : '') + renderJSON(item, depth + 1, options) + (index < obj.length - 1 ? '<span class="json-bracket">,</span>' : '') + '</li>';
    });
    html += '</ul><span class="json-bracket">]</span>';
    html += showType ? ' <span class="json-type type-array">array</span>' : '';
    return html;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '<span class="json-bracket">{}</span>' + (showType ? ' <span class="json-type type-object">object</span>' : '');
    let html = '<span class="json-toggle">-</span><span class="json-bracket">{</span>';
    html += '<span class="json-size-indicator" style="display:none">' + keys.length + '</span>';
    html += '<ul class="json-tree">';
    keys.forEach((key, index) => {
      const colorIdx = (index + depth) % 9;
      const displayKey = color ? '<span class="json-key json-key-' + colorIdx + '">"' + escapeHtml(key) + '"</span>' : '"' + escapeHtml(key) + '"';
      html += '<li>' + displayKey + '<span class="json-bracket">: </span>' + renderJSON(obj[key], depth + 1, options) + (index < keys.length - 1 ? '<span class="json-bracket">,</span>' : '') + '</li>';
    });
    html += '</ul><span class="json-bracket">}</span>';
    html += showType ? ' <span class="json-type type-object">object</span>' : '';
    return html;
  }

  return String(obj);
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
