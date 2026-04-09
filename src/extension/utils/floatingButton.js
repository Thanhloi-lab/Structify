/* global chrome */
/* global globalThis */
let floatingGroup = null;
let selectedTextCache = '';

export const handleSelectionChange = () => {
  const sel = window.getSelection?.();
  const text = sel ? sanitizeJsonString(sel.toString().trim()) : '';
  if (text.length > 0) {
    selectedTextCache = text;
  } else {
    hideFloatingButton();
  }
}

/**
 * Try to extract the first valid JSON object/array or XML document
 * from raw text that may have leading/trailing garbage.
 * Returns { type: 'json'|'xml', content: string } or null.
 */
function extractValidContent(raw) {
  if (!raw) return null;

  // --- Try JSON: find outermost { } or [ ] ---
  const jsonStarts = ['{', '['];
  for (const startChar of jsonStarts) {
    const closeChar = startChar === '{' ? '}' : ']';
    const start = raw.indexOf(startChar);
    if (start === -1) continue;

    // Walk from the end to find the matching close
    let depth = 0;
    let end = -1;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === startChar) depth++;
      else if (raw[i] === closeChar) {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }

    if (end !== -1) {
      const candidate = raw.slice(start, end + 1);
      try {
        JSON.parse(candidate);
        return { type: 'json', content: candidate };
      } catch { /* keep trying */ }
    }
  }

  // --- Try XML: find first < to last > ---
  const xmlStart = raw.indexOf('<');
  if (xmlStart !== -1) {
    const xmlEnd = raw.lastIndexOf('>');
    if (xmlEnd > xmlStart) {
      const candidate = raw.slice(xmlStart, xmlEnd + 1);
      try {
        const doc = new DOMParser().parseFromString(candidate, 'application/xml');
        if (!doc.querySelector('parsererror')) {
          return { type: 'xml', content: candidate };
        }
      } catch { /* invalid */ }
    }
  }

  return null;
}

export function checkValidSelectedTextType() {
  const sel = window.getSelection?.();
  const text = sel ? sanitizeJsonString(sel.toString().trim()) : '';
  return extractValidContent(text) !== null;
}

export function tryShowFloatingButton() {
  const sel = window.getSelection?.();
  const selectedText = sel ? sanitizeJsonString(sel.toString().trim()) : '';

  const extracted = extractValidContent(selectedText);
  if (extracted) {
    selectedTextCache = extracted.content;
    showFloatingButton();
  }
}

function sanitizeJsonString(str) {
  if (typeof str !== "string") return str;

  return str.replace(/\u00A0/g, " ")
}

function getSelectionRect() {
  const sel = window.getSelection?.();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);

  // Prefer last client rect (end of selection)
  const rects = range.getClientRects?.();
  let rect = rects && rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();

  // If collapsed/zero-size, try the anchor node's element box
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    const node = sel.anchorNode?.nodeType === Node.TEXT_NODE
      ? sel.anchorNode.parentElement
      : sel.anchorNode;
    if (node?.getBoundingClientRect) {
      rect = node.getBoundingClientRect();
    }
  }

  return rect;
}

function showFloatingButton() {
  if (floatingGroup) floatingGroup.remove();
  const rect = getSelectionRect();

  if (!rect) return;

  const setting = globalThis.ExtensionSettings;

  // Tạo group chứa 2 nút
  const group = document.createElement('div');
  group.style.cssText = `
        position: fixed;
        top: ${Math.min(rect.bottom + 8, window.innerHeight - 44)}px;
        left: ${Math.max(8, Math.min(rect.left, window.innerWidth - 200))}px;
        display: inline-flex;
        gap: 6px;
        z-index: 2147483647;
        user-select: none;
        pointer-events: auto;
    `;

  const baseBtnCss = `
        padding: 6px 10px;
        background-color: #007bff;
        color: #fff;
        font-size: 13px;
        line-height: 1;
        border-radius: 6px;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        white-space: nowrap;
        transition: background 0.3s ease, transform 0.3s ease;
    `;

  const prevent = (e) => e.preventDefault();

  if (setting?.beautifyCode) {
    // Nút 1: Beautify Text
    const btnBeautify = document.createElement('div');
    btnBeautify.textContent = 'Beautify Text';
    btnBeautify.style.cssText = baseBtnCss;

    // Hover: Beautify Text
    btnBeautify.addEventListener('mouseenter', () => {
      btnBeautify.style.background = 'linear-gradient(135deg, #007bff, #3399ff)';
      btnBeautify.style.transform = 'translateY(-1px)';
    });

    btnBeautify.addEventListener('mouseleave', () => {
      btnBeautify.style.background = '#007bff';
      btnBeautify.style.transform = 'none';
    });

    btnBeautify.addEventListener('mousedown', prevent);
    group.appendChild(btnBeautify);
    btnBeautify.onclick = () => {
      chrome.runtime.sendMessage({
        type: 'OPEN_BEAUTIFY_WINDOW',
        text: selectedTextCache,
      });
      hideFloatingButton();
    };
  }

  if (setting?.toCSharp) {
    // Nút 2: To CSharp
    const btnConvert = document.createElement('div');
    btnConvert.textContent = 'To CSharp';
    btnConvert.style.cssText = baseBtnCss + 'background-color: #8927a2;';

    // Hover: To CSharp
    btnConvert.addEventListener('mouseenter', () => {
      btnConvert.style.background = 'linear-gradient(135deg, #8927a2, #b64fcf)';
      btnConvert.style.transform = 'translateY(-1px)';
    });
    btnConvert.addEventListener('mouseleave', () => {
      btnConvert.style.background = '#8927a2';
      btnConvert.style.transform = 'none';
    });

    // Tránh mất selection khi mousedown
    btnConvert.addEventListener('mousedown', prevent);

    // Click handlers
    btnConvert.onclick = async () => {
      chrome.runtime.sendMessage({
        type: 'OPEN_CONVERT_CSHARP_WINDOW',
        text: selectedTextCache,
      });
      hideFloatingButton();
    };

    group.appendChild(btnConvert);
  }

  document.body.appendChild(group);
  floatingGroup = group;

  // Clamp lại nếu tràn màn hình (sau khi render mới biết width thật)
  requestAnimationFrame(() => {
    const gRect = group.getBoundingClientRect();
    let left = gRect.left;
    if (gRect.right > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - gRect.width - 8);
      group.style.left = `${left}px`;
    }
  });

  // Ẩn khi scroll/resize
  const onScrollOrResize = () => hideFloatingButton();
  window.addEventListener('scroll', onScrollOrResize, { once: true });
  window.addEventListener('resize', onScrollOrResize, { once: true });
}

function hideFloatingButton() {
  if (floatingGroup) {
    floatingGroup.remove();
    floatingGroup = null;
  }
}