import ReactDOM from "react-dom/client";
import DialogApp from "./DialogApp";
import './index.css'
import { SettingsProvider } from './contexts/SettingsContext'

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <SettingsProvider loadType="GET_SETTINGS"
    saveType="SAVE_SETTINGS"
    updatedEventType="SETTINGS_UPDATED"
    autoLoad>
    <DialogApp />
  </SettingsProvider>
);