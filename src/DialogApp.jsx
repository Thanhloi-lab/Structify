/* global chrome */
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Paper,
  Snackbar,
  Toolbar,
  Tooltip,
} from "@mui/material";
import { toBlob, toPng } from "html-to-image";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import CodePreviewBlock from "./components/CodePreviewBlock";
import { useSettings } from "./contexts/SettingsContext";

export default function DialogApp() {
  const { ready } = useSettings();
  const { code, convertToCSharp, lang, autoClosePreviewInSec, autoCapture, callerTabId } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      code: decodeURIComponent(params.get("code") || ""),
      convertToCSharp: params.get("convertToCSharp")?.toLowerCase() === "true",
      lang: params.get("lang"),
      autoClosePreviewInSec: params.get("autoClosePreviewInSec")
        ? Number(params.get("autoClosePreviewInSec"))
        : 60, //default close in 1 min
      autoCapture: params.get("autoCapture") === "true",
      callerTabId: params.get("callerTabId"),
    };
  }, []);

  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const shotRef = useRef(null);

  const handleZoomIn = () => setFontSize((prev) => Math.min(prev + 2, 40));
  const handleZoomOut = () => setFontSize((prev) => Math.max(prev - 2, 8));

  function closeSelf() {
    window.close?.();

    if (chrome?.windows?.getCurrent && chrome?.windows?.remove) {
      chrome.windows.getCurrent((win) => win && chrome.windows.remove(win.id));
    } else if (chrome?.tabs?.query && chrome?.tabs?.remove) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs?.[0]?.id) chrome.tabs.remove(tabs[0].id);
      });
    }
  }

  useEffect(() => {
    try {
      window.focus();
    } catch { }
    if (document.body) {
      document.body.tabIndex = -1;
      document.body.focus();
    }

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeSelf();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  const useIdleAutoClose = (closeFn, idleMs = 60 * 1000) => {
    const tRef = useRef(null);

    useEffect(() => {
      const start = () => {
        clearTimeout(tRef.current);
        tRef.current = setTimeout(closeFn, idleMs);
      };

      start();

      const events = [
        "mousemove",
        "keydown",
        "click",
        "wheel",
        "scroll",
        "touchstart",
      ];
      events.forEach((e) =>
        document.addEventListener(e, start, { passive: true })
      );

      return () => {
        clearTimeout(tRef.current);
        events.forEach((e) => document.removeEventListener(e, start));
      };
    }, [closeFn, idleMs]);
  };

  //auto close after
  useIdleAutoClose(closeSelf, autoClosePreviewInSec * 1000);

  useEffect(() => {
    const debugLog = (msg) => {
      console.log(msg);
      if (callerTabId && chrome?.tabs?.sendMessage) {
        chrome.tabs.sendMessage(Number(callerTabId), { type: "DEBUG_LOG", log: msg }, () => { });
      }
    };

    if (autoCapture) debugLog(`Dependencies status -> code: ${!!code}, ready: ${ready}`);

    if (autoCapture && code && ready) {
      debugLog("All conditions met! Setting 500ms timeout before capturing...");
      const timer = setTimeout(async () => {
        debugLog("Timeout finished. Beginning screen capture process.");
        const node = shotRef.current;

        const respondAndClose = (msg) => {
          debugLog(`Executing respondAndClose with type: ${msg.type}`);
          if (callerTabId && chrome?.tabs?.sendMessage) {
            chrome.tabs.sendMessage(Number(callerTabId), msg, () => {
              debugLog("sendMessage completed, closing window.");
              closeSelf();
            });
          } else {
            debugLog("callerTabId missing or chrome.tabs missing. Just closing.");
            closeSelf();
          }
        };

        if (!node) {
          debugLog("ERROR: shotRef.current is empty! Node not found.");
          respondAndClose({ type: "EVIDENCE_CAPTURED_ERROR", error: "Node not found" });
          return;
        }

        try {
          if (document.fonts?.ready) {
            debugLog("Waiting for fonts to load...");
            await document.fonts.ready;
            debugLog("Fonts loaded.");
          }
          const rect = node.getBoundingClientRect();
          debugLog(`Node bounds: width=${rect.width}, height=${rect.height}`);

          const MAX_DIM = 16384;
          const safeRatio = Math.min(2, Math.max(1, MAX_DIM / Math.max(rect.width, rect.height)));
          const pixelRatio = Math.max(1, Math.min(window.devicePixelRatio || 1, safeRatio));
          debugLog(`Calculated pixelRatio: ${pixelRatio}`);

          const dataUrl = await toPng(node, {
            pixelRatio,
            backgroundColor: "#1e1e1e",
            cacheBust: true,
          });

          debugLog(`toPng succeeded. base64 string length: ${dataUrl?.length}`);
          respondAndClose({ type: "EVIDENCE_CAPTURED_BLOB", dataUrl });
        } catch (err) {
          debugLog(`toPng THREW ERROR: ${err}`);
          respondAndClose({ type: "EVIDENCE_CAPTURED_ERROR", error: String(err) });
        }
      }, 500); // 500ms should be enough for SyntaxHighlighter to compute

      return () => clearTimeout(timer);
    }
  }, [autoCapture, code, ready, callerTabId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch (err) {
      toast.error(`Copy image failed. ${err}`);
    }
  };

  const handleScreenshotToClipboard = async () => {
    const node = shotRef.current;
    if (!node) return;

    try {
      if (document.fonts?.ready) await document.fonts.ready;

      const rect = node.getBoundingClientRect();
      const MAX_DIM = 16384;
      const safeRatio = Math.min(
        2,
        MAX_DIM / Math.max(rect.width, rect.height)
      );
      const pixelRatio = Math.max(
        1,
        Math.min(window.devicePixelRatio || 1, safeRatio)
      );

      const blob = await toBlob(node, {
        pixelRatio,
        backgroundColor: "#1e1e1e",
        cacheBust: true,
      });

      if (!blob) {
        toast.error("Copy image failed");
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);

      setCopied(true);
    } catch (err) {
      toast.error(`Copy image failed. ${err}`);
    }
  };

  const basePaperSx = {
    p: 0,
    mt: 2,
    bgcolor: "#1e1e1e",
    position: "relative",
    width: "100%",
    overflowX: "hidden",
    paddingLeft: "0px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#fff" }}>
      <AppBar
        position="sticky"
        color="default"
        elevation={1}
        sx={{ bgcolor: "#161616" }}
      >
        <Toolbar
          variant="dense"
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          <Box>
            <Tooltip title="Zoom In">
              <IconButton
                onClick={handleZoomIn}
                size="small"
                sx={{ color: "#fff", mr: 1 }}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Zoom Out">
              <IconButton
                onClick={handleZoomOut}
                size="small"
                sx={{ color: "#fff", mr: 2 }}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box>
            <Tooltip title="Copy to clipboard">
              <IconButton
                onClick={handleCopy}
                size="small"
                edge="end"
                sx={{ color: "#fff", mr: 1 }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Screenshot code">
              <IconButton
                onClick={handleScreenshotToClipboard}
                size="small"
                sx={{ color: "#fff", mr: 1 }}
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 2, maxWidth: "100% !important", ...(autoCapture ? { minWidth: "1200px" } : {}) }}>
        <Paper sx={{ ...basePaperSx, ...(autoCapture ? { minWidth: "1200px" } : {}) }} ref={shotRef}>
          <CodePreviewBlock
            code={code}
            convertToCSharp={convertToCSharp}
            lang={lang}
            fontSize={fontSize}
          />
        </Paper>
      </Container>

      <Snackbar
        open={copied}
        autoHideDuration={1600}
        onClose={() => setCopied(false)}
        message="Saved to clipboard!"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </div>
  );
}
