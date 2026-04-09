import { getSettings, setSettings, getLocal, setLocal } from "../utils/setting.js";

/** Lấy settings + merge serverLocation/autoClosePreviewInSec từ local */
export async function getEffectiveSettings() {
  if (!globalThis.ExtensionSettings) {
    globalThis.ExtensionSettings = await getSettings();
  }
  const serverLocation = await getLocal("server_location", "us");
  const autoClosePreviewInSec = await getLocal("autoClosePreviewInSec", "60");
  return {
    ...globalThis.ExtensionSettings,
    serverLocation,
    autoClosePreviewInSec,
  };
}

/** Ghi settings & local – trả về settings vừa lưu */
export async function persistSettings(settingsObj) {
  // setSettings mong đợi object settings thuần
  const saved = await setSettings(settingsObj);
  globalThis.ExtensionSettings = saved;

  // đồng bộ các giá trị lẻ vào local
  if (settingsObj.serverLocation != null) {
    await setLocal({ server_location: settingsObj.serverLocation });
  }
  if (settingsObj.autoClosePreviewInSec != null) {
    await setLocal({ autoClosePreviewInSec: settingsObj.autoClosePreviewInSec });
  }
  return saved;
}
