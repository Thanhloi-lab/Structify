/* global chrome */
/* global globalThis */
import { getSettings } from "../utils/setting.js";

export async function registerOnInstalledArtifacts() {
  try {
    // MAIN world hook
    await chrome.scripting.unregisterContentScripts({ ids: ["inpage-hook"] }).catch(() => { });
    await chrome.scripting.registerContentScripts([
      {
        id: "inpage-hook",
        matches: ["<all_urls>"],
        js: ["inpage-hook.js"],
        runAt: "document_start",
        world: "MAIN",
        persistAcrossSessions: true,
      },
    ]);
    console.log("Registered MAIN-world hook");
  } catch (e) {
    console.error("registerContentScripts error:", e);
  }

  try {
    // CSS hover
    await chrome.scripting.unregisterContentScripts({ ids: ["row-hover-css"] }).catch(() => { });
    await chrome.scripting.registerContentScripts([
      {
        id: "row-hover-css",
        matches: ["<all_urls>"],
        css: ["content.css"],
        runAt: "document_start",
        persistAcrossSessions: true,
      },
    ]);

    await chrome.sidePanel.setOptions({ enabled: true });

    // Đọc settings hiện tại để dựng context menus
    const s = await getSettings();
    globalThis.ExtensionSettings = s;

    // Xoá context menus cũ nếu có
    await chrome.contextMenus.removeAll().catch(() => { });

    if (s.fillData) {
      chrome.contextMenus.create({
        id: "FillData",
        title: "Fill data (F6)",
        contexts: ["all"],
        documentUrlPatterns: ["*://*.trulioo.com/*", "https://localhost/*"],
      });
    }

    if (s.pasteToCP) {
      let allowedUrl = ["*://*.trulioo.com/*", "https://localhost/*"];
      if (Array.isArray(s.pasteToCPUrls) && s.pasteToCPUrls.length > 0) {
        allowedUrl = [...allowedUrl, ...s.pasteToCPUrls];
      }
      chrome.contextMenus.create({
        id: "pasteToCP",
        title: "Paste to CP (F7)",
        contexts: ["all"],
        documentUrlPatterns: allowedUrl,
      });
    }

    if (s.copyEvidence) {
      chrome.contextMenus.create({
        id: "captureEvidence",
        title: "Capture evidence (F4)",
        contexts: ["all"],
        documentUrlPatterns: [
          "*://*.trulioo.com/GDCDebug/DebugRecordTransaction*",
          "https://localhost/*",
          "http://localhost/*",
        ],
      });
    }

    if (s.copyAndCompareVariant) {
      chrome.contextMenus.create({
        id: "CopyAdminVariant",
        title: "Copy variant as Array",
        contexts: ["all"],
        documentUrlPatterns: ["*://*.trulioo.com/*", "https://localhost/*"],
      });

      chrome.contextMenus.create({
        id: "CompareVariant",
        title: "Compare Variant with DSDR",
        contexts: ["all"],
        documentUrlPatterns: ["*://trulioo.atlassian.net/*"],
      });
    }

    chrome.contextMenus.create({
      id: "ShowToggleBtn",
      title: "Show toggle button",
      contexts: ["all"],
      documentUrlPatterns: ["*://trulioo.atlassian.net/*"],
    });

  } catch (e) {
    console.warn("[onInstalled] error:", e);
  }
}

export function initContextMenus() {
  chrome.runtime.onInstalled.addListener(async () => {
    await registerOnInstalledArtifacts();
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, { action: info.menuItemId, selectedText: info.selectionText });
  });
}
