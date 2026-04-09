import { Box, Stack, TextField, Typography, Button } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

const hexLike = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function normalizeHex(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function expand3To6(h) {
  // h: "abc" -> "aabbcc"
  return h
    .split("")
    .map((c) => c + c)
    .join("");
}

function hexLikeToHex6(value) {
  if (!hexLike.test(value)) return null;
  const raw = value.replace("#", "");
  if (raw.length === 3) return `#${expand3To6(raw)}`;
  if (raw.length === 6) return `#${raw}`;
  if (raw.length === 8) return `#${raw.slice(0, 6)}`; // bỏ alpha cho input[color]
  return null;
}

function nameOrCssColorToHex6(value) {
  // Chuyển tên màu/CSS hợp lệ về #RRGGBB bằng canvas
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#000";
    ctx.fillStyle = value;
    // Trình duyệt chuẩn hóa thành dạng #rrggbb hoặc rgba(...)
    const out = ctx.fillStyle;
    if (typeof out === "string" && out.startsWith("#") && out.length === 7)
      return out;
    // Nếu là rgba(r,g,b,a)
    if (out.startsWith("rgb")) {
      const m = out.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (!m) return null;
      const [r, g, b] = m.slice(1, 4).map((n) => {
        const v = parseInt(n, 10);
        const h = v.toString(16).padStart(2, "0");
        return h;
      });
      return `#${r}${g}${b}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function isValidColor(value) {
  return hexLike.test(value) || CSS.supports("color", value);
}

function toPreviewColor(value) {
  // Dùng cho nền preview (nếu vẫn cần)
  const v = normalizeHex(value);
  if (!hexLike.test(value) && CSS.supports("color", value)) return value;
  return v;
}

function toColorInputValue(value) {
  // Trả về 1 giá trị #RRGGBB hợp lệ cho <input type="color">
  const hex6 = hexLikeToHex6(value);
  if (hex6) return hex6;
  if (CSS.supports("color", value)) {
    const c = nameOrCssColorToHex6(value);
    if (c) return c;
  }
  return "#000000";
}

function ColorInputRow({ label, value, onChange }) {
  const [local, setLocal] = useState(value);
  const valid = isValidColor(local);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const colorInputValue = useMemo(() => toColorInputValue(local), [local]);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{ width: "100%" }}
    >
      <Typography
        variant="body2"
        sx={{ minWidth: 88, color: "text.secondary" }}
      >
        {label}
      </Typography>

      <TextField
        size="small"
        fullWidth
        value={local}
        onChange={(e) => {
          const v = e.target.value;
          setLocal(v);
          if (isValidColor(v)) onChange(normalizeHex(v));
        }}
        placeholder="#RRGGBB hoặc tên màu"
        error={!!local && !valid}
        inputProps={{ spellCheck: "false" }}
      />

      {/* Color picker */}
      <Box sx={{ position: "relative", width: 40, height: 28 }}>
        <input
          aria-label={`${label} color picker`}
          type="color"
          value={colorInputValue}
          onChange={(e) => {
            const picked = e.target.value; // luôn là #RRGGBB
            setLocal(picked);
            onChange(picked);
          }}
          title={valid ? toPreviewColor(local) : "invalid"}
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            border: "none",
            borderRadius: 8,
            width: "100%",
            height: "100%",
            padding: 0,
            background: "transparent",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
            cursor: "pointer",
          }}
        />
      </Box>
    </Stack>
  );
}

export default function ColorSelection({
  initialColors = [],
  onChange,
  handleSubmit,
  disabled,
}) {
  const [colors, setColors] = useState(initialColors);

  const update = (idx, newColor) => {
    setColors((prev) => {
      const next = prev.map((item, i) =>
        i === idx ? { ...item, color: newColor } : item
      );
      onChange && onChange(next);
      return next;
    });
  };

  return (
    <Stack
      spacing={1.25}
      sx={{ mt: 1, marginBottom: "16px", alignItems: "center" }}
    >
      {Array.isArray(colors) ? (
        colors?.map((item, idx) => (
          <ColorInputRow
            key={item.key}
            label={item.label}
            value={item.color}
            onChange={(nv) => update(idx, nv)}
          />
        ))
      ) : (
        <></>
      )}

      <Button
        variant="contained"
        onClick={handleSubmit}
        sx={{ maxWidth: "50%" }}
        disabled={disabled}
      >
        Submit
      </Button>
    </Stack>
  );
}
