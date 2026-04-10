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
    const result = globalThis.HiddingChatGPTSection.toggle();
    showToast(`ChatGPT optimizer ${result}`);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  await initSettings();
  injectDashboard();

  if (globalThis.ExtensionSettings && globalThis.ExtensionSettings.allowOptimize) {
    if (globalThis.HiddingChatGPTSection) {
      globalThis.HiddingChatGPTSection.start();
    }
  }
});

async function initSettings() {
  globalThis.ExtensionSettings = await getSettings();
  onSettingsChanged(next => {
    globalThis.ExtensionSettings = next;
  });
}

// content.js

function injectDashboard() {
  if (document.getElementById('chat-optimizer-dashboard')) return;

  const style = document.createElement('style');
  style.textContent = `
        /* ==================================================
           1. CẤU HÌNH MÀU SẮC DÀNH CHO CHẾ ĐỘ SÁNG (LIGHT MODE) 
           ================================================== */
        
        /* Bảng Dashboard: Giữ nguyên chuẩn Sáng (Trắng) */
        #chat-optimizer-dashboard {
            --cod-bg-color: rgba(255, 255, 255, 0.95);    
            --cod-text-color: #333333;
            --cod-border-color: rgba(0, 0, 0, 0.1);
            --cod-accent-color: #10a37f;
            --cod-btn-bg-color: #f1f1f1;
            --cod-btn-text-color: #333333;
            --cod-btn-hover-color: #e5e5e5;
            --cod-dot-inactive-color: #ef4444;
        }

        /* Nút Icon: Chơi trội nền Đen mờ */
        #cod-fab {
            --fab-bg-color: rgba(20, 21, 23, 0.85);        
            --fab-border-color: rgba(255, 255, 255, 0.15); 
        }

        /* ==================================================
           2. CẤU HÌNH MÀU SẮC DÀNH CHO CHẾ ĐỘ TỐI (DARK MODE) 
           ================================================== */
        @media (prefers-color-scheme: dark) {
            /* Bảng Dashboard: Giữ nguyên chuẩn Tối (Đen) */
            #chat-optimizer-dashboard {
                --cod-bg-color: rgba(32, 33, 35, 0.95);    
                --cod-text-color: #ececf1;
                --cod-border-color: rgba(255, 255, 255, 0.1);
                --cod-accent-color: #10a37f;
                --cod-btn-bg-color: #40414F;
                --cod-btn-text-color: white;
                --cod-btn-hover-color: #565869;
                --cod-dot-inactive-color: #ef4444;
            }

            /* Nút Icon: Chơi trội nền Trắng mờ */
            #cod-fab {
                --fab-bg-color: rgba(255, 255, 255, 0.85);  
                --fab-border-color: rgba(0, 0, 0, 0.15);    
            }
        }

        /* ==================================================
           3. CÁC THUỘC TÍNH CSS CỐT LÕI (GIỮ NGUYÊN)
           ================================================== */

        /* Khung Dashboard chính */
        #chat-optimizer-dashboard {
            position: fixed; bottom: 150px; right: 20px; z-index: 999999;
            background: var(--cod-bg-color); color: var(--cod-text-color);
            padding: 12px 16px; border-radius: 12px;
            font-family: ui-sans-serif, system-ui, sans-serif; font-size: 13px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); backdrop-filter: blur(8px);
            border: 1px solid var(--cod-border-color);
            display: flex; flex-direction: column; gap: 10px; width: 260px;
            transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease;
            transform-origin: right bottom;
        }

        #chat-optimizer-dashboard.minimized {
            transform: translateX(120px) scale(0.8); opacity: 0; pointer-events: none;
        }

        /* Header và Buttons Dashboard */
        .cod-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 14px; color: var(--cod-accent-color); margin-bottom: 2px; }
        .cod-btn-close { background: transparent; border: none; color: #888; cursor: pointer; font-size: 16px; line-height: 1; padding: 2px 6px; border-radius: 4px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .cod-btn-close:hover { color: var(--cod-text-color); background: var(--cod-btn-bg-color); }
        .cod-stats { display: flex; justify-content: space-between; font-size: 12px; opacity: 0.9; }
        .cod-buttons { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
        .cod-btn { flex: 1; min-width: 45%; background: var(--cod-btn-bg-color); color: var(--cod-btn-text-color); border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; transition: background 0.2s; }
        .cod-btn:hover { background: var(--cod-btn-hover-color); }
        .cod-btn:active { transform: scale(0.96); }
        .cod-btn.btn-start { background: var(--cod-accent-color); color: white; }
        .cod-btn.btn-start:hover { background: #0e906f; }
        .cod-btn.btn-stop { background: #ef4444; color: white; }
        .cod-btn.btn-stop:hover { background: #dc2626; }
        .cod-status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--cod-dot-inactive-color); margin-right: 6px; transition: all 0.3s;}
        .cod-status-dot.active { background: var(--cod-accent-color); box-shadow: 0 0 8px var(--cod-accent-color); }

        /* ==================================================
           4. STYLING RIÊNG CHO NÚT ICON (FAB)
           ================================================== */
        #cod-fab {
            position: fixed; bottom: 150px; right: 20px; z-index: 999998;
            width: 44px; height: 44px; border-radius: 50%;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            padding: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.3); backdrop-filter: blur(8px);
            
            /* SỬ DỤNG BIẾN RIÊNG --fab */
            background: var(--fab-bg-color);     
            border: 1px solid var(--fab-border-color); 
            
            transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease;
            transform: scale(0) rotate(-90deg); opacity: 0; pointer-events: none;
        }
        
        #cod-fab:hover { transform: scale(1.1) !important; }
        
        #cod-fab.visible { transform: scale(1) rotate(0deg); opacity: 1; pointer-events: auto; }
    `;
  document.head.appendChild(style);

  // Tạo HTML cho Dashboard
  const panel = document.createElement('div');
  panel.id = 'chat-optimizer-dashboard';
  panel.innerHTML = `
        <div class="cod-header">
            <div><span class="cod-status-dot" id="cod-dot"></span>Optimizer</div>
            <button class="cod-btn-close" id="cod-btn-minimize" title="Thu nhỏ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
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

  // Tạo HTML cho Nút Icon
  const fab = document.createElement('button');
  fab.id = 'cod-fab';
  fab.title = "Mở bảng điều khiển Optimizer";
  fab.innerHTML = `
        <img src="${logo192}" alt="Optimizer" style="width: 48px; height: 48px; border-radius: 50%; object-fit: contain;">
    `;
  document.body.appendChild(fab);

  // ==========================================
  // SỰ KIỆN ẨN / HIỆN (TOGGLE)
  // ==========================================
  const btnMinimize = document.getElementById('cod-btn-minimize');

  // Khi nhấn nút ">" trong bảng -> Ẩn bảng, Hiện Icon
  btnMinimize.addEventListener('click', () => {
    panel.classList.add('minimized');
    fab.classList.add('visible');
  });

  // Khi nhấn vào Icon tròn -> Hiện bảng, Ẩn Icon
  fab.addEventListener('click', () => {
    panel.classList.remove('minimized');
    fab.classList.remove('visible');
    // Reset lại scale inline để tránh lỗi hover
    fab.style.transform = '';
  });

  // ==========================================
  // CÁC SỰ KIỆN GỐC
  // ==========================================
  const elTotal = document.getElementById('cod-total');
  const elVisible = document.getElementById('cod-visible');
  const elHidden = document.getElementById('cod-hidden');
  const elDot = document.getElementById('cod-dot');
  const elValRes = document.getElementById('cod-val-res');
  const elValKeep = document.getElementById('cod-val-keep');

  document.getElementById('cod-btn-start').addEventListener('click', () => {
    if (globalThis.HiddingChatGPTSection) globalThis.HiddingChatGPTSection.start();
  });

  document.getElementById('cod-btn-stop').addEventListener('click', () => {
    if (globalThis.HiddingChatGPTSection) globalThis.HiddingChatGPTSection.stop();
  });

  document.getElementById('cod-btn-restore').addEventListener('click', () => {
    if (globalThis.HiddingChatGPTSection) {
      const count = globalThis.ExtensionSettings?.restoreCount || 5;
      globalThis.HiddingChatGPTSection.manualRestore(count);
    }
  });

  document.getElementById('cod-btn-hide').addEventListener('click', () => {
    if (globalThis.HiddingChatGPTSection) {
      globalThis.HiddingChatGPTSection.manualHide();
    }
  });

  setInterval(() => {
    const keep = globalThis.ExtensionSettings?.keepCount || 15;
    const res = globalThis.ExtensionSettings?.restoreCount || 5;
    elValKeep.innerText = keep;
    elValRes.innerText = res;

    if (globalThis.HiddingChatGPTSection) {
      const stats = globalThis.HiddingChatGPTSection.getStats();
      elTotal.innerText = stats.total;
      elVisible.innerText = stats.visible;
      elHidden.innerText = stats.hidden;

      if (stats.isActive) {
        elDot.classList.add('active');
      } else {
        elDot.classList.remove('active');
      }
    }
  }, 500);
}