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
import { DEFAULT_SETTINGS } from "../constants/constants";

const SettingsContext = createContext(null);
const LOAD_DEFAULT_JSON_COLOR = "LOAD_DEFAULT_JSON_COLOR";
const LOAD_DEFAULT_XML_COLOR = "LOAD_DEFAULT_XML_COLOR";
const LOAD_DEFAULT_TOGGLE = "LOAD_DEFAULT_TOGGLE";
const LOAD_CHAT_OPTIMIZER_SETTING = "LOAD_CHAT_OPTIMIZER_SETTING";

export function SettingsProvider({
  children,
  loadType = "GET_SETTINGS",
  saveType = "SAVE_SETTINGS",
  updatedEventType = "SETTINGS_UPDATED",
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
        sendMessageRuntime(
          { type },
          (result, lastError) => {
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
          },
          { settings: DEFAULT_SETTINGS },
        );
      } catch (e) {
        setError(e?.message || "Fail to load settings");
        setIsLoading(false);
      }
    },
    [setError, setIsLoading, setSettings],
  );

  const loadSettings = useCallback(
    (type = loadType) => {
      doLoad(type);
    },
    [doLoad, loadType],
  );

  const loadDefaultJsonColor = useCallback(() => {
    doLoad(LOAD_DEFAULT_JSON_COLOR);
  }, [doLoad]);

  const loadDefaultXmlColor = useCallback(() => {
    doLoad(LOAD_DEFAULT_XML_COLOR);
  }, [doLoad]);

  const loadDefaultToggleSetting = useCallback(() => {
    doLoad(LOAD_DEFAULT_TOGGLE);
  }, [doLoad]);

  const loadChatOptimizerSetting = useCallback(() => {
    doLoad(LOAD_CHAT_OPTIMIZER_SETTING);
  }, [doLoad]);

  // (tuỳ chọn) Lưu ngược về background
  const saveSettings = useCallback(
    (next) => {
      try {
        sendMessageRuntime(
          { type: saveType, payload: next },
          (result, lastError) => {
            if (lastError) {
              setError(lastError.message || "Fail to save settings");
              return;
            }

            if (result?.settings) setSettings(result.settings);
            else setSettings(next);
          },
          { settings: DEFAULT_SETTINGS },
        );
      } catch (e) {
        setError(e?.message || "Fail to save settings");
      }
    },
    [saveType],
  );

  useEffect(() => {
    if (autoLoad) loadSettings();
  }, [autoLoad, loadSettings]);

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
      settings,
      setSettings,
      saveSettings,
      loadSettings,
      reload: loadSettings,
      loadDefaultJsonColor,
      loadDefaultXmlColor,
      loadDefaultToggleSetting,
      loadChatOptimizerSetting,
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
      loadDefaultToggleSetting,
      loadChatOptimizerSetting
    ],
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
