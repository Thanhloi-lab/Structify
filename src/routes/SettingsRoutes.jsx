import { Route, Navigate  } from "react-router-dom";
import PreviewCodeSettings from "../pages/Settings/PreviewCodeSettings";
import ToggleMenu from "../pages/Settings/ToggleMenu";
import SettingsDashboard from "../pages/Settings/SettingsDashboard";
import {
  SETTINGS_PREVIEW_CODE,
  SETTINGS_TOGGLE_MENU,
} from "../constants/route";

const SettingsRoutes = (
  <Route path="/settings">
    <Route index element={<SettingsDashboard />} />
    <Route path={SETTINGS_TOGGLE_MENU} element={<ToggleMenu />} />
    <Route path={SETTINGS_PREVIEW_CODE} element={<PreviewCodeSettings />} />
    <Route path="*" element={<Navigate to="." replace />} />
  </Route>
);

export default SettingsRoutes;