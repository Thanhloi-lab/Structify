(() => {
  if (window.__extHooked || !document.location.href.includes("businesssearch")) return;
  window.__extHooked = true;

  const emit = (detail) => {
    try {
      document.dispatchEvent(new CustomEvent("EXT_API_CAPTURE", {
        detail,
        bubbles: true,
        composed: true
      }));
    } catch (_) {}
  };

  // ---- Hook fetch ----
  const _fetch = window.fetch;
  window.fetch = async (...args) => {
    const startedAt = Date.now();
    let res;
    try {
      res = await _fetch(...args);
    } catch (err) {
      emit({ kind: "fetch", phase: "error", args: sanitizeArgs(args), error: String(err) });
      throw err;
    }

    // Emit metadata trước
    const meta = {
      kind: "fetch",
      phase: "done",
      args: sanitizeArgs(args),
      url: res.url,
      status: res.status,
      ok: res.ok,
      headers: headersToObj(res.headers),
      durationMs: Date.now() - startedAt
    };
    emit(meta);

    // Thử đọc body (không phá flow)
    (async () => {
      try {
        const clone = res.clone();
        const ct = (clone.headers.get("content-type") || "").toLowerCase();
        let body;
        if (ct.includes("json")) body = await clone.json();
        else if (ct.startsWith("text/") || ct.includes("xml") || ct.includes("html")) body = await clone.text();
        else body = await clone.arrayBuffer().then(b => `[binary ${b.byteLength} bytes]`);
        emit({ ...meta, body });
      } catch (err) {
        // Opaque/CORS hoặc stream chỉ đọc 1 lần -> vẫn coi như thành công nhưng không có body
        emit({ ...meta, body: null, bodyError: String(err) });
      }
    })();

    return res;
  };

  // ---- Hook XHR ----
  const XO = XMLHttpRequest.prototype.open;
  const XS = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__ext = { method, url, startedAt: Date.now() };
    return XO.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    this.addEventListener("load", function () {
      try {
        const headers = parseHeaders(this.getAllResponseHeaders());
        const ct = (headers["content-type"] || "").toLowerCase();
        let parsed = null;
        try {
          if (ct.includes("json")) parsed = JSON.parse(this.responseText);
          else parsed = this.responseText;
        } catch (e) {}
        emit({
          kind: "xhr",
          phase: "done",
          method: this.__ext?.method,
          url: this.__ext?.url,
          status: this.status,
          headers,
          body: parsed,
          durationMs: Date.now() - (this.__ext?.startedAt || Date.now())
        });
      } catch (err) {
        emit({ kind: "xhr", phase: "error", error: String(err) });
      }
    });
    return XS.call(this, body);
  };

  // Helpers
  function headersToObj(h) {
    const o = {};
    try { h.forEach((v,k)=>o[k]=v); } catch {}
    return o;
  }
  function parseHeaders(raw) {
    const out = {};
    (raw || "").trim().split(/[\r\n]+/).forEach(line => {
      const i = line.indexOf(":");
      if (i > 0) out[line.slice(0,i).toLowerCase()] = line.slice(i+1).trim();
    });
    return out;
  }
  function sanitizeArgs(args) {
    try {
      const [input, init] = args;
      const url = typeof input === "string" ? input : (input && input.url);
      const method = init?.method || (input && input.method) || "GET";
      return { url, method };
    } catch { return null; }
  }

  console.log("[API Sniffer] hook installed in MAIN world");
})();
