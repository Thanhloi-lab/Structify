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
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { XML_COLORS_ARRAY, JSON_COLORS_ARRAY } from "../../constants/constants";
import ColorSelection, { isValidColor } from "../../components/ColorSelection";
import { useSettings } from "../../contexts/SettingsContext";

const LABELS = {
  beautifyCode: "Beautify Code",
  toCSharp: "Convert to C#",
  confluenceFormatPreElement: "Confluence Format Pre Element",
  pasteToCP: "Paste to CP",
  fillData: "Fill Data",
  truliooUtility: "Trulioo Utility",
  copyEvidence: "Capture evidence in AdminPortal",
  copyAndCompareVariant:
    "Copy variant in AdminPortal as Array and compare it with DSDR",
  jsonColors: "JSON's colors setting",
  xmlColors: "XML's colors setting",
};

export default function SettingsPanel() {
  const { settings, setSettings, saveSettings, loadSettings, ready, isLoading, error } = useSettings();
  const [saving, setSaving] = useState(false);
  const submitLockRef = useRef(false);
  const booleanKeys = useMemo(() => {
    if (!settings) return []; // vẫn trả về mảng rỗng, không return component ở đây
    return Object.keys(LABELS).filter((k) => typeof settings?.[k] === "boolean");
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
        Fail to load settings.{" "}
        <Typography
          component="span"
          sx={{ ml: 1, cursor: "pointer", textDecoration: "underline" }}
          onClick={() => loadSettings()}
        >
          Retry
        </Typography>
      </Alert>
    );
  }

  // ===== Helpers =====
  // Submit 2 input dạng text (serverLocation & autoClosePreviewInSec)
  const handleChangeInputSettings = async () => {
    const next = { ...settings };

    // Server location code
    if (!next.serverLocation) next.serverLocation = "us";

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

  // Toggle boolean key
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

  // Submit màu (jsonColors/xmlColors)
  const handleSubmitColors = async (e, key) => {
    e?.preventDefault?.();
    if (submitLockRef.current || saving) return;

    const colors = settings?.[key] || [];
    const invalid = colors.filter((c) => !isValidColor(c.color));
    if (invalid.length > 0) {
      toast.error(`Color invalid at: ${invalid.map((c) => c.key).join(", ")}`);
      return;
    }

    submitLockRef.current = true;
    try {
      setSaving(true);
      await saveSettings({ ...settings, [key]: colors });
      toast.success("Saved");
    } catch (e) {
      toast.error(e?.message || "Fail to set Colors");
    } finally {
      setSaving(false);
      submitLockRef.current = false;
    }
  };

  return (
    <Card variant="outlined">
      <CardHeader title="Extension Settings" />

      <Box sx={{ margin: "0 0 16px 16px" }}>
        <Button
          variant="contained"
          onClick={() => loadSettings("DEFAULT_SETTINGS")} // yêu cầu background nạp default
          disabled={saving}
        >
          Load default
        </Button>
      </Box>

      <Divider />

      <CardContent
        sx={{
          width: "100%",
          height: "380px",
          overflowY: "auto",
        }}
      >
        {/* Input settings */}
        <Stack direction="column" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <TextField
              fullWidth
              label="Server location code"
              value={settings.serverLocation ?? ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, serverLocation: e.target.value }))
              }
              InputProps={{
                sx: { fontFamily: "monospace", whiteSpace: "pre" },
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              label={`Auto close Code Preview window in seconds (>60)`}
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
          </Box>

          <Button
            variant="contained"
            onClick={handleChangeInputSettings}
            sx={{ maxWidth: "50%" }}
            disabled={saving}
          >
            Submit
          </Button>
        </Stack>

        <Divider />

        {/* Toggles */}
        <CardHeader subheader="Toggle to on/off setting's option" />
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

        <Divider />

        {/* JSON colors */}
        <CardHeader subheader="JSON's color" />
        <ColorSelection
          initialColors={settings?.jsonColors ?? JSON_COLORS_ARRAY}
          onChange={(newColors) =>
            setSettings((prev) => ({ ...prev, jsonColors: newColors }))
          }
          handleSubmit={(e) => handleSubmitColors(e, "jsonColors")}
          disabled={saving}
        />

        <Divider />

        {/* XML colors */}
        <CardHeader subheader="XML's color" />
        <ColorSelection
          initialColors={settings?.xmlColors ?? XML_COLORS_ARRAY}
          onChange={(newColors) =>
            setSettings((prev) => ({ ...prev, xmlColors: newColors }))
          }
          handleSubmit={(e) => handleSubmitColors(e, "xmlColors")}
          disabled={saving}
        />

        {saving && (
          <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
            Saving.....
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
