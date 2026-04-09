/* global chrome */
import { removeSpace } from "./stringHelper.js";
import { getNormalizedKeyByFieldName } from "./normalizedFieldMapping.js";

export async function goToDebug(transactionRecordID, ctrlKeyPressed, urlMapping) {
  if (!transactionRecordID) return;

  const currentDomain = document.domain;
  let baseUrl = null;

  /* ---------- DEFAULT MAPPING (3 built-in patterns) ---------- */
  if (currentDomain === "localhost" || currentDomain === "127.0.0.1") {
    // Localhost: CPortal runs on 44333, Admin on 44331
    baseUrl = `${window.location.protocol}//localhost:44331`;
  }
  else if (currentDomain.includes("staging")) {
    // Staging: test-adminportal-{location}.staging.trulioo.com
    const locationCode = await fetchDebugServerLocation();
    baseUrl = `${window.location.protocol}//test-adminportal-${locationCode}.staging.trulioo.com`;
  }
  else if (currentDomain.includes("portal")) {
    // QA/Prod: adminportal.{location}.qa.trulioo.com
    const locationCode = await fetchDebugServerLocation();
    baseUrl = `${window.location.protocol}//adminportal.${locationCode}.qa.trulioo.com`;
  }

  /* ---------- USER MAPPING (from Settings page) ---------- */
  if (!baseUrl && urlMapping && typeof urlMapping === "object") {
    const currentOrigin = window.location.origin;
    const mapped = urlMapping[currentOrigin];
    if (mapped) {
      baseUrl = mapped;
    }
  }

  /* ---------- FALLBACK ---------- */
  if (!baseUrl) {
    // Last resort: replace "portal" → "adminportal" and "44333" → "44331" in current host (which *includes* port)
    let hostString = window.location.host.replace("portal", "adminportal");
    hostString = hostString.replace("44333", "44331");
    baseUrl = `${window.location.protocol}//${hostString}`;
  }

  /* ---------- OPEN DEBUG ---------- */
  const debugUrl = `${baseUrl}/GDCDebug/DebugRecordTransaction?transactionRecordID=${transactionRecordID}`;

  window.open(
    debugUrl,
    ctrlKeyPressed ? "_blank" : "trulioo"
  );
}

export async function pasteToCP() {
  const copied = await navigator.clipboard.readText();
  const rows = copied.split(/\r?\n/);

  const clipboardData = [];
  const normalizedData = {};

  rows.forEach(function (row) {
    const keyValue = row.split(/\t+/);
    if (keyValue.length === 2) {
      clipboardData.push({ key: keyValue[0], value: keyValue[1] });
      const normKey = getNormalizedKeyByFieldName(keyValue[0]);
      if (normKey) {
        normalizedData[normKey] = keyValue[1];
      } else {
        // Fallback for fields not in mapping
        normalizedData[keyValue[0]] = keyValue[1];
      }
    }
  });

  const elements = document.querySelectorAll(
    "textarea[id], select[id], input[id]:not([type='checkbox'])"
  );

  elements.forEach((el) => {
    let valToSet = null;

    // 1. Try matching with normalized alias (New UI & generic)
    const parts = el.id.split('-');
    const suffix = parts.length > 1 ? parts[parts.length - 1] : el.id;

    if (suffix && /^[A-Za-z0-9]+$/.test(suffix)) {
      const normKey = getNormalizedKeyByFieldName(suffix);
      if (normKey && normalizedData[normKey] !== undefined) {
        valToSet = normalizedData[normKey];
      }
    }

    // 2. Try exact end-with match against raw clipboard keys (Old UI exact matching)
    if (valToSet === null) {
      for (const item of clipboardData) {
        if (el.id.endsWith(item.key)) {
          valToSet = item.value;
          break;
        }
      }
    }

    // 3. Fallback for 'Month' placeholder
    if (valToSet === null && el.getAttribute("placeholder") === "Month") {
      const monthItem = clipboardData.find(x => removeSpace(x.key?.toLowerCase() || "").includes("monthof"));
      if (monthItem) {
        valToSet = monthItem.value;
      }
    }

    if (valToSet !== null) {
      setNativeValue(el, valToSet);
      if (el.tagName === 'SELECT') {
        const option = Array.from(el.options).find(opt => opt.value === valToSet || opt.text === valToSet);
        if (option) {
          el.value = option.value;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  });
}

export function addBusinessSearchButton() {
  let verificationBtn = document.querySelector('[data-testid="Run-a-Verification-sidebar-button"][href="/verification" i]');
  let businessSearchBtn = document.querySelector('[data-testid="Business-Search-sidebar-button"][href="/businesssearch" i]');
  if (verificationBtn && !businessSearchBtn) {
    businessSearchBtn = verificationBtn.cloneNode(true);
    const textEl = businessSearchBtn.querySelector('.platform-sidebar-menuitem-text');
    if (textEl) textEl.textContent = 'Business Search';
    businessSearchBtn.setAttribute('href', '/businesssearch');
    businessSearchBtn.setAttribute('data-testid', 'Business-Search-sidebar-button');
    businessSearchBtn.childNodes[0].setAttribute('class', "platform-sidebar-menuitem-wrapper")
    const parent = verificationBtn.parentNode;

    if (verificationBtn.nextSibling) {
      parent.insertBefore(businessSearchBtn, verificationBtn.nextSibling);
    } else {
      parent.appendChild(businessSearchBtn);
    }
  }

  if (businessSearchBtn && document.URL.includes("/businesssearch")) {
    businessSearchBtn.childNodes[0].style['background-color'] = 'rgb(0, 76, 69)'
  }
}

async function fetchDebugServerLocation() {
  return new Promise((resolve, _) => {
    chrome.storage.local.get("server_location", (result) => {
      if (chrome.runtime.lastError) {
        resolve(null);
      } else {
        resolve(result.server_location || "us");
      }
    });
  });
}

function setNativeValue(element, value) {
  if (element && Object.getPrototypeOf(element)) {
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(element),
      "value"
    )?.set?.call(element, value);
  }
}