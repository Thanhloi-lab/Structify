// src/contexts/SettingsContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { sendMessageRuntime } from "../apis/internalCall";
import { DEFAULT_SETTINGS } from "../constants/constants"

const SettingsContext = createContext(null);
const LOAD_DEFAULT_JSON_COLOR = "LOAD_DEFAULT_JSON_COLOR";
const LOAD_DEFAULT_XML_COLOR = "LOAD_DEFAULT_XML_COLOR";
const LOAD_DEFAULT_DEBUG_SETTING = "LOAD_DEFAULT_DEBUG_SETTING";
const LOAD_DEFAULT_TOGGLE = "LOAD_DEFAULT_TOGGLE";

export function SettingsProvider({
  children,
  loadType = "GET_SETTINGS", // message type để background trả settings
  saveType = "SAVE_SETTINGS", // (tuỳ chọn) type để lưu về background
  updatedEventType = "SETTINGS_UPDATED", // event type khi background push thay đổi
  autoLoad = true,
}) {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const doLoad = useCallback(
    (type) => {
      setIsLoading(true);
      setError(null);
      try {
        sendMessageRuntime({ type }, (result, lastError) => {
          if (lastError) {
            setError(lastError.message || "Fail to load settings");
            setIsLoading(false);
            return;
          }
          if (result && result.settings) {
            setSettings(result.settings);
            setIsLoading(false);
            return;
          }
          setError("Fail to load settings");
          setIsLoading(false);
        }, { settings: DEFAULT_SETTINGS });
      } catch (e) {
        setError(e?.message || "Fail to load settings");
        setIsLoading(false);
      }
    },
    [setError, setIsLoading, setSettings]
  );

  // 1) load như hiện tại: truyền vào loadType (giá trị state/prop bên ngoài)
  const loadSettings = useCallback(
    (type = loadType) => {
      doLoad(type);
    },
    [doLoad, loadType]
  );

  const loadDefaultJsonColor = useCallback(() => {
    doLoad(LOAD_DEFAULT_JSON_COLOR);
  }, [doLoad]);

  const loadDefaultXmlColor = useCallback(() => {
    doLoad(LOAD_DEFAULT_XML_COLOR);
  }, [doLoad]);

  const loadDebugSetting = useCallback(() => {
    doLoad(LOAD_DEFAULT_DEBUG_SETTING);
  }, [doLoad]);

  const loadDefaultToggleSetting = useCallback(() => {
    doLoad(LOAD_DEFAULT_TOGGLE);
  }, [doLoad]);

  // (tuỳ chọn) Lưu ngược về background
  const saveSettings = useCallback(
    (next) => {
      try {
        sendMessageRuntime({ type: saveType, payload: next }, (result, lastError) => {
          if (lastError) {
            setError(lastError.message || "Fail to save settings");
            return;
          }

          if (result?.settings) setSettings(result.settings);
          else setSettings(next);
        }, { settings: DEFAULT_SETTINGS });
      } catch (e) {
        setError(e?.message || "Fail to save settings");
      }
    },
    [saveType]
  );

  // Auto load khi mount
  useEffect(() => {
    if (autoLoad) loadSettings();
  }, [autoLoad, loadSettings]);

  // Lắng nghe push update từ background (ví dụ khi options page lưu)
  useEffect(() => {
    const onMessage = (msg, _sender, _sendResponse) => {
      if (msg?.type === updatedEventType && msg?.settings) {
        setSettings(msg.settings);
      }
    };
    try {
      window?.chrome?.runtime?.onMessage?.addListener(onMessage);
      return () => {
        window?.chrome?.runtime?.onMessage?.removeListener(onMessage);
      };
    } catch {
      return () => { };
    }
  }, [updatedEventType]);

  const value = useMemo(
    () => ({
      settings, // settings toàn app
      setSettings, // chỉ set local (UI); dùng saveSettings nếu muốn persist
      saveSettings, // gửi về background
      loadSettings, // reload thủ công
      reload: loadSettings,
      loadDefaultJsonColor,
      loadDefaultXmlColor,
      loadDebugSetting,
      loadDefaultToggleSetting,
      isLoading,
      error,
      ready: !!settings && !isLoading,
    }),
    [
      settings,
      isLoading,
      error,
      loadSettings,
      saveSettings,
      loadDefaultJsonColor,
      loadDefaultXmlColor,
      loadDebugSetting,
      loadDefaultToggleSetting,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}