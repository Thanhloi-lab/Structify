import { Route, Navigate  } from "react-router-dom";
import DebugSettings from "../pages/Settings/DebugSettings";
import PreviewCodeSettings from "../pages/Settings/PreviewCodeSettings";
import ToggleMenu from "../pages/Settings/ToggleMenu";
import SettingsLayout from "../pages/Settings/SettingsLayout";
import SettingsPanel from "../pages/Settings/SettingsPanel";
import SettingsDashboard from "../pages/Settings/SettingsDashboard";
import {
  SETTINGS_PREVIEW_CODE,
  SETTINGS_TOGGLE_MENU,
  SETTINGS_DEBUG,
} from "../constants/route";

const SettingsRoutes = (
  <Route path="/settings">
    <Route index element={<SettingsDashboard />} />
    <Route path={SETTINGS_TOGGLE_MENU} element={<ToggleMenu />} />
    <Route path={SETTINGS_PREVIEW_CODE} element={<PreviewCodeSettings />} />
    <Route path={SETTINGS_DEBUG} element={<DebugSettings />} />
    <Route path="*" element={<Navigate to="." replace />} />
  </Route>
);

export default SettingsRoutes;