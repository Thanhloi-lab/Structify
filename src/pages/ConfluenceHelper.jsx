import {
  Alert,
  AppBar,
  Box,
  Button,
  Divider,
  FormControlLabel,
  LinearProgress,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addListener,
  getTab,
  removeListener,
  sendMessageRuntime,
} from "../apis/internalCall";
import { JSON_TYPE, XML_TYPE } from "../constants/constants";
import {
  beautifyText,
  detectDataType,
  formatXml,
} from "../utils/scriptHelpers";

/**
 * Bọc sendMessageRuntime (dạng callback) thành Promise để dùng await cho gọn
 */
function callRuntime(message, defaultValue) {
  return new Promise((resolve, reject) => {
    sendMessageRuntime(
      message,
      (response, lastError) => {
        if (lastError) {
          reject(new Error(lastError.message || lastError || "Runtime error"));
          return;
        }
        resolve(response);
      },
      defaultValue
    );
  });
}

/**
 * Gửi nội dung ngược lại page
 */
async function setInnerText(tabId, text) {
  await callRuntime({
    type: "CDP_SET_TEXT",
    tabId,
    text,
  });
}

export default function ConfluenceHelper() {
  const [tabId, setTabId] = useState(null);
  const [status, setStatus] = useState("Chưa chọn phần tử");
  const [text, setText] = useState("");
  const [liveSync, setLiveSync] = useState(true);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [picking, setPicking] = useState(false);
  const debounceRef = useRef(null);

  const beautifyCode = useCallback((code) => {
    const language = detectDataType(code);
    let beautifiedCode = beautifyText(code, language);
    try {
      if (language === JSON_TYPE) {
        beautifiedCode = JSON.stringify(JSON.parse(beautifiedCode), null, 2);
      } else if (language === XML_TYPE) {
        beautifiedCode = formatXml(beautifiedCode);
      }
    } catch {}
    return beautifiedCode;
  }, []);

  // Lấy tab hiện tại
  useEffect(() => {
    getTab(setTabId);
  }, []);

  // Nhận kết quả pick từ background
  useEffect(() => {
    const onMsg = (msg) => {
      if (msg.type === "PICK_RESULT" && msg.tabId === tabId) {
        setPicking(false);
        setStatus("Đã chọn xong ✅");
        const pretty = beautifyCode(msg.outerHTML || "");
        setText(pretty);
        setSnack({
          open: true,
          message: "Đã chọn phần tử",
          severity: "success",
        });
      }
      if (msg.type === "PICK_ERROR" && msg.tabId === tabId) {
        setPicking(false);
        setSnack({ open: true, message: msg.error, severity: "error" });
      }
    };
    addListener(onMsg);
    return () => removeListener(onMsg);
  }, [tabId, beautifyCode]);

  // ESC để hủy pick
  useEffect(() => {
    const onKey = async (e) => {
      if (e.key === "Escape" && picking && tabId) {
        try {
          await callRuntime({
            type: "CDP_STOP_PICK",
            tabId,
          });
        } catch {}
        setPicking(false);
        setStatus("Đã hủy chọn");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picking, tabId]);

  const handleStartPick = async () => {
    if (!tabId) return;
    setPicking(true);
    setStatus("Đang chọn... (ESC để hủy)");

    try {
      const response = await callRuntime({
        type: "CDP_START_PICK",
        tabId,
      });
      if (!response?.ok) {
        setPicking(false);
        setSnack({
          open: true,
          message: response?.error ?? "CDP error",
          severity: "error",
        });
      }
    } catch (err) {
      setPicking(false);
      setSnack({
        open: true,
        message: err.message || "CDP error",
        severity: "error",
      });
    }
  };

  const handleBeautifyCode = () => {
    const pretty = beautifyCode(text);
    setText(pretty);
  };

  const handleSendToPage = async (val) => {
    try {
      await setInnerText(tabId, val);
      setSnack({
        open: true,
        message: "Đã cập nhật nội dung",
        severity: "success",
      });
    } catch (e) {
      setSnack({ open: true, message: String(e), severity: "warning" });
    }
  };

  // Live sync khi gõ
  useEffect(() => {
    if (!liveSync || !text) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      handleSendToPage(text);
    }, 200);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, liveSync, tabId]); // tabId vào deps để chắc là update đúng tab

  const helperText = useMemo(() => {
    if (!text) return "Bấm 'Chọn element' rồi click vào bất kỳ phần tử.";
    return "Nội dung sẽ giữ nguyên indent/linebreak (textContent).";
  }, [text]);

  return (
    <Box
      sx={{
        width: "380px",
        height: "500px",
        bgcolor: "background.default",
        overflowY: "auto",
      }}
    >
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar variant="dense" sx={{ minHeight: 44 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            PRE Picker (DevTools)
          </Typography>
        </Toolbar>
        {picking && <LinearProgress />}
      </AppBar>

      <Stack spacing={1.5} sx={{ p: 2 }}>
        <Alert severity={text ? "success" : "info"} variant="outlined">
          {status}
        </Alert>

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={liveSync}
              onChange={(e) => setLiveSync(e.target.checked)}
            />
          }
          label="Live sync khi gõ"
        />

        <TextField
          label="Code content"
          placeholder="Nhập nội dung..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          multiline
          minRows={8}
          maxRows={15}
          fullWidth
          InputProps={{ sx: { fontFamily: "monospace", whiteSpace: "pre" } }}
          helperText={helperText}
        />

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={handleStartPick}
            disabled={!tabId}
          >
            Chọn element
          </Button>
          <Button
            variant="outlined"
            onClick={handleBeautifyCode}
            disabled={!tabId}
          >
            Format
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            onClick={() => handleSendToPage(text)}
            disabled={!tabId}
          >
            Update
          </Button>
        </Stack>

        <Divider />
        <Typography variant="caption" color="text.secondary">
          Khi click chọn xong, chế độ inspect sẽ tự tắt. Nếu đang mở Chrome
          DevTools, hãy đóng lại trước khi bấm “Chọn element”.
        </Typography>
      </Stack>

      <Snackbar
        open={snack.open}
        autoHideDuration={2000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          elevation={3}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
