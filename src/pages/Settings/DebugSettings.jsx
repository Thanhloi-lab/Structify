// src/pages/settings/DebugSettings.jsx
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
  IconButton,
  Box,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSettings } from "../../contexts/SettingsContext";

export default function DebugSettings() {
  const {
    settings,
    setSettings,
    saveSettings,
    ready,
    isLoading,
    error,
    loadDebugSetting,
  } = useSettings();
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState([]);
  const [serverLocation, setServerLocation] = useState("us");
  const [previewUrls, setPreviewUrls] = useState(false);
  const [cPortalUrl, setCPortalUrl] = useState("");
  const [adminPortalUrl, setAdminPortalUrl] = useState("");

  // Xoá URL
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [urlToDelete, setUrlToDelete] = useState(null);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    setPreviewUrls(
      Array.isArray(settings?.pasteToCPUrls) ? settings.pasteToCPUrls : [],
    );
  }, [settings?.pasteToCPUrls]);

  useEffect(() => {
    setServerLocation(settings?.serverLocation?.trim() ?? "us");
  }, [settings?.serverLocation]);

  function stringToUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;

    let raw = value.trim();
    // Auto-prepend http:// if no protocol is provided
    if (!/^https?:\/\//i.test(raw)) {
      raw = `http://${raw}`;
    }

    try {
      const url = new URL(raw);
      return url.origin;
    } catch {
      return null;
    }
  }

  // ---- SAVE: serverLocation ----
  const handleSaveLocation = async () => {
    const next = {
      ...settings,
      serverLocation: settings?.serverLocation?.trim() || "us",
    };

    try {
      setSaving(true);
      setSettings(next);
      await saveSettings(next);
      toast.success("Server location saved");
    } catch (e) {
      toast.error(e?.message || "Fail to save server location");
    } finally {
      setSaving(false);
    }
  };

  // ---- SAVE: URLs ----
  const handleSaveUrls = async () => {
    if (!url || url === "") return;
    let normalizedUrl = stringToUrl(url);
    if (!normalizedUrl) {
      toast.error(`Invalid URL: ${url}`);
      return;
    }

    const prevUrls = Array.isArray(settings?.pasteToCPUrls)
      ? settings.pasteToCPUrls
      : [];

    if (prevUrls.includes(normalizedUrl.href)) {
      toast.error("URL already exists");
      return;
    }

    const next = {
      ...settings,
      pasteToCPUrls: [...prevUrls, normalizedUrl.href],
    };
    try {
      setSaving(true);
      setSettings(next);
      await saveSettings(next);
      setUrl("");
      toast.success("URLs saved");
    } catch (e) {
      toast.error(e?.message || "Fail to save URLs");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUrlMapping = async () => {
    if (!cPortalUrl || !adminPortalUrl) return;

    const normalizedCPortalUrl = stringToUrl(cPortalUrl);
    const normalizedAdminPortalUrl = stringToUrl(adminPortalUrl);

    if (!normalizedCPortalUrl) {
      toast.error(`Invalid CPortal URL: ${cPortalUrl}`);
      return;
    }
    if (!normalizedAdminPortalUrl) {
      toast.error(`Invalid Admin Portal URL: ${adminPortalUrl}`);
      return;
    }

    const prevDebugUrlMapping =
      typeof settings?.debugUrlMapping === "object" &&
      settings?.debugUrlMapping !== null
        ? settings.debugUrlMapping
        : {};

    if (prevDebugUrlMapping[normalizedCPortalUrl]) {
      toast.error("Mapping for this CPortal URL already exists");
      return;
    }

    const nextDebugUrlMapping = {
      ...prevDebugUrlMapping,
      [normalizedCPortalUrl]: normalizedAdminPortalUrl,
    };

    const next = {
      ...settings,
      debugUrlMapping: nextDebugUrlMapping,
    };

    try {
      setSaving(true);
      setSettings(next);
      await saveSettings(next);

      setCPortalUrl("");
      setAdminPortalUrl("");
      toast.success("URL mapping saved");
    } catch (e) {
      toast.error(e?.message || "Fail to save URL mapping");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUrlMapping = async (sourceUrl) => {
    const prevDebugUrlMapping =
      typeof settings?.debugUrlMapping === "object" &&
      settings?.debugUrlMapping !== null
        ? { ...settings.debugUrlMapping }
        : {};

    if (!prevDebugUrlMapping[sourceUrl]) {
      toast.error("Mapping not found");
      return;
    }

    delete prevDebugUrlMapping[sourceUrl];

    const next = {
      ...settings,
      debugUrlMapping: prevDebugUrlMapping,
    };

    try {
      setSaving(true);
      setSettings(next);
      await saveSettings(next);
      toast.success("Mapping removed");
    } catch (e) {
      toast.error(e?.message || "Fail to remove mapping");
    } finally {
      setSaving(false);
    }
  };

  // ---- DELETE FLOW ----
  const askDeleteUrl = (url) => {
    setUrlToDelete(url);
    setConfirmOpen(true);
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setUrlToDelete(null);
  };

  const confirmDelete = async () => {
    if (!urlToDelete || !Array.isArray(settings.pasteToCPUrls)) return;
    if (!settings.pasteToCPUrls.find((u) => u === urlToDelete)) {
      toast.error("Url doesn't exist");
      return;
    }

    const list = settings.pasteToCPUrls.filter((u) => u !== urlToDelete);
    const next = { ...settings, pasteToCPUrls: list };
    try {
      setSaving(true);
      setSettings(next);
      await saveSettings(next);
      toast.success("URL removed");
    } catch (e) {
      toast.error(e?.message || "Fail to remove URL");
    } finally {
      setSaving(false);
      cancelDelete();
    }
  };

  // --- Guards ---
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
        sx={{ mb: 2, justifyContent: "space-between", display: "flex" }}
      >
        <CardHeader title="Debug / Utilities" />
        <Button
          variant="contained"
          onClick={loadDebugSetting}
          sx={{ maxWidth: "fit-content" }}
          disabled={saving}
        >
          Reset
        </Button>
      </Box>
      <Divider />
      <CardContent>
        <Stack spacing={3}>
          {/* --- Server location: input + save button trong input --- */}
          <Stack spacing={1}>
            <Typography variant="subtitle2">Server location code</Typography>
            <TextField
              fullWidth
              placeholder="us"
              value={serverLocation}
              onChange={(e) => setServerLocation(e.target.value)}
              InputProps={{
                sx: { fontFamily: "monospace" },
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        handleSaveLocation();
                      }}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          {/* --- URLs: input & Save cùng hàng --- */}
          <Stack spacing={1}>
            <Typography variant="subtitle2">
              URLs to apply “Paste to CP”
            </Typography>

            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                placeholder="One URL per line, or separate with commas/semicolons"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                fullWidth
                InputProps={{
                  sx: { fontFamily: "monospace" },
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          handleSaveUrls();
                        }}
                        disabled={saving}
                      >
                        Save
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </Stack>

          {/* --- Saved URLs list với tooltip & nút X xoá --- */}
          {!!previewUrls.length && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">Saved URLs</Typography>
              <List dense disablePadding>
                {previewUrls.map((url) => (
                  <ListItem
                    key={url}
                    divider
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        size="small"
                        onClick={() => askDeleteUrl(url)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    }
                    sx={{ py: 0.5 }}
                  >
                    <Tooltip
                      arrow
                      placement="top"
                      title={
                        <Box
                          sx={{
                            fontFamily: "monospace",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {url}
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={url}
                        primaryTypographyProps={{
                          sx: {
                            fontFamily: "monospace",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "100%",
                          },
                        }}
                      />
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
            </Stack>
          )}

          <Stack spacing={1}>
            <Typography variant="subtitle2">
              Debug URL Mapping
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Map a Customer Portal URL (source) to an Admin Portal URL
              (destination) for the Debug button redirect.
            </Typography>

            <Stack spacing={1}>
              <TextField
                label="CPortal URL (source)"
                placeholder="e.g. portal.us.qa.trulioo.com or https://portal.us.qa.trulioo.com/verification"
                value={cPortalUrl}
                onChange={(e) => setCPortalUrl(e.target.value)}
                fullWidth
                required
                InputProps={{
                  sx: { fontFamily: "monospace" },
                }}
              />

              <TextField
                label="Admin Portal URL (destination)"
                placeholder="e.g. adminportal.us.qa.trulioo.com or https://adminportal.us.qa.trulioo.com"
                value={adminPortalUrl}
                onChange={(e) => setAdminPortalUrl(e.target.value)}
                fullWidth
                required
                InputProps={{
                  sx: { fontFamily: "monospace" },
                }}
              />

              <Stack direction="row" justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={handleSaveUrlMapping}
                  disabled={
                    saving || !cPortalUrl.trim() || !adminPortalUrl.trim()
                  }
                >
                  Save Mapping
                </Button>
              </Stack>
            </Stack>

            {/* --- URL Mapping Table --- */}
            {settings?.debugUrlMapping &&
              typeof settings.debugUrlMapping === "object" &&
              Object.keys(settings.debugUrlMapping).length > 0 && (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                        >
                          CPortal (source)
                        </TableCell>
                        <TableCell sx={{ width: 40 }} />
                        <TableCell
                          sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
                        >
                          Admin Portal (destination)
                        </TableCell>
                        <TableCell sx={{ width: 40 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(settings.debugUrlMapping).map(
                        ([source, dest]) => (
                          <TableRow key={source}>
                            <TableCell
                              sx={{
                                fontFamily: "monospace",
                                wordBreak: "break-all",
                                fontSize: "0.8rem",
                              }}
                            >
                              {source}
                            </TableCell>
                            <TableCell align="center">
                              <ArrowForwardIcon
                                fontSize="small"
                                color="action"
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                fontFamily: "monospace",
                                wordBreak: "break-all",
                                fontSize: "0.8rem",
                              }}
                            >
                              {dest}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDeleteUrlMapping(source)
                                }
                                disabled={saving}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
          </Stack>

          {/* --- Saving indicator tuỳ chọn --- */}
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

      {/* --- Confirm delete dialog --- */}
      <Dialog open={confirmOpen} onClose={cancelDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Xoá URL?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Bạn có chắc muốn xoá URL này?</Typography>
          <Box
            sx={{
              mt: 1,
              p: 1,
              bgcolor: "action.hover",
              borderRadius: 1,
              fontFamily: "monospace",
              wordBreak: "break-all",
            }}
          >
            {urlToDelete}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Huỷ</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Xoá
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
