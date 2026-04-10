// src/pages/settings/ToggleMenuSettings.jsx
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSettings } from "../../contexts/SettingsContext";

const LABELS = {
  beautifyCode: "Beautify Code",
  toCSharp: "Convert to C#",
  jsonColors: "JSON's colors setting",
  xmlColors: "XML's colors setting",
  allowChatGPTOptimize: "Allow ChatGPT Optimizer"
};

export default function ToggleMenuSettings() {
  const {
    settings,
    saveSettings,
    ready,
    isLoading,
    error,
    loadDefaultToggleSetting,
  } = useSettings();
  const [saving, setSaving] = useState(false);

  const booleanKeys = useMemo(() => {
    if (!settings) return [];
    return Object.keys(LABELS).filter(
      (k) => typeof settings?.[k] === "boolean"
    );
  }, [settings]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (!ready) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ p: 4 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          {isLoading ? "Loading settings..." : "Settings not loaded"}
        </Typography>
      </Stack>
    );
  }

  if (!settings) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Fail to load settings
      </Alert>
    );
  }

  const toggle = async (key) => {
    if (typeof settings?.[key] !== "boolean") return;
    const next = { ...settings, [key]: !settings[key] };
    try {
      setSaving(true);
      await saveSettings(next);
      toast.success("Saved");
    } catch (e) {
      toast.error(e?.message || "Fail to set settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ height: "87%", overflowY: "scroll" }}>
      <Box
        direction="row"
        spacing={2}
        sx={{ mb: 2, justifyContent: "space-between", display: "flex" }}
      >
        <CardHeader title="Toggle Menu Settings" />
        <Button
          variant="contained"
          onClick={loadDefaultToggleSetting}
          sx={{ maxWidth: "fit-content" }}
          disabled={saving}
        >
          Reset
        </Button>
      </Box>
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          <Stack spacing={2}>
            {booleanKeys.map((key) => (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    checked={!!settings[key]}
                    onChange={() => toggle(key)}
                    disabled={saving}
                  />
                }
                label={LABELS[key] || key}
              />
            ))}
          </Stack>

          {saving && (
            <Alert severity="info" variant="outlined">
              Saving...
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
