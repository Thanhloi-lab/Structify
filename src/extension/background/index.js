/* global chrome */
import { initCdp } from "./cdp.js";
import { initContextMenus } from "./contextMenus.js";
import { initMessages } from "./messages.js";

/* =============================
   Initialization
============================= */
initCdp();
initContextMenus();
initMessages();

/* =============================
   Action → mở side panel
============================= */
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (err) {
    console.warn("Side Panel not available, fallback to popup:", err);
  }
});
