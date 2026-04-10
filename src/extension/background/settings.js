import { getSettings, setSettings, getLocal, setLocal } from "../utils/setting.js";

export async function getEffectiveSettings() {
  if (!globalThis.ExtensionSettings) {
    globalThis.ExtensionSettings = await getSettings();
  }
  const autoClosePreviewInSec = await getLocal("autoClosePreviewInSec", "60");
  return {
    ...globalThis.ExtensionSettings,
    autoClosePreviewInSec,
  };
}

export async function persistSettings(settingsObj) {
  const saved = await setSettings(settingsObj);
  globalThis.ExtensionSettings = saved;

  if (settingsObj.autoClosePreviewInSec != null) {
    await setLocal({ autoClosePreviewInSec: settingsObj.autoClosePreviewInSec });
  }
  return saved;
}
