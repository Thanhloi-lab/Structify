/* global chrome */
import { startPick, stopPick, detachDebugger, getPickedText, setPickedText } from "./cdp.js";
import { getEffectiveSettings, persistSettings } from "./settings.js";
import { getSettings, clearLocal, JSON_COLORS_ARRAY, XML_COLORS_ARRAY, getLocal } from "../utils/setting.js";

const MSG = {
  OPEN_BEAUTIFY_WINDOW: "OPEN_BEAUTIFY_WINDOW",
  OPEN_CONVERT_CSHARP_WINDOW: "OPEN_CONVERT_CSHARP_WINDOW",

  CDP_START_PICK: "CDP_START_PICK",
  CDP_STOP_PICK: "CDP_STOP_PICK",
  CDP_DETACH: "CDP_DETACH",
  CDP_GET_TEXT: "CDP_GET_TEXT",
  CDP_SET_TEXT: "CDP_SET_TEXT",

  GET_SETTINGS: "GET_SETTINGS",
  SAVE_SETTINGS: "SAVE_SETTINGS",
  DEFAULT_SETTINGS: "DEFAULT_SETTINGS",

  LOAD_DEFAULT_JSON_COLOR: "LOAD_DEFAULT_JSON_COLOR",
  LOAD_DEFAULT_XML_COLOR: "LOAD_DEFAULT_XML_COLOR",
  LOAD_DEFAULT_DEBUG_SETTING: "LOAD_DEFAULT_DEBUG_SETTING",
  LOAD_DEFAULT_TOGGLE: "LOAD_DEFAULT_TOGGLE",
};

function ok(sendResponse, payload) {
  sendResponse({ ok: true, ...payload });
}

function fail(sendResponse, error) {
  sendResponse({ ok: false, error: typeof error === "string" ? error : String(error) });
}

async function openDialog(type, text) {
  const code = encodeURIComponent(text ?? "");
  const convert = type === MSG.OPEN_CONVERT_CSHARP_WINDOW ? "&convertToCSharp=true" : "";
  const autoClosePreviewInSec = await getLocal("autoClosePreviewInSec", "60");
  const url = chrome.runtime.getURL(
    `dialog.html?code=${code}${convert}&autoClosePreviewInSec:${autoClosePreviewInSec}`
  );
  await chrome.windows.create({ url, type: "popup", width: 1024, height: 700 });
}

export function initMessages() {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    (async () => {
      try {
        switch (msg.type) {
          /* ---------- Dialogs ---------- */
          case MSG.OPEN_BEAUTIFY_WINDOW:
          case MSG.OPEN_CONVERT_CSHARP_WINDOW: {
            await openDialog(msg.type, msg.text);
            return ok(sendResponse);
          }
          case 'OPEN_BACKGROUND_BEAUTIFY_WINDOW': {
            console.log("[BG] 2. Received OPEN_BACKGROUND_BEAUTIFY_WINDOW from MSGS. callerTabId:", _sender.tab ? _sender.tab.id : "NONE");
            const code = encodeURIComponent(msg.text ?? "");
            // Include callerTabId so DialogApp knows where to send back the image
            const callerTabId = _sender.tab ? _sender.tab.id : "";
            const url = chrome.runtime.getURL(
              `dialog.html?code=${code}&autoCapture=true&callerTabId=${callerTabId}`
            );
            console.log("[BG] 3. Creating minimized popup for: " + url.substring(0, 100) + "...");
            await chrome.windows.create({
              url,
              type: "popup",
              state: "minimized"
            });
            return ok(sendResponse);
          }

          /* ---------- CDP: Start pick ---------- */
          case MSG.CDP_START_PICK: {
            await startPick(msg.tabId);
            return ok(sendResponse);
          }

          /* ---------- CDP: Stop / Detach ---------- */
          case MSG.CDP_STOP_PICK: {
            await stopPick(msg.tabId);
            return ok(sendResponse);
          }
          case MSG.CDP_DETACH: {
            await detachDebugger(msg.tabId);
            return ok(sendResponse);
          }

          /* ---------- CDP: Get/Set text ---------- */
          case MSG.CDP_GET_TEXT: {
            const text = await getPickedText(msg.tabId);
            return ok(sendResponse, { text });
          }
          case MSG.CDP_SET_TEXT: {
            await setPickedText(msg.tabId, msg.text);
            return ok(sendResponse);
          }

          /* ---------- Settings: get / save / defaults ---------- */
          case MSG.GET_SETTINGS: {
            const eff = await getEffectiveSettings();
            return sendResponse({ settings: eff });
          }

          case MSG.SAVE_SETTINGS: {
            try {
              const payload = msg.payload || {};
              const merged = {
                // defaults
                serverLocation: payload.serverLocation || "us",
                autoClosePreviewInSec:
                  payload.autoClosePreviewInSec && Number(payload.autoClosePreviewInSec) >= 60
                    ? payload.autoClosePreviewInSec
                    : "60",
                // override
                ...payload,
              };
              const saved = await persistSettings(merged);
              return sendResponse({ settings: saved });
            } catch (err) {
              console.error("SAVE_SETTINGS error:", err);
              return sendResponse({ error: err.message || "Failed to save settings" });
            }
          }

          case MSG.DEFAULT_SETTINGS: {
            await clearLocal();
            const defaults = await getSettings();
            const eff = {
              ...defaults,
              serverLocation: "us",
              autoClosePreviewInSec: "60",
            };
            const saved = await persistSettings(eff);
            return sendResponse({ settings: saved });
          }

          /* ---------- Load defaults (partial) ---------- */
          case MSG.LOAD_DEFAULT_JSON_COLOR:
          case MSG.LOAD_DEFAULT_XML_COLOR:
          case MSG.LOAD_DEFAULT_DEBUG_SETTING:
          case MSG.LOAD_DEFAULT_TOGGLE: {
            const base = await getEffectiveSettings();
            let next = { ...base };

            if (msg.type === MSG.LOAD_DEFAULT_JSON_COLOR) {
              next = { ...next, jsonColors: JSON_COLORS_ARRAY };
            } else if (msg.type === MSG.LOAD_DEFAULT_XML_COLOR) {
              next = { ...next, xmlColors: XML_COLORS_ARRAY };
            } else if (msg.type === MSG.LOAD_DEFAULT_DEBUG_SETTING) {
              next = { ...next, pasteToCPUrls: [], serverLocation: "us" };
            } else if (msg.type === MSG.LOAD_DEFAULT_TOGGLE) {
              next = {
                ...next,
                beautifyCode: true,
                toCSharp: true,
                confluenceFormatPreElement: true,
                pasteToCP: true,
                fillData: true,
                truliooUtility: true,
                copyEvidence: true,
                copyAndCompareVariant: true,
              };
            }

            const saved = await persistSettings(next);
            return sendResponse({ settings: saved });
          }

          default:
            return fail(sendResponse, "Unknown message type");
        }
      } catch (e) {
        console.warn("[BG ERROR onMessage]", e);
        return fail(sendResponse, e);
      }
    })();

    // Cho phép sendResponse async
    return true;
  });
}
