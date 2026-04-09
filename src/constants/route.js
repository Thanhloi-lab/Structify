export const DASHBOARD = "/"
export const TRULIOO_UTILITY = "/trulioo"
export const CONFLUENCE_HELPER = "/confluenceHelper"
export const SETTINGS = "/settings"
export const SETTINGS_PREVIEW_CODE = "preview-code"
export const SETTINGS_TOGGLE_MENU = "toggle-menu"
export const SETTINGS_DEBUG = "debug"

export const SETTINGS_TAB_ROUTES = [
  { path: SETTINGS, label: "Main" },
  { path: `${SETTINGS}${SETTINGS_PREVIEW_CODE}`, label: "Preview Code" },
  { path: `${SETTINGS}${SETTINGS_TOGGLE_MENU}`, label: "Toggle Menu" },
  { path: `${SETTINGS}${SETTINGS_DEBUG}`, label: "Debug" },
];
