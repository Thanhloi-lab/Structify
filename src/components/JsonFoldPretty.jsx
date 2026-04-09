import { useState, useCallback, useMemo } from "react";
import styled from "styled-components";

/* ===== Styled Components ===== */
const Wrapper = styled.div`
  position: relative;
  font-family: "Cascadia Code", "Fira Code", "JetBrains Mono",
    ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  line-height: 1.6;
  background: #1e1e1e;
  color: #d4d4d4;
  overflow-x: auto;
`;

const LineRow = styled.div`
  display: flex;
  min-height: 1.6em;
  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`;

const Gutter = styled.span`
  display: inline-block;
  min-width: 3.5em;
  padding-right: 1em;
  text-align: right;
  color: #858585;
  user-select: none;
  flex-shrink: 0;
`;

const ContentArea = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

const IndentGuide = styled.span`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.1);
  pointer-events: none;
`;

const Caret = styled.span`
  display: inline-block;
  width: 1.25em;
  text-align: center;
  cursor: pointer;
  user-select: none;
  color: ${(p) => p.$color || "#d4d4d4"};
  flex-shrink: 0;
  &:hover {
    color: #fff;
  }
`;

const CaretPlaceholder = styled.span`
  display: inline-block;
  width: 1.25em;
  flex-shrink: 0;
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 4px 8px;
  background: #252526;
  border-bottom: 1px solid #3c3c3c;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const ToolBtn = styled.button`
  background: transparent;
  border: 1px solid #555;
  color: #ccc;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  &:hover {
    background: #3c3c3c;
    color: #fff;
  }
`;

/* ===== Defaults ===== */
const JSON_COLORS = {
  key: "#9cdcfe",
  str: "#ce9178",
  num: "#b5cea8",
  bool: "#569cd6",
  nil: "#569cd6",
  brace: "#d4d4d4",
  text: "#d4d4d4",
};

const INDENT = 16;

/* ===== Helpers ===== */
function JsonVal({ v, c }) {
  if (v === null) return <span style={{ color: c.nil }}>null</span>;
  const t = typeof v;
  if (t === "string") return <span style={{ color: c.str }}>"{v}"</span>;
  if (t === "number") return <span style={{ color: c.num }}>{String(v)}</span>;
  if (t === "boolean")
    return <span style={{ color: c.bool }}>{String(v)}</span>;
  return <span>{String(v)}</span>;
}

function IndentGuides({ depth }) {
  const guides = [];
  for (let i = 1; i <= depth; i++) {
    guides.push(<IndentGuide key={i} style={{ left: i * INDENT - 8 }} />);
  }
  return guides;
}

/* ===== Flatten JSON into visible lines ===== */
function flattenJson(value, name, depth, isLast, openSet, path) {
  const isArray = Array.isArray(value);
  const isObject = value && typeof value === "object" && !isArray;

  // Primitive
  if (!isArray && !isObject) {
    return [{ type: "primitive", depth, name, value, isLast, path }];
  }

  const entries = isArray
    ? value.map((v, i) => [i, v])
    : Object.entries(value);
  const openSym = isArray ? "[" : "{";
  const closeSym = isArray ? "]" : "}";
  const count = entries.length;
  const isOpen = openSet.has(path);

  if (!isOpen) {
    // Collapsed: single line
    return [
      {
        type: "collapsed",
        depth,
        name,
        openSym,
        closeSym,
        count,
        isLast,
        path,
        isArray,
      },
    ];
  }

  // Expanded: header + children + closing
  const lines = [
    {
      type: "open",
      depth,
      name,
      openSym,
      isLast,
      path,
    },
  ];

  entries.forEach(([k, v], idx) => {
    const childPath = `${path}.${k}`;
    const childName = isArray ? undefined : String(k);
    const childIsLast = idx === count - 1;
    lines.push(...flattenJson(v, childName, depth + 1, childIsLast, openSet, childPath));
  });

  lines.push({
    type: "close",
    depth,
    closeSym,
    isLast,
    path,
  });

  return lines;
}

/* ===== Collect all collapsible paths ===== */
function collectAllPaths(value, path) {
  const isArray = Array.isArray(value);
  const isObject = value && typeof value === "object" && !isArray;
  if (!isArray && !isObject) return [];

  const paths = [path];
  const entries = isArray
    ? value.map((v, i) => [i, v])
    : Object.entries(value);
  entries.forEach(([k, v]) => {
    paths.push(...collectAllPaths(v, `${path}.${k}`));
  });
  return paths;
}

/* ===== Main Export ===== */
export default function JsonFoldPretty({
  data,
  openDepth = 2,
  fontSize = 14,
  defaultExpandAll = false,
  colors,
}) {
  // Compute all collapsible paths once
  const allPaths = useMemo(() => collectAllPaths(data, "$"), [data]);

  // Compute initial open set based on openDepth
  const initialOpenSet = useMemo(() => {
    if (defaultExpandAll) return new Set(allPaths);
    // Open paths up to openDepth
    const set = new Set();
    function walk(value, path, depth) {
      const isArray = Array.isArray(value);
      const isObject = value && typeof value === "object" && !isArray;
      if (!isArray && !isObject) return;
      if (depth < openDepth) set.add(path);
      const entries = isArray
        ? value.map((v, i) => [i, v])
        : Object.entries(value);
      entries.forEach(([k, v]) => walk(v, `${path}.${k}`, depth + 1));
    }
    walk(data, "$", 0);
    return set;
  }, [data, openDepth, defaultExpandAll, allPaths]);

  const [openSet, setOpenSet] = useState(initialOpenSet);

  let colorsToRender = JSON_COLORS;
  if (Array.isArray(colors) && colors.length > 0) {
    colorsToRender = colors.reduce((acc, { key, color }) => {
      acc[key] = color;
      return acc;
    }, {});
  }

  const toggle = useCallback((path) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setOpenSet(new Set(allPaths));
  }, [allPaths]);

  const handleCollapseAll = useCallback(() => {
    setOpenSet(new Set());
  }, []);

  // Flatten to visible lines (recomputes on every render, driven by openSet)
  const lines = flattenJson(data, undefined, 0, true, openSet, "$");
  const c = colorsToRender;

  return (
    <Wrapper style={{ fontSize }}>
      <Toolbar>
        <ToolBtn onClick={handleExpandAll}>Expand All</ToolBtn>
        <ToolBtn onClick={handleCollapseAll}>Collapse All</ToolBtn>
      </Toolbar>
      <div style={{ padding: "4px 0" }}>
        {lines.map((line, idx) => {
          const lineNum = idx + 1;

          if (line.type === "primitive") {
            return (
              <LineRow key={idx}>
                <Gutter>{lineNum}</Gutter>
                <ContentArea style={{ paddingLeft: line.depth * INDENT }}>
                  <IndentGuides depth={line.depth} />
                  <CaretPlaceholder />
                  {line.name !== undefined && (
                    <>
                      <span style={{ color: c.key }}>"{line.name}"</span>
                      <span style={{ color: c.brace, fontWeight: 700 }}>: </span>
                    </>
                  )}
                  <JsonVal v={line.value} c={c} />
                  {!line.isLast && (
                    <span style={{ color: c.brace, fontWeight: 700 }}>,</span>
                  )}
                </ContentArea>
              </LineRow>
            );
          }

          if (line.type === "collapsed") {
            return (
              <LineRow key={idx}>
                <Gutter>{lineNum}</Gutter>
                <ContentArea style={{ paddingLeft: line.depth * INDENT }}>
                  <IndentGuides depth={line.depth} />
                  <Caret $color={c.brace} onClick={() => toggle(line.path)}>
                    ▸
                  </Caret>
                  {line.name !== undefined && (
                    <>
                      <span style={{ color: c.key }}>"{line.name}"</span>
                      <span style={{ color: c.brace, fontWeight: 700 }}>: </span>
                    </>
                  )}
                  <span style={{ color: c.brace }}>{line.openSym} </span>
                  <span style={{ opacity: 0.5, color: c.text, fontSize: "0.85em" }}>
                    {line.count} {line.count === 1 ? "item" : "items"}
                  </span>
                  <span style={{ color: c.brace }}> {line.closeSym}</span>
                  {!line.isLast && (
                    <span style={{ color: c.brace, fontWeight: 700 }}>,</span>
                  )}
                </ContentArea>
              </LineRow>
            );
          }

          if (line.type === "open") {
            return (
              <LineRow key={idx}>
                <Gutter>{lineNum}</Gutter>
                <ContentArea style={{ paddingLeft: line.depth * INDENT }}>
                  <IndentGuides depth={line.depth} />
                  <Caret $color={c.brace} onClick={() => toggle(line.path)}>
                    ▾
                  </Caret>
                  {line.name !== undefined && (
                    <>
                      <span style={{ color: c.key }}>"{line.name}"</span>
                      <span style={{ color: c.brace, fontWeight: 700 }}>: </span>
                    </>
                  )}
                  <span style={{ color: c.brace }}>{line.openSym}</span>
                </ContentArea>
              </LineRow>
            );
          }

          if (line.type === "close") {
            return (
              <LineRow key={idx}>
                <Gutter>{lineNum}</Gutter>
                <ContentArea style={{ paddingLeft: line.depth * INDENT }}>
                  <IndentGuides depth={line.depth} />
                  <CaretPlaceholder />
                  <span style={{ color: c.brace }}>{line.closeSym}</span>
                  {!line.isLast && (
                    <span style={{ color: c.brace, fontWeight: 700 }}>,</span>
                  )}
                </ContentArea>
              </LineRow>
            );
          }

          return null;
        })}
      </div>
    </Wrapper>
  );
}
