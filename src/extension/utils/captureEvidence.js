import html2canvas from "html2canvas";
import { showToast } from "./toast.js";

function canvasToBlob(canvas, type = "image/png", quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
      type,
      quality
    );
  });
}

async function writeImageToClipboard(pngBlob) {
  if (!navigator?.clipboard?.write) throw new Error("Clipboard API not supported");
  const itemInit = {};
  if (pngBlob) itemInit["image/png"] = pngBlob;
  if (!Object.keys(itemInit).length) throw new Error("No image blob to write");
  await navigator.clipboard.write([new ClipboardItem(itemInit)]);
}

const DISPLAY_FALLBACK = {
  TABLE: "table",
  THEAD: "table-header-group",
  TBODY: "table-row-group",
  TFOOT: "table-footer-group",
  TR: "table-row",
  TD: "table-cell",
  TH: "table-cell",
  COLGROUP: "table-column-group",
  COL: "table-column",
};

function copyCriticalStyles(srcEl, dstEl) {
  const cs = getComputedStyle(srcEl);
  const s = dstEl.style;

  s.setProperty("border-top", cs.borderTop, "important");
  s.setProperty("border-right", cs.borderRight, "important");
  s.setProperty("border-bottom", cs.borderBottom, "important");
  s.setProperty("border-left", cs.borderLeft, "important");
  s.setProperty("border-radius", cs.borderRadius, "important");

  s.setProperty("background-color", cs.backgroundColor, "important");
  s.setProperty("box-shadow", cs.boxShadow, "important");
  s.setProperty("outline", cs.outline, "important");

  s.setProperty("box-sizing", cs.boxSizing, "important");
  s.setProperty("font", cs.font, "important");
  s.setProperty("color", cs.color, "important");
}

function ensureVisibleDisplay(srcEl, dstEl) {
  const cs = getComputedStyle(srcEl);
  if (cs.display !== "none") return;
  const fallback = DISPLAY_FALLBACK[srcEl.tagName] || "block";
  dstEl.style.setProperty("display", fallback, "important");
}

function safeDeepClone(node) {
  const clone = node.cloneNode(true);

  copyCriticalStyles(node, clone);
  ensureVisibleDisplay(node, clone);

  const srcList = node.querySelectorAll("*");
  const dstList = clone.querySelectorAll("*");
  for (let i = 0; i < dstList.length; i++) {
    const dst = dstList[i];
    const src = srcList[i];
    if (!src) break;

    copyCriticalStyles(src, dst);
    ensureVisibleDisplay(src, dst);
  }

  const s = clone.style;
  s.setProperty("transform", "none", "important");
  s.setProperty("position", "static", "important");
  s.setProperty("visibility", "visible", "important");
  s.setProperty("opacity", "1", "important");
  s.setProperty("max-width", "none", "important");
  s.setProperty("overflow", "visible", "important");

  return clone;
}

async function captureEvidenceMerged() {
  let wrapper = null;
  try {
    // open tab before capture image
    let el = document.querySelector('h3[data-testid="human-readable-dropdown"][aria-expanded="false"]');
    el && el.click();

    const panels = Array.from(document.querySelectorAll('[data-testid="record-field-table"]'));
    const sourceTables = Array.from(document.querySelectorAll('[data-testid^="datasources-table-"]'));

    const targets = [];
    if (panels.length) targets.push(...panels);
    if (sourceTables.length) targets.push(...sourceTables);

    if (!targets.length) throw new Error("No element found");

    const PAD = 8;
    wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      position: "fixed",
      left: "-99999px",
      top: "0",
      background: "#fff",
      padding: `${PAD}px`,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: "0px",
      alignItems: "stretch",
      isolation: "isolate",
      zIndex: "2147483647",
    });

    for (const el of targets) {
      const clone = safeDeepClone(el);
      const rect = el.getBoundingClientRect();
      const width = Math.max(el.scrollWidth || 0, Math.ceil(rect.width) || 0);
      if (width > 0) {
        clone.style.setProperty("width", `${width}px`, "important");
      }
      wrapper.appendChild(clone);
    }

    document.body.appendChild(wrapper);

    const scale = Math.max(2, Math.ceil(window.devicePixelRatio || 1));
    const canvas = await html2canvas(wrapper, {
      backgroundColor: "#fff",
      useCORS: true,
      allowTaint: true,
      scale,
      logging: false,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("Image size 0x0");
    }

    const pngBlob = await canvasToBlob(canvas, "image/png");
    await writeImageToClipboard(pngBlob);
    return { ok: true };
  } catch (err) {
    console.log(err)
    return { ok: false, error: String(err) };
  } finally {
    if (wrapper) wrapper.remove();
  }
}

async function copyRawResponse() {
  let el = [...document.querySelectorAll('h3')].find(x => x.innerText.includes("Debug Raw Datasource Responses") && x.ariaExpanded === "false");

  if (el) {
    if (el.ariaExpanded === "false") {
      el.click();
    }

    let contentId = el.getAttribute("aria-controls");
    let content = document.getElementById(contentId);

    setTimeout(async () => {
      if (content) {
        try {
          await navigator.clipboard.writeText(content.innerText);
          showToast(`Save raw response successfully`, "success");
        } catch (err) {
          showToast(`${String(err) || 'Fail to copy'}`, "error");
        }
      }
      else {
        showToast("Raw response tab not found", "error");
      }


    }, 1500);


  }
}

async function captureDatasourceCostImage() {
  try {
    let el = document.querySelector('h3[data-testid="human-readable-dropdown"]');

    if (!el) {
      showToast("Human readable dropdown not found", "error");
      return;
    }

    if (el.ariaExpanded === "false") el.click();

    let content = document.getElementById(el.getAttribute("aria-controls"));
    if (!content) {
      showToast("Tab content not found", "error");
      return;
    }

    let rows = content.querySelectorAll('tr');
    let jsonText = null;
    rows.forEach(tr => {
      let tds = tr.querySelectorAll('td');

      if (tds.length >= 2) {
        let key = tds[0].innerText.trim();

        if (key.includes("DatasourceCost")) {
          jsonText = tds[1].innerText.trim();
        }
      }
    });

    if (!jsonText) {
      showToast("DatasourceCost not found", "error");
      return;
    }

    // Pretty-print before sending so the preview looks clean
    let prettyJson;
    try {
      prettyJson = JSON.stringify(JSON.parse(jsonText), null, 2);
    } catch {
      prettyJson = jsonText; // fallback to raw text if not valid JSON
    }

    showToast("Capturing DatasourceCost invisibly...", "warning");
    console.log("[Capture] 1. Initiating capture. Sending OPEN_BACKGROUND_BEAUTIFY_WINDOW to background.");

    let timeout;
    const captureListener = (msg) => {
      if (msg.type === 'DEBUG_LOG') {
        console.log("[Capture/From DialogApp]", msg.log);
        return;
      }

      console.log("[Capture] 4. Received message from someone:", msg.type, msg);
      if (msg.type === 'EVIDENCE_CAPTURED_BLOB' || msg.type === 'EVIDENCE_CAPTURED_ERROR') {
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(captureListener);
      }
      if (msg.type === 'EVIDENCE_CAPTURED_BLOB') {
        try {
          console.log("[Capture] 5. Parsing Blob and writing to clipboard.");
          const arr = msg.dataUrl.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);

          const blob = new Blob([u8arr], { type: mime });

          const attemptCopy = (retries = 20) => {
            if (document.hasFocus()) {
              console.log("[Capture] 6. Document has focus, copying now.");
              writeImageToClipboard(blob)
                .then(() => showToast("DatasourceCost captured successfully", "success"))
                .catch(err => showToast(`Failed to capture: ${err}`, "error"));
            } else if (retries > 0) {
              console.log(`[Capture] 6. Document NOT focused. Retries left: ${retries}`);
              setTimeout(() => attemptCopy(retries - 1), 100);
            } else {
              showToast("Capture failed: Trulioo window never regained focus.", "error");
            }
          };
          attemptCopy();
        } catch (e) {
          showToast(`Blob conversion error: ${e}`, "error");
        }
      } else if (msg.type === 'EVIDENCE_CAPTURED_ERROR') {
        showToast(`Capture error: ${msg.error}`, "error");
      }
    };

    chrome.runtime.onMessage.addListener(captureListener);

    chrome.runtime.sendMessage({
      type: 'OPEN_BACKGROUND_BEAUTIFY_WINDOW',
      text: prettyJson,
    }, (response) => {
      console.log("[Capture] 2. Background script responded:", response);
    });

    timeout = setTimeout(() => {
      console.log("[Capture] TIMEOUT REACHED.");
      showToast("Capture timeout! Please check console logs.", "error");
      chrome.runtime.onMessage.removeListener(captureListener);
    }, 10000); // 10s to be safe
  } catch (err) {
    console.error(err);
    showToast(`${String(err) || 'Failed'}`, "error");
  }
}

export async function captureEvidence() {
  var transactionRecordID = document.getElementById('TransactionRecordID')?.value;
  if (!transactionRecordID) return;

  // Step 1: Capture tables as image → clipboard
  var result = await captureEvidenceMerged();
  if (result.ok) {
    showToast("Capture image successfully", "success");
  } else {
    showToast(`${result.error || 'Fail to copy'}`, "error");
  }

  // Step 2:After another delay, open DatasourceCost JSON in preview window
  setTimeout(() => {
    captureDatasourceCostImage();
  }, 2000);

  // Step 3:  After delay, copy raw datasource response text → clipboard
  setTimeout(async () => {
    showToast("Waiting to save raw response...", "warning");
    await copyRawResponse();
  }, 3000);
}