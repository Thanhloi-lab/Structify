export const DASHBOARD = "/"
export const SETTINGS = "/settings"
export const SETTINGS_PREVIEW_CODE = "preview-code"
export const SETTINGS_TOGGLE_MENU = "toggle-menu"
export const SETTINGS_CHAT_OPTIMIZER = "chat-optimizer"

export const SETTINGS_TAB_ROUTES = [
  { path: SETTINGS, label: "Main" },
  { path: `${SETTINGS}${SETTINGS_PREVIEW_CODE}`, label: "Preview Code" },
  { path: `${SETTINGS}${SETTINGS_TOGGLE_MENU}`, label: "Toggle Menu" },
  { path: `${SETTINGS}${SETTINGS_CHAT_OPTIMIZER}`, label: "Chat Optimizer" },
];
