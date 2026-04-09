/* global chrome */
/* global globalThis */
import { fillData } from "../utils/autoFillData.js";
import { captureEvidence } from "../utils/captureEvidence.js";
import { addToggleCodeBlockButton } from "../utils/confluenceHelper.js";
import { goToDebug, pasteToCP, addBusinessSearchButton } from "../utils/customerPortalHelper.js";
import { getDataSourceInformation, getMigrationScript, getNewUIDataSourceInformation, getUpdateScript } from '../utils/datasourceScripting.js';
import { checkValidSelectedTextType, handleSelectionChange, tryShowFloatingButton } from '../utils/floatingButton.js';
import { getSettings, onSettingsChanged } from "../utils/setting.js";
import { removeSpace } from "../utils/stringHelper.js";
import { showToast } from "../utils/toast.js";
import { compareVariants, getAdminPortalVariant, isValidVariantArray } from '../utils/variantUtilities.js';

chrome.runtime.onMessage.addListener(async (message, _, sendResponse) => {
  if (message.type === 'get-html' || message.type?.includes('script')) {
    try {
      var dataSourceInformation = getDataSourceInformation();
      var datasourceName = dataSourceInformation?.general != null ?
        removeSpace(dataSourceInformation?.general?.find(x => x.key.includes('datasourcename'))?.value)?.replace(/[^a-zA-Z0-9]/g, '') : null;

      if (!datasourceName) {
        dataSourceInformation = getNewUIDataSourceInformation();
        datasourceName = dataSourceInformation?.general != null ?
          removeSpace(dataSourceInformation.general.find(x => x.key.includes('datasourcename'))?.value)?.replace(/[^a-zA-Z0-9]/g, '') : null;
      }

      if (!datasourceName) {
        const errorMsg = "Cannot extract valid Datasource Information. Please ensure you are on a supported Trulioo Confluence page.";
        showToast(errorMsg, "error");
        sendResponse({ errorMsg });
        return;
      }

      if (message.type === 'get-html') {
        sendResponse({ datasourceName });
      }
      else {
        datasourceName = message.datasourceName ?? datasourceName;
        if (message.type === 'get-migration-script') {
          var migrationScript = getMigrationScript(datasourceName, dataSourceInformation);
          sendResponse({ script: migrationScript });
        }
        else if (message.type.includes('get-update-script')) {
          let commandType = message.type.split('get-update-script_');
          if (commandType.length === 2) {
            var options = commandType[1].split('/');
            var updateScript = getUpdateScript(datasourceName, options, dataSourceInformation);
            sendResponse({ script: updateScript });
          }
        }
      }
    }
    catch (err) {
      console.error("[Extension Content Script Error]", err);
      showToast(err.message || "Cannot get source content", "error");
      sendResponse({ errorMsg: err.message || "Cannot get source content" });
    }
  }
  else if (message.type === 'ping') {
    sendResponse("pong");
  }
  else if (message.action === 'FillData') {
    fillData();
    sendResponse();
    return true;
  }
  else if (message.action === "pasteToCP") {
    await pasteToCP();
    sendResponse();
    return;
  }
  else if (message.action === "captureEvidence") {
    captureEvidence();
    sendResponse();
    return true;
  }
  else if (message.action === 'CopyAdminVariant') {
    let variant = getAdminPortalVariant();
    if (variant && variant.length > 0) {
      await navigator.clipboard.writeText(JSON.stringify(variant, null, 2));
    }
    sendResponse();
    return true;
  }
  else if (message.action === 'CompareVariant') {
    let text = await navigator.clipboard.readText();
    let variant;
    try {
      variant = JSON.parse(text);
    } catch (e) {
      showToast("Data in Clipboard is not valid", "Error");
      return;
    }

    if (variant && variant.length > 0 && isValidVariantArray(variant)) {
      compareVariants(-1, variant);
    }

    return;
  }
  else if (message.action === 'ShowToggleBtn') {
    addToggleCodeBlockButton();
    sendResponse();
    return true;
  }
  sendResponse({ errorMsg: "No command" });
});

document.addEventListener('selectionchange', handleSelectionChange);

document.addEventListener('keydown', async (e) => {
  const setting = globalThis.ExtensionSettings;

  if (e.key === 'Control' && checkValidSelectedTextType() && (setting?.beautifyCode || setting?.toCSharp)) {
    tryShowFloatingButton();
  }
  else if (e.key === 'F1') {
    e.preventDefault();
    const btn = document.getElementById('mainDebugButton');
    btn.click();
  }
  else if (e.key === "F4" && setting?.copyEvidence && (document.location.href.includes("GDCDebug/DebugRecordTransaction") || document.location.href.includes("verification"))) {
    e.preventDefault();
    captureEvidence();
  }
  else if (setting?.fillData && document.location.href.includes("/verification")) {
    if (e.key === "F6") {
      e.preventDefault();
      fillData();
    }
    else if (e.key === "F7") {
      e.preventDefault();
      await pasteToCP();
    }
  }
});

// document.addEventListener("DOMContentLoaded", async () => {
//   (async () => {
//     globalThis.ExtensionSettings = await getSettings();
//     onSettingsChanged((next) => {
//       globalThis.ExtensionSettings = next;
//     });
//   })();

//   var microFrontEndRoot = document.querySelector('#micro-frontend-root')

//   var usButton = document.createElement("button");
//   usButton.id = "mainDebugButton";
//   usButton.type = "button";
//   usButton.className = "btn btn-primary";
//   usButton.textContent = "Debug (F1)";
//   usButton.style.alignItems = "center";
//   usButton.style.height = "30px";
//   usButton.style.padding = "0px 10px";
//   usButton.onclick = async function (event) {
//     var urlParams = new URLSearchParams(window.location.search);
//     var transactionRecordID = null;

//     if (microFrontEndRoot) {
//       transactionRecordID = [...document.querySelectorAll("#WideTransactionDetails li")]
//         .find(li => normalize(li.textContent).includes("transactionid"))
//         ?.querySelector("span:last-child")
//         ?.textContent ?? urlParams.get("transactionRecordId");
//     }
//     else {
//       transactionRecordID =
//         document.getElementsByClassName("file-icon")[0]?.parentNode?.textContent?.trim() ??
//         document.getElementsByClassName("value fs-exclude")[5]?.innerText ??
//         urlParams.get("transactionRecordId");
//     }

//     if (transactionRecordID) {
//       goToDebug(transactionRecordID, event.ctrlKey);
//       await navigator.clipboard.writeText(transactionRecordID);
//     }
//   };

//   if (microFrontEndRoot) {
//     microFrontEndRoot.appendChild(usButton);
//   }

//   else {
//     var supportLink = document.querySelector(
//       ".atlas-box.atlas-get-support-box.help a"
//     );

//     if (supportLink) {
//       supportLink.parentNode?.replaceChild(usButton, supportLink);
//     }
//     else {
//       supportLink = document.querySelector(
//         "#main-content-div > div.d-print-none.atlas_nav_menu > div > div"
//       );
//       if (supportLink?.innerText?.toLowerCase() === 'verification' || supportLink?.innerText?.toLowerCase() === 'run a verification') {
//         supportLink.insertAdjacentElement("beforeend", usButton);
//       }
//       else {
//         supportLink = document.querySelector('.pageHeaderText')
//         if (supportLink?.innerText?.toLowerCase() === 'verification' || supportLink?.innerText?.toLowerCase() === 'run a verification') {
//           supportLink.insertAdjacentElement("beforeend", usButton);
//         }
//         else if (document.location.href.includes("businesssearch")) {
//           supportLink = document.querySelector(".d-print-none.atlas_nav_menu .atlas-page-header-container .atlas-page-title");
//           if (supportLink) {
//             supportLink?.insertAdjacentElement("beforeend", usButton);
//             usButton.onclick = async function (event) {
//               var transactionRecordID = supportLink.dataset.x;

//               if (transactionRecordID) {
//                 goToDebug(transactionRecordID, event.ctrlKey);
//                 await navigator.clipboard.writeText(transactionRecordID);
//               }
//             };
//           }
//         }
//       }
//     }
//   }

//   var target = document.getElementsByClassName("transaction-page")[0];
//   if (target) {
//     const observer = new MutationObserver((_) => {
//       var resultsTable = document.querySelector(
//         "#content > div > div.section.search-results > table"
//       );
//       if (resultsTable)
//         for (let row of resultsTable.rows) {
//           if (row.rowIndex === 0) continue;
//           var button = document.createElement("button");
//           button.type = "button";
//           button.className = "btn btn-primary";
//           button.textContent = "Debug";
//           button.onclick = async function (event) {
//             var transactionRecordID = row.cells[4].firstChild.textContent;
//             if (transactionRecordID) {
//               goToDebug(transactionRecordID, event.ctrlKey);
//               await navigator.clipboard.writeText(transactionRecordID);
//             }
//           };
//           row.cells[4].insertAdjacentElement("beforeend", button);
//         }
//     });
//     observer.observe(target, { childList: true });
//   }
//   addBusinessSearchButton();
// });

document.addEventListener("EXT_API_CAPTURE", (e) => {
  const data = e.detail;
  console.log("[API Sniffer]", data);
  let title = document.querySelector(".d-print-none.atlas_nav_menu .atlas-page-header-container .atlas-page-title");
  if (title) {
    title.dataset.x = "";
  }

  if (data?.url === "/api/verification/kybSearch" && data.body?.transactionId) {
    if (title) {
      title.dataset.x = data.body.transactionId
    }
  }

});

(function () {
  function initTableHighlight() {
    const table = document.querySelector('.list-table');
    if (!table) return;

    const headerRow = table.tHead ? table.tHead.rows[0] : table.rows[0];
    if (!headerRow) return;

    table.querySelectorAll('tbody td').forEach(td => {
      td.addEventListener('mouseenter', e => {
        const colIndex = e.target.cellIndex;

        table.querySelectorAll('.highlight-col').forEach(el =>
          el.classList.remove('highlight-col')
        );

        const th = headerRow.cells[colIndex];
        if (th) {
          th.classList.add('highlight-col');
        }
      });

      td.addEventListener('mouseleave', () => {
        table.querySelectorAll('.highlight-col').forEach(el =>
          el.classList.remove('highlight-col')
        );
      });
    });
  }

  initTableHighlight();

  const observer = new MutationObserver(() => {
    initTableHighlight();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();

document.addEventListener("DOMContentLoaded", async () => {
  initSettings();

  const microFrontEndRoot = document.querySelector("#micro-frontend-root");
  const debugButton = createDebugButton();

  if (microFrontEndRoot) {
    microFrontEndRoot.prepend(debugButton);
  } else {
    attachButtonOldUI(debugButton);
  }

  observeTransactionTable();
  addBusinessSearchButton();
});

/* ---------------- SETTINGS ---------------- */
async function initSettings() {
  globalThis.ExtensionSettings = await getSettings();
  onSettingsChanged(next => {
    globalThis.ExtensionSettings = next;
  });
}

/* ---------------- BUTTON ---------------- */
function createDebugButton() {
  const button = document.createElement("button");
  button.id = "mainDebugButton";
  button.type = "button";
  button.className = "btn btn-primary";
  button.textContent = "Debug (F1)";
  button.style.alignItems = "center";
  button.style.height = "30px";
  button.style.padding = "0px 10px";
  button.onclick = handleDebugClick;
  return button;
}

async function handleDebugClick(event) {
  const transactionId = getTransactionId();

  if (!transactionId) return;

  const setting = globalThis.ExtensionSettings;
  goToDebug(transactionId, event.ctrlKey, setting.debugUrlMapping);

  await navigator.clipboard.writeText(transactionId);
}

/* ---------------- TRANSACTION ID ---------------- */
function getTransactionId() {
  const urlParams = new URLSearchParams(window.location.search);

  if (isMicroFrontend()) {
    return getTransactionIdNewUI() ?? urlParams.get("transactionRecordId");
  }

  return getTransactionIdOldUI() ?? urlParams.get("transactionRecordId");
}

function isMicroFrontend() {
  return !!document.querySelector("#micro-frontend-root");
}

/* ---------- NEW UI (micro frontend) ---------- */
function normalize(text) {
  return text?.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getTransactionIdNewUI() {
  const items = document.querySelectorAll("#WideTransactionDetails li");
  for (const li of items) {
    if (normalize(li.textContent).includes("transactionid")) {
      return li.querySelector("span:last-child")?.textContent;
    }
  }

  return null;
}

/* ---------- OLD UI ---------- */
function getTransactionIdOldUI() {
  return (
    document.getElementsByClassName("file-icon")[0]?.parentNode?.textContent?.trim() ??
    document.getElementsByClassName("value fs-exclude")[5]?.innerText ??
    null
  );
}

/* ---------------- BUTTON ATTACHMENT ---------------- */
function attachButtonOldUI(button) {
  let target =
    document.querySelector(".atlas-box.atlas-get-support-box.help a");

  if (target) {
    target.parentNode?.replaceChild(button, target);
    return;
  }

  target = document.querySelector(
    "#main-content-div > div.d-print-none.atlas_nav_menu > div > div"
  );

  if (isVerificationHeader(target)) {
    target.insertAdjacentElement("beforeend", button);
    return;
  }

  target = document.querySelector(".pageHeaderText");

  if (isVerificationHeader(target)) {
    target.insertAdjacentElement("beforeend", button);
    return;
  }

  if (document.location.href.includes("businesssearch")) {
    attachBusinessSearchButton(button);
  }
}

function isVerificationHeader(el) {
  const text = el?.innerText?.toLowerCase();
  return text === "verification" || text === "run a verification";
}

/* ---------- BUSINESS SEARCH PAGE ---------- */
function attachBusinessSearchButton(button) {
  const header = document.querySelector(
    ".d-print-none.atlas_nav_menu .atlas-page-header-container .atlas-page-title"
  );

  if (!header) return;

  header.insertAdjacentElement("beforeend", button);

  button.onclick = async (event) => {
    const transactionId = header.dataset.x;

    if (!transactionId) return;

    goToDebug(transactionId, event.ctrlKey);
    await navigator.clipboard.writeText(transactionId);
  };
}

/* ---------------- TABLE OBSERVER ---------------- */
function observeTransactionTable() {
  const target = document.querySelector(".transaction-page");

  if (!target) return;

  const addDebugButtonsToTable = () => {
    const table = document.querySelector(
      "#content > div > div.section.search-results > table"
    );

    if (!table) return;

    for (const row of table.rows) {
      if (row.rowIndex === 0) continue;

      const cell = row.cells[4];
      if (!cell) continue;

      // Guard: skip if Debug button already added
      if (cell.querySelector("button.ext-debug-btn")) continue;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-primary ext-debug-btn";
      button.textContent = "Debug";

      button.onclick = async (event) => {
        const transactionId = cell.firstChild?.textContent?.trim();
        if (!transactionId) return;

        const setting = globalThis.ExtensionSettings;
        goToDebug(transactionId, event.ctrlKey, setting?.debugUrlMapping);
        await navigator.clipboard.writeText(transactionId);
      };

      cell.insertAdjacentElement("beforeend", button);
    }
  };

  const observer = new MutationObserver(addDebugButtonsToTable);
  observer.observe(target, { childList: true, subtree: true });
}
