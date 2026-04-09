/* global chrome */
export const XML_COLORS_ARRAY = [
  { key: "tag", color: "#569cd6", label: "Tag name" },
  { key: "attr", color: "#9cdcfe", label: "Attribute name" },
  { key: "val", color: "#ce9178", label: "Attribute value" },
  { key: "text", color: "#d4d4d4", label: "Text content" },
  { key: "brace", color: "#808080", label: "Braces / brackets" },
];
export const JSON_COLORS_ARRAY = [
  { key: "key", color: "#9cdcfe", label: "JSON key name" },
  { key: "str", color: "#ce9178", label: "String value" },
  { key: "num", color: "#b5cea8", label: "Number value" },
  { key: "bool", color: "#569cd6", label: "Boolean value" },
  { key: "nil", color: "#569cd6", label: "Null value" },
  { key: "brace", color: "#d4d4d4", label: "Braces / brackets" },
  { key: "text", color: "#d4d4d4", label: "General text" },
];
export const SETTINGS_KEY = "settings";
export const DEFAULTS = {
  beautifyCode: true,
  toCSharp: true,
  confluenceFormatPreElement: true,
  pasteToCP: true,
  fillData: true,
  truliooUtility: true,
  copyEvidence: true,
  copyAndCompareVariant: true,
  jsonColors: JSON_COLORS_ARRAY,
  xmlColors: XML_COLORS_ARRAY,
  pasteToCPUrls: [],
  debugUrlMapping: []
};

export function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([SETTINGS_KEY], (res) => {
      const stored = res?.[SETTINGS_KEY] || {};
      const settings = {
        ...DEFAULTS,
        ...stored,
        jsonColors: stored.jsonColors ?? JSON_COLORS_ARRAY,
        xmlColors: stored.xmlColors ?? XML_COLORS_ARRAY,
      };
      resolve(settings);
    });
  });
}

export async function setSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SETTINGS_KEY]: next }, () => resolve(next));
  });
}

export function onSettingsChanged(callback) {
  const handler = (changes, area) => {
    if (area !== "local" || !changes[SETTINGS_KEY]) return;
    const next = { ...DEFAULTS, ...(changes[SETTINGS_KEY].newValue || {}) };
    callback(next, changes[SETTINGS_KEY]);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}

export function getLocal(key, defaultValue = undefined) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (res) => {
      resolve(res?.[key] ?? defaultValue);
    });
  });
}

export function setLocal(obj) {
  return new Promise((resolve) => {
    chrome.storage.local.set(obj, () => resolve(obj));
  });
}

export function removeLocal(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(keys, () => resolve());
  });
}

export function clearLocal() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => resolve());
  });
}