/* global chrome */
import { checkValidSelectedTextType, handleSelectionChange, tryShowFloatingButton } from '../utils/floatingButton.js';
import { getSettings, onSettingsChanged } from "../utils/setting.js";
import { showToast } from "../utils/toast.js";
import { logo192 } from '../../assets/base64Icon.js'

chrome.runtime.onMessage.addListener(async (message, _, sendResponse) => {
  if (message.type === 'ping') {
    sendResponse("pong");
  }
  sendResponse({ errorMsg: "No command" });
});

document.addEventListener('selectionchange', handleSelectionChange);

document.addEventListener('keydown', async (e) => {
  const setting = globalThis.ExtensionSettings;
  const currentHost = window.location.hostname;

  if (e.key === 'Control' && checkValidSelectedTextType() && (setting?.beautifyCode || setting?.toCSharp)) {
    tryShowFloatingButton();
  }
  if (e.key === 'F4' && setting?.allowChatGPTOptimize && currentHost?.toLowerCase() === "chatgpt.com") {
    e.preventDefault();
    const result = globalThis.HidingChatGPTSection.toggle();
    showToast(`ChatGPT optimizer ${result}`);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  await observeAndInject();
});

async function initSettings() {
  globalThis.ExtensionSettings = await getSettings();
  onSettingsChanged(next => {
    globalThis.ExtensionSettings = next;
  });
}

let codIntervalId = null;
let dashboardClickListener = null;

function injectDashboard(headerContainer) {
  if (document.getElementById('cod-fab')) return;

  const existingStyle = document.getElementById('cod-style');
  if (existingStyle) existingStyle.remove();

  const existingPanel = document.getElementById('chat-optimizer-dashboard');
  if (existingPanel) existingPanel.remove();

  if (codIntervalId) {
    clearInterval(codIntervalId);
  }
  if (dashboardClickListener) {
    document.removeEventListener('click', dashboardClickListener);
  }

  const style = document.createElement('style');
  style.id = 'cod-style';
  style.textContent = `
        :root {
            --cod-bg: rgba(255, 255, 255, 0.98);
            --cod-text: #333;
            --cod-border: rgba(0, 0, 0, 0.1);
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --cod-bg: rgba(32, 33, 35, 0.95);
                --cod-text: #ececf1;
                --cod-border: rgba(255, 255, 255, 0.1);
            }
        }

        #cod-fab {
            width: 34px; height: 34px; 
            border-radius: 6px;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            background: transparent; border: 1px solid transparent;
            transition: all 0.2s;
            margin-left: 4px;
        }
        #cod-fab:hover { background: rgba(155, 155, 155, 0.1); border-color: var(--cod-border); }

        #chat-optimizer-dashboard {
            position: fixed; 
            z-index: 999999;
            background: var(--cod-bg); 
            color: var(--cod-text);
            padding: 16px; border-radius: 12px;
            font-family: ui-sans-serif, system-ui, sans-serif;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(10px);
            border: 1px solid var(--cod-border);
            width: 280px;
            display: flex; flex-direction: column; gap: 12px;
            
            transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.1);
            transform-origin: top right;
            pointer-events: auto;
        }

        #chat-optimizer-dashboard.minimized {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
            pointer-events: none;
        }

        .cod-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: #10a37f; }
        .cod-stats { display: flex; justify-content: space-between; font-size: 12px; }
        .cod-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .cod-btn { flex: 1; min-width: 45%; border: none; padding: 7px; border-radius: 6px; cursor: pointer; font-size: 12px; background: #40414F; color: white; }
        .cod-btn:hover { opacity: 0.8; }
        .cod-btn.btn-start { background: #10a37f; }
        .cod-btn.btn-stop { background: #ef4444; }
        .cod-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; background: #ef4444; margin-right: 5px; }
        .cod-status-dot.active { background: #10a37f; box-shadow: 0 0 8px #10a37f; }
    `;
  document.head.appendChild(style);

  const fab = document.createElement('button');
  fab.id = 'cod-fab';
  fab.innerHTML = `<img src="${logo192}" style="width:22px; height:22px; border-radius:50%;">`;
  headerContainer.appendChild(fab);

  const panel = document.createElement('div');
  panel.id = 'chat-optimizer-dashboard';
  panel.className = 'minimized';
  panel.innerHTML = `
        <div class="cod-header">
            <div><span class="cod-status-dot" id="cod-dot"></span>Optimizer</div>
            <span style="cursor:pointer; font-size:18px;" id="cod-close">&times;</span>
        </div>
        <div class="cod-stats">
            <span>Total: <b id="cod-total">0</b></span>
            <span>Vis: <b id="cod-visible">0</b></span>
            <span>Hid: <b id="cod-hidden">0</b></span>
        </div>
        <div class="cod-buttons">
            <button class="cod-btn btn-start" id="cod-btn-start">Start</button>
            <button class="cod-btn btn-stop" id="cod-btn-stop">Stop</button>
            <button class="cod-btn" id="cod-btn-restore">Restore <span id="cod-val-res">5</span></button>
            <button class="cod-btn" id="cod-btn-hide">Hide keep <span id="cod-val-keep">10</span></button>
        </div>
    `;
  document.body.appendChild(panel);

  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = panel.classList.contains('minimized');

    if (isHidden) {
      const rect = fab.getBoundingClientRect();

      panel.style.top = `${rect.bottom + 10}px`;
      panel.style.right = `${window.innerWidth - rect.right}px`;

      panel.classList.remove('minimized');
    } else {
      panel.classList.add('minimized');
    }
  });

  document.getElementById('cod-close').onclick = () => panel.classList.add('minimized');

  dashboardClickListener = (e) => {
    if (!panel.contains(e.target) && e.target !== fab) {
      panel.classList.add('minimized');
    }
  };
  document.addEventListener('click', dashboardClickListener);

  const elTotal = document.getElementById('cod-total');
  const elVisible = document.getElementById('cod-visible');
  const elHidden = document.getElementById('cod-hidden');
  const elDot = document.getElementById('cod-dot');
  const elValRes = document.getElementById('cod-val-res');
  const elValKeep = document.getElementById('cod-val-keep');

  document.getElementById('cod-btn-start').addEventListener('click', () => {
    if (globalThis.HidingChatGPTSection) globalThis.HidingChatGPTSection.start();
  });
  document.getElementById('cod-btn-stop').addEventListener('click', () => {
    if (globalThis.HidingChatGPTSection) globalThis.HidingChatGPTSection.stop();
  });
  document.getElementById('cod-btn-restore').addEventListener('click', () => {
    if (globalThis.HidingChatGPTSection) {
      const count = globalThis.ExtensionSettings?.restoreCount || 5;
      globalThis.HidingChatGPTSection.manualRestore(count);
    }
  });
  document.getElementById('cod-btn-hide').addEventListener('click', () => {
    if (globalThis.HidingChatGPTSection) globalThis.HidingChatGPTSection.manualHide();
  });

  codIntervalId = setInterval(async () => {
    const keep = globalThis.ExtensionSettings?.keepCount || 15;
    const res = globalThis.ExtensionSettings?.restoreCount || 5;
    if (elValKeep) elValKeep.innerText = keep;
    if (elValRes) elValRes.innerText = res;

    if (globalThis.HidingChatGPTSection) {
      const stats = await globalThis.HidingChatGPTSection.getStats();
      if (elTotal) elTotal.innerText = stats.total;
      if (elVisible) elVisible.innerText = stats.visible;
      if (elHidden) elHidden.innerText = stats.hidden;

      if (stats.isActive) {
        if (elDot) elDot.classList.add('active');
      } else {
        if (elDot) elDot.classList.remove('active');
      }
    }
  }, 1000);
}

export async function observeAndInject() {
  const observer = new MutationObserver(async () => {
    const header = document.getElementById('conversation-header-actions');
    if (header && !document.getElementById('cod-fab')) {
      await initSettings();
      injectDashboard(header);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}