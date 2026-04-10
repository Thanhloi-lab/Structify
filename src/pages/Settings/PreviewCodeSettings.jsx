// src/pages/settings/PreviewCodeSettings.jsx
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import ColorSelection, { isValidColor } from "../../components/ColorSelection";
import { JSON_COLORS_ARRAY, XML_COLORS_ARRAY } from "../../constants/constants";
import { useSettings } from "../../contexts/SettingsContext";

export default function PreviewCodeSettings() {
  const {
    settings,
    setSettings,
    saveSettings,
    ready,
    isLoading,
    error,
    loadDefaultXmlColor,
    loadDefaultJsonColor,
  } = useSettings();
  const [saving, setSaving] = useState(false);
  const lockRef = useRef(false);

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

  const submitColors = async (key) => {
    if (lockRef.current || saving) return;
    const colors = settings?.[key] || [];
    const invalid = colors.filter((c) => !isValidColor(c.color));
    if (invalid.length > 0) {
      toast.error(`Color invalid at: ${invalid.map((c) => c.key).join(", ")}`);
      return;
    }
    lockRef.current = true;
    try {
      setSaving(true);
      await saveSettings({ ...settings, [key]: colors });
      toast.success("Saved");
    } catch (e) {
      toast.error(e?.message || "Fail to set Colors");
    } finally {
      setSaving(false);
      lockRef.current = false;
    }
  };

  const handleChangeInputSettings = async () => {
    const next = { ...settings };

    // Auto close preview (>= 60 giây)
    const n = Number(next.autoClosePreviewInSec);
    if (!Number.isFinite(n) || n < 60) next.autoClosePreviewInSec = "60";

    try {
      setSaving(true);
      await saveSettings(next); // persist về background qua context
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e?.message || "Fail to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ height: "87%", overflowY: "scroll" }}>
      <CardHeader title="Preview Code Settings" />
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          {/* Auto close setting */}
          <Stack direction="column" spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Auto close Code Preview window in seconds (>60)"
              value={settings.autoClosePreviewInSec ?? ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  autoClosePreviewInSec: e.target.value,
                }))
              }
              type="text"
              inputMode="numeric"
              fullWidth
              inputProps={{
                pattern: "\\d*",
                maxLength: 10,
              }}
            />

            <Button
              variant="contained"
              onClick={handleChangeInputSettings}
              sx={{ maxWidth: "fit-content" }}
              disabled={saving}
            >
              Submit
            </Button>
          </Stack>

          <Divider />

          {/* JSON Colors */}
          <Box
            direction="row"
            spacing={2}
            sx={{ mb: 2, justifyContent: "space-between", display: "flex" }}
          >
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              JSON colors
            </Typography>
            <Button
              variant="contained"
              onClick={loadDefaultJsonColor}
              sx={{ maxWidth: "fit-content" }}
              disabled={saving}
            >
              Reset
            </Button>
          </Box>

          <ColorSelection
            initialColors={settings?.jsonColors ?? JSON_COLORS_ARRAY}
            onChange={(newColors) =>
              setSettings((prev) => ({ ...prev, jsonColors: newColors }))
            }
            handleSubmit={() => submitColors("jsonColors")}
            disabled={saving}
          />

          <Divider />

          {/* XML Colors */}
          <Box
            direction="row"
            spacing={2}
            sx={{ mb: 2, justifyContent: "space-between", display: "flex" }}
          >
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              XML colors
            </Typography>

            <Button
              variant="contained"
              onClick={loadDefaultXmlColor}
              sx={{ maxWidth: "fit-content" }}
              disabled={saving}
            >
              Reset
            </Button>
          </Box>

          <ColorSelection
            initialColors={settings?.xmlColors ?? XML_COLORS_ARRAY}
            onChange={(newColors) =>
              setSettings((prev) => ({ ...prev, xmlColors: newColors }))
            }
            handleSubmit={() => submitColors("xmlColors")}
            disabled={saving}
          />

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
