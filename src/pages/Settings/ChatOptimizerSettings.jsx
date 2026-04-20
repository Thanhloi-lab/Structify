// src/pages/settings/ChatOptimizerSettings.jsx
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  TextField,
  Button,
  Box,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSettings } from "../../contexts/SettingsContext";

export default function ChatOptimizerSettings() {
  const {
    settings,
    setSettings,
    saveSettings,
    ready,
    isLoading,
    error,
    loadChatOptimizerSetting,
  } = useSettings();

  const [saving, setSaving] = useState(false);

  const [keepCount, setKeepCount] = useState(15);
  const [restoreCount, setRestoreCount] = useState(5);
  const [chatContainerSelector, setChatContainerSelector] = useState('#main div.flex.flex-col.text-sm');
  const [completelyRemove, setCompletelyRemove] = useState(true);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (settings) {
      setKeepCount(settings.keepCount ?? 15);
      setRestoreCount(settings.restoreCount ?? 5);
      setChatContainerSelector(settings.chatContainerSelector ?? '#main div.flex.flex-col.text-sm');
      setCompletelyRemove(settings.completelyRemove ?? true);
    }
  }, [settings]);

  const handleSave = async () => {
    const next = {
      ...settings,
      keepCount: Number(keepCount),
      restoreCount: Number(restoreCount),
      chatContainerSelector,
      completelyRemove,
    };

    try {
      setSaving(true);
      setSettings(next);
      await saveSettings(next);
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e?.message || "Fail to save settings");
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <Card variant="outlined" sx={{ height: "87%", overflowY: "scroll" }}>
      <Box
        direction="row"
        spacing={2}
        sx={{ mb: 2, justifyContent: "space-between", display: "flex", alignItems: "center", pr: 2 }}
      >
        <CardHeader title="Chat Optimizer Settings" />
        <Button
          variant="contained"
          onClick={loadChatOptimizerSetting}
          sx={{ maxWidth: "fit-content", height: "fit-content" }}
          disabled={saving}
        >
          Reset
        </Button>
      </Box>
      <Divider />
      <CardContent>
        <Stack spacing={3}>
          <Stack spacing={2}>
            <TextField
              label="Keep Count"
              type="number"
              fullWidth
              value={keepCount}
              onChange={(e) => setKeepCount(e.target.value)}
            />

            <TextField
              label="Restore Count"
              type="number"
              fullWidth
              value={restoreCount}
              onChange={(e) => setRestoreCount(e.target.value)}
            />

            <TextField
              label="Chat Container Selector"
              fullWidth
              value={chatContainerSelector}
              onChange={(e) => setChatContainerSelector(e.target.value)}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={completelyRemove}
                  onChange={(e) => setCompletelyRemove(e.target.checked)}
                />
              }
              label="Completely Remove Elements"
            />
          </Stack>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ alignSelf: "flex-start" }}
          >
            Save Settings
          </Button>

          {saving && (
            <Alert
              severity="info"
              variant="outlined"
              sx={{ alignItems: "center" }}
            >
              Saving...
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}