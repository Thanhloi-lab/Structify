import { showToast } from "./toast.js";

export function compareVariants(indexToCompare = -1, adminVariant = []) {
  if (!document.location.href.includes("trulioo.atlassian.net")) {
    showToast("Page not supported", "error");
    return;
  }

  // ================= CONFIG =================
  const shouldLogWhenFail = false;
  const expectedHeaders = ['fieldname', 'required input', 'optional input', 'output', 'appended'];

  if (adminVariant.length === 0) {
    showToast("Variant was not found in clipboard");
    return;
  }

  // =============== HELPERS ===============
  const yesVals = new Set(['yes', 'true', 'y', '1', '✓', '✔']);
  const toBool = (text) => yesVals.has(String(text || '').trim().toLowerCase());
  const normalizeRow = (r) => ({
    FieldName: (r.FieldName || '').trim(),
    IsRequire: !!r.IsRequire,
    IsOptional: !!r.IsOptional,
    IsOutput: !!r.IsOutput,
    IsAppend: !!r.IsAppend,
  });
  const toKey = (n) => String(n || '').trim().toLowerCase();

  // ensure style for ghost/extra rows (once)
  (function ensureCmpStyle() {
    if (document.getElementById('__cmp_style__')) return;
    const st = document.createElement('style');
    st.id = '__cmp_style__';
    st.textContent = `
      tr.__cmp-missing-row td {
        background: mistyrose !important;
        border-top: 1px dashed #95c1f9;
        border-bottom: 1px dashed #95c1f9;
        opacity: 0.95;
      }
      tr.__cmp-extra-row td {
        background: #95c1f9 !important;
      }
    `;
    document.head.appendChild(st);
  })();

  function parseTable(table) {
    const headerRow = table.querySelector('thead tr') || table.querySelector('tbody tr');
    if (!headerRow) return null;
    const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent.trim().toLowerCase());
    const ok = expectedHeaders.every(h => headers.includes(h));
    if (!ok) return null;

    const hasThead = !!table.querySelector('thead');
    const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
    const rows = hasThead ? bodyRows : bodyRows.slice(1);

    const data = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      const getText = (i) => (cells[i]?.textContent ?? '').trim();
      const getTextLower = (i) => getText(i).toLowerCase();
      const startIndex = "fieldname".includes(getText(0)?.toLowerCase().replace(' ', '')) ? 0 : 1;
      return normalizeRow({
        FieldName: getText(startIndex),
        IsRequire: toBool(getTextLower(startIndex + 1)),
        IsOptional: toBool(getTextLower(startIndex + 2)),
        IsOutput: toBool(getTextLower(startIndex + 3)),
        IsAppend: toBool(getTextLower(startIndex + 4)),
      });
    }).filter(x => x.FieldName);

    return data;
  }

  function toMap(arr) {
    const m = new Map();
    for (const x of arr) m.set(toKey(x.FieldName), x);
    return m;
  }

  function compareArrays(actualArr, expectedArr) {
    const actual = toMap(actualArr);
    const expected = toMap(expectedArr);
    const unionKeys = new Set([...actual.keys(), ...expected.keys()]);

    const missing = []; // in expected, not in actual
    const extra = [];   // in actual, not in expected
    const diffs = [];

    for (const k of unionKeys) {
      const a = actual.get(k);
      const e = expected.get(k);
      if (!a && e) { missing.push(e.FieldName); continue; }
      if (a && !e) { extra.push(a.FieldName); continue; }

      const fields = ['IsRequire', 'IsOptional', 'IsOutput', 'IsAppend'];
      const diffFields = fields.filter(f => a[f] !== e[f]);
      if (diffFields.length) {
        diffs.push({ FieldName: e.FieldName, Expected: e, Actual: a, DiffFlags: diffFields });
      }
    }

    const pass = missing.length === 0 && extra.length === 0 && diffs.length === 0;
    return { pass, missing, extra, diffs };
  }

  function highlight(el, color) {
    el.style.outline = `2px solid ${color}`;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function clearHighlight(els) {
    els.forEach(el => {
      // outline
      el.style.outline = '';
      // cell diff bg
      el.querySelectorAll('td').forEach(td => td.style.backgroundColor = '');
      // remove extra-row style
      el.querySelectorAll('tr.__cmp-extra-row').forEach(tr => tr.classList.remove('__cmp-extra-row'));
      // remove ghost rows
      el.querySelectorAll('tr.__cmp-missing-row').forEach(tr => tr.remove());
    });
  }

  function highlightDiffCells(table, diffs) {
    table.querySelectorAll('td').forEach(td => td.style.backgroundColor = '');
    if (!diffs || !diffs.length) return;

    const fieldMap = { IsRequire: 1, IsOptional: 2, IsOutput: 3, IsAppend: 4 };

    diffs.forEach(d => {
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (!cells.length) return;
        const fieldName = cells[0].textContent.trim();
        if (fieldName === d.FieldName) {
          d.DiffFlags.forEach(flag => {
            const colIdx = fieldMap[flag];
            if (cells[colIdx]) cells[colIdx].style.backgroundColor = '#f5ff3a';
          });
        }
      });
    });
  }

  function findDataRows(table) {
    const hasThead = !!table.querySelector('thead');
    const trs = Array.from(table.querySelectorAll('tbody tr'));
    return hasThead ? trs : trs.slice(1);
  }

  function markExtraRows(table, extraNames) {
    if (!extraNames?.length) return;
    const rows = findDataRows(table);
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const name = (cells[0]?.textContent || '').trim();
      if (extraNames.includes(name)) row.classList.add('__cmp-extra-row');
    });
  }

  function injectMissingRows(table, missingNames) {
    if (!missingNames?.length) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    missingNames.forEach(name => {
      const tr = document.createElement('tr');
      tr.className = '__cmp-missing-row';
      tr.innerHTML = `
        <td>—</td>
        <td>${name}</td>
        <td>MISSING</td>
        <td>MISSING</td>
        <td>MISSING</td>
        <td>MISSING</td>
        <td></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // =============== MAIN: scan & compare ===============
  let columnLayouts = document.querySelectorAll('.columnLayout h2');
  const tables = Array.from(Object.keys(columnLayouts)
    .map((key) => columnLayouts[key])
    .filter(x => x.innerHTML.toLowerCase().includes("Variant".toLowerCase()))[0].parentNode.querySelectorAll('table'))
    .filter(x => x.innerText?.toLowerCase().replace(' ', '').includes('fieldname') && x.innerText?.toLowerCase().replace(' ', '').includes('requiredinput'))

  console.log(`✅ Found ${tables.length} matching tables`);
  if (tables.length === 0) return;

  const idxs = (indexToCompare >= 0 && indexToCompare < tables.length)
    ? [indexToCompare]
    : Array.from(tables.keys());

  const expectedSorted = [...adminVariant].map(normalizeRow)
    .sort((a, b) => a.FieldName.localeCompare(b.FieldName));

  const results = []; // { index, table, pass, missing, extra, diffs }

  idxs.forEach((idx) => {
    const table = tables[idx];
    const parsed = parseTable(table) || [];
    const actualSorted = [...parsed].sort((a, b) => a.FieldName.localeCompare(b.FieldName));
    const result = compareArrays(actualSorted, expectedSorted);
    results.push({ index: idx, table, ...result });

    console.log(result)

    console.group(`\n📦 Table #${idx} — parsed rows: ${actualSorted.length}`);
    if (result.pass) {
      console.log('%cPASS', 'color: #0a0; font-weight: bold', `— Table #${idx} matches adminVariant`);
      console.log('👉 Element:', table);
    } else if (shouldLogWhenFail) {
      console.log('%cFAIL', 'color: #b00; font-weight: bold', `— Table #${idx} differs from adminVariant`);
      console.log('👉 Element:', table);
      if (result.missing.length) {
        console.log('🔻 Missing:');
        console.table(result.missing.map(x => ({ FieldName: x })));
      }
      if (result.extra.length) {
        console.log('🔺 Extra:');
        console.table(result.extra.map(x => ({ FieldName: x })));
      }
      if (result.diffs.length) {
        console.log('⚠️ Flag differences:');
        console.table(result.diffs.map(d => ({
          FieldName: d.FieldName,
          DiffFlags: d.DiffFlags.join(', '),
        })));
      }
    }
    console.groupEnd();
  });

  // =============== FLOATING PANEL (Shadow DOM) ===============
  const OLD_ID = '__cmp_panel_host__';
  document.getElementById(OLD_ID)?.remove();

  const host = document.createElement('div');
  host.id = OLD_ID;
  host.style.position = 'fixed';
  host.style.bottom = '16px';
  host.style.right = '16px';
  host.style.zIndex = '2147483647';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const wrap = document.createElement('div');
  const style = document.createElement('style');
  style.textContent = `
    .panel {
      font-family: system-ui, Arial, sans-serif;
      background: rgba(30,30,36,0.95);
      color: #fff;
      border-radius: 10px;
      padding: 10px;
      box-shadow: 0 6px 20px rgba(0,0,0,.35);
      min-width: 220px;
      backdrop-filter: saturate(1.2) blur(4px);
    }
    .row { display:flex; gap:6px; flex-wrap:wrap; }
    button {
      cursor:pointer;border:0;border-radius:8px;padding:6px 10px;
      background:#2e7d32;color:#fff;font-size:12px;
    }
    button.fail { background:#c62828; }
    button.neutral { background:#546e7a; }
    button:disabled { opacity:.5; cursor:not-allowed; }
    .title { font-size:12px; opacity:.9; margin-bottom:6px }
    .stats { font-size:11px; opacity:.8; margin:6px 0 8px }
  `;
  wrap.innerHTML = `
    <div class="panel">
      <div class="title">Compare Tables</div>
      <div class="stats">PASS: <span id="passCount"></span> • FAIL: <span id="failCount"></span></div>
      <div class="row" style="margin-bottom:6px">
        <button id="btnClose" class="neutral">Close Panel</button>
        <button id="btnClear" class="neutral">Clear</button>
      </div>
      <div class="row" style="margin-bottom:6px">
        <button id="btnPreviousPass">Prev PASS</button>
        <button id="btnNextPass">Next PASS</button>
      </div>
      <div class="row">
        <button id="btnPreviousFail" class="fail">Prev FAIL</button>
        <button id="btnNextFail" class="fail">Next FAIL</button>
      </div>
    </div>
  `;
  shadow.appendChild(style);
  shadow.appendChild(wrap);

  // state
  const passList = results.filter(r => r.pass);
  const failList = results.filter(r => !r.pass);
  let passPtr = 0;
  let failPtr = 0;

  shadow.getElementById('passCount').textContent = String(passList.length);
  shadow.getElementById('failCount').textContent = String(failList.length);

  function gotoItem(item, color) {
    if (!item) return;
    clearHighlight(results.map(r => r.table));
    highlight(item.table, color);
  }

  // wire buttons
  shadow.getElementById('btnClose').onclick = () => {
    clearHighlight(results.map(r => r.table));
    host.remove();
  };
  shadow.getElementById('btnClear').onclick = () => clearHighlight(results.map(r => r.table));

  // PASS
  shadow.getElementById('btnPreviousPass').onclick = () => {
    if (!passList.length) return;
    passPtr = (passPtr - 1 + passList.length) % passList.length;
    const item = passList[passPtr];
    clearHighlight(results.map(r => r.table));
    highlight(item.table, 'lime');
  };
  shadow.getElementById('btnNextPass').onclick = () => {
    if (!passList.length) return;
    gotoItem(passList[passPtr % passList.length], 'lime');
    passPtr++;
  };

  // FAIL (kèm diff cells + missing/extra)
  shadow.getElementById('btnPreviousFail').onclick = () => {
    if (!failList.length) return;
    failPtr = (failPtr - 1 + failList.length) % failList.length;
    const item = failList[failPtr];
    clearHighlight(results.map(r => r.table));
    highlight(item.table, 'red');
    highlightDiffCells(item.table, item.diffs);
    markExtraRows(item.table, item.extra);
    injectMissingRows(item.table, item.missing);
  };
  shadow.getElementById('btnNextFail').onclick = () => {
    if (!failList.length) return;
    const item = failList[failPtr % failList.length];
    failPtr++;
    clearHighlight(results.map(r => r.table));
    highlight(item.table, 'red');
    highlightDiffCells(item.table, item.diffs);
    markExtraRows(item.table, item.extra);
    injectMissingRows(item.table, item.missing);
  };

  // expose tiện ích
  window.__cmpTables = results;
  window.__cmpGoto = (i) => {
    const item = results.find(r => r.index === i);
    if (!item) return;
    clearHighlight(results.map(r => r.table));
    if (item.pass) {
      highlight(item.table, 'lime');
    } else {
      highlight(item.table, 'red');
      highlightDiffCells(item.table, item.diffs);
      markExtraRows(item.table, item.extra);
      injectMissingRows(item.table, item.missing);
    }
  };
  window.__cmpClear = () => clearHighlight(results.map(r => r.table));

  console.log('%cℹ️ Panel ready (Close Panel = remove UI)', 'color:#03a9f4');
}

export function getAdminPortalVariant() {
  try {
    if (!document.location.href.includes("/DatasourceGroup/ConfigureFieldsIndex?datasourceGroupCountryID=")) {
      showToast("Page not supported", "error");
      return null;
    }

    var variant = Array.from(document.getElementsByClassName("list-table")[0].querySelectorAll('tr'))
      .filter(row => {
        const checkboxes = row.querySelectorAll('input[type="checkbox"]');
        return Array.from(checkboxes).some(cb => cb.checked);
      })
      .map(row => {
        const tds = Array.from(row.querySelectorAll('td')).filter((_, i) => i !== 1);
        return tds.map(td => {
          const text = td.textContent.trim();
          if (text) return text;
          const checkbox = td.querySelector('input[type="checkbox"]');
          return checkbox ? checkbox.checked : '';
        });
      })
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(x => {
        return {
          FieldName: x[0] || '',
          IsRequire: x[1],
          IsOptional: x[2],
          IsOutput: x[3],
          IsAppend: x[4],
        };
      })

    showToast("Copied");
    return variant;
  }
  catch (e) {
    showToast("Variant not found in this page", "warning");
    return null;
  }
}

export function isValidVariantArray(arr) {
  if (!Array.isArray(arr)) return false;

  return arr.every(obj =>
    obj &&
    typeof obj === "object" &&
    "FieldName" in obj &&
    "IsRequire" in obj &&
    "IsOptional" in obj &&
    "IsOutput" in obj &&
    "IsAppend" in obj
  );
}