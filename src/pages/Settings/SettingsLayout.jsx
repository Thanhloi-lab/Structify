// src/pages/settings/SettingsLayout.jsx
import { Outlet, Link, useLocation } from "react-router-dom";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { SETTINGS_TAB_ROUTES } from "../../constants/route";

export default function SettingsLayout() {
  const location = useLocation();
  const tabValue = SETTINGS_TAB_ROUTES.map((x) => x.path).includes(
    location.pathname
  )
    ? location.pathname
    : false;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Extension Settings
      </Typography>

      <Tabs value={tabValue}>
        {SETTINGS_TAB_ROUTES.map((x) => {
          return (
            <Tab label={x.label} value={x.path} component={Link} to={x.path} />
          );
        })}
      </Tabs>

      <Box sx={{ mt: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
