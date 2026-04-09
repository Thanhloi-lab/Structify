/* global chrome */
const sessions = new Set();
const pickingTabs = new Set();
const pickedByTab = new Map();
const PROTOCOL = "1.3";

const safeHighlight = {
  contentColor: { r: 0, g: 0, b: 0, a: 0.06 },
  paddingColor: { r: 77, g: 200, b: 0, a: 0.25 },
  borderColor: { r: 0, g: 120, b: 215, a: 1 },
  marginColor: { r: 255, g: 155, b: 0, a: 0.25 },
  showInfo: true,
  showRulers: false,
  showExtensionLines: false,
};

function isUnsupportedScheme(url = "") {
  return (
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("devtools://") ||
    url.startsWith("pdfview://")
  );
}

async function setInspectMode(target, mode) {
  return chrome.debugger.sendCommand(target, "Overlay.setInspectMode", {
    mode,
    highlightConfig: safeHighlight,
  });
}

export async function startPick(tabId) {
  const target = { tabId };
  const t = await chrome.tabs.get(tabId);
  const url = t?.url || "";
  if (isUnsupportedScheme(url)) {
    throw new Error("This page type cannot be inspected.");
  }

  if (t?.windowId) await chrome.windows.update(t.windowId, { focused: true });
  await chrome.tabs.update(tabId, { active: true });

  if (!sessions.has(tabId)) {
    await chrome.debugger.attach(target, PROTOCOL);
    sessions.add(tabId);
    await chrome.debugger.sendCommand(target, "Runtime.enable");
    await chrome.debugger.sendCommand(target, "DOM.enable");
    await chrome.debugger.sendCommand(target, "Overlay.enable");
    await chrome.debugger.sendCommand(target, "Page.enable");
  }

  await chrome.debugger.sendCommand(target, "DOM.getDocument", { depth: 0 });
  await setInspectMode(target, "searchForNode");
  pickingTabs.add(tabId);

  setTimeout(async () => {
    if (pickingTabs.has(tabId)) {
      try {
        await setInspectMode(target, "none");
      } catch {}
      pickingTabs.delete(tabId);
    }
  }, 15000);
}

export async function stopPick(tabId) {
  const target = { tabId };
  await setInspectMode(target, "none");
  pickingTabs.delete(tabId);
}

export async function detachDebugger(tabId) {
  const target = { tabId };
  await chrome.debugger.detach(target).catch(() => {});
  sessions.delete(tabId);
  pickingTabs.delete(tabId);
  pickedByTab.delete(tabId);
}

export async function getPickedText(tabId) {
  const target = { tabId };
  const picked = pickedByTab.get(tabId);
  if (!picked) throw new Error("No element selected");
  const { result } = await chrome.debugger.sendCommand(target, "Runtime.callFunctionOn", {
    objectId: picked.objectId,
    functionDeclaration: "function(){ return this.textContent; }",
    returnByValue: true,
  });
  return result?.value ?? "";
}

export async function setPickedText(tabId, text) {
  const target = { tabId };
  const picked = pickedByTab.get(tabId);
  if (!picked) throw new Error("No element selected");
  await chrome.debugger.sendCommand(target, "Runtime.callFunctionOn", {
    objectId: picked.objectId,
    functionDeclaration: `
      function(newText){
        try { this.innerText = newText; return true; }
        catch(e) { return String(e); }
      }
    `,
    arguments: [{ value: String(text ?? "") }],
    returnByValue: true,
  });
}

export function initCdp() {
  chrome.debugger.onEvent.addListener(async (source, method, params) => {
    try {
      if (method === "Overlay.inspectModeCanceled") {
        await setInspectMode(source, "none");
        pickingTabs.delete(source.tabId);
        chrome.runtime.sendMessage({ type: "PICK_CANCELED", tabId: source.tabId });
        return;
      }

      if (method === "Overlay.inspectNodeRequested") {
        const backendNodeId = params.backendNodeId;
        await chrome.debugger.sendCommand(source, "DOM.getDocument", { depth: 0 });

        const pushed = await chrome.debugger.sendCommand(
          source,
          "DOM.pushNodesByBackendIdsToFrontend",
          { backendNodeIds: [backendNodeId] }
        );
        const nodeId = pushed.nodeIds?.[0];

        const { object } = await chrome.debugger.sendCommand(source, "DOM.resolveNode", { nodeId });

        pickedByTab.set(source.tabId, {
          objectId: object.objectId,
          nodeId,
          backendNodeId,
        });

        const { result } = await chrome.debugger.sendCommand(source, "Runtime.callFunctionOn", {
          objectId: object.objectId,
          functionDeclaration: "function(){ return this.textContent; }",
          returnByValue: true,
        });

        await setInspectMode(source, "none");
        pickingTabs.delete(source.tabId);

        chrome.runtime.sendMessage({
          type: "PICK_RESULT",
          tabId: source.tabId,
          nodeId,
          text: result?.value ?? "",
          outerHTML: result?.value ?? "", // giữ tương thích ngược
        });
        return;
      }

      if (method === "Page.frameNavigated" || method === "Page.frameStartedLoading") {
        await chrome.debugger.sendCommand(source, "DOM.enable");
        await chrome.debugger.sendCommand(source, "Overlay.enable");
        await chrome.debugger.sendCommand(source, "DOM.getDocument", { depth: 0 });

        if (pickingTabs.has(source.tabId)) {
          await setInspectMode(source, "none");
          pickingTabs.delete(source.tabId);
        }
        pickedByTab.delete(source.tabId);
        return;
      }
    } catch (e) {
      console.warn("[CDP ERROR onEvent]", method, e);
      chrome.runtime.sendMessage({ type: "PICK_ERROR", tabId: source.tabId, error: String(e) });
    }
  });

  chrome.debugger.onDetach.addListener((source, reason) => {
    console.log("[CDP DETACH]", source, reason);
    sessions.delete(source.tabId);
    pickingTabs.delete(source.tabId);
    pickedByTab.delete(source.tabId);
  });
}
