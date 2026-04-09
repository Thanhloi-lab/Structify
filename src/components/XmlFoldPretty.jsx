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
const XML_COLORS = {
  tag: "#569cd6",
  attr: "#9cdcfe",
  val: "#ce9178",
  text: "#d4d4d4",
  brace: "#808080",
};

const INDENT = 16;

/* ===== Helpers ===== */
function IndentGuides({ depth }) {
  const guides = [];
  for (let i = 1; i <= depth; i++) {
    guides.push(<IndentGuide key={i} style={{ left: i * INDENT - 8 }} />);
  }
  return guides;
}

function attrsToInline(node, c) {
  const atts = Array.from(node.attributes || []);
  if (!atts.length) return null;
  return atts.map((a) => (
    <span key={a.name}>
      {" "}
      <span style={{ color: c.attr }}>{a.name}</span>=
      <span style={{ color: c.val }}>"{a.value}"</span>
    </span>
  ));
}

function hasRenderableChildren(node) {
  return Array.from(node.childNodes || []).some(
    (ch) =>
      ch.nodeType === 1 ||
      (ch.nodeType === 3 && ch.textContent.trim()) ||
      (ch.nodeType === 8 && ch.textContent.trim())
  );
}

function countElementChildren(node) {
  return Array.from(node.childNodes || []).filter(
    (ch) =>
      ch.nodeType === 1 ||
      (ch.nodeType === 3 && ch.textContent.trim())
  ).length;
}

/* ===== Flatten XML DOM into visible lines ===== */
function flattenXml(node, depth, isLast, openSet, path) {
  // Text node
  if (node.nodeType === 3) {
    const text = node.textContent.replace(/\s+/g, " ").trim();
    if (!text) return [];
    return [{ type: "text", depth, text, isLast, path }];
  }

  // Comment node
  if (node.nodeType === 8) {
    const text = node.textContent;
    return [{ type: "comment", depth, text, isLast, path }];
  }

  // Only element nodes
  if (node.nodeType !== 1) return [];

  const name = node.nodeName;
  const hasKids = hasRenderableChildren(node);
  const children = Array.from(node.childNodes || []);

  // Self-closing
  if (!hasKids) {
    return [{ type: "selfclose", depth, name, node, isLast, path }];
  }

  const isOpen = openSet.has(path);
  const childCount = countElementChildren(node);

  // Collapsed
  if (!isOpen) {
    return [
      { type: "collapsed", depth, name, node, childCount, isLast, path },
    ];
  }

  // Expanded: header + children + closing
  const lines = [{ type: "open", depth, name, node, isLast, path }];

  children.forEach((ch, idx) => {
    const childPath = `${path}/${ch.nodeName}[${idx}]`;
    lines.push(
      ...flattenXml(ch, depth + 1, idx === children.length - 1, openSet, childPath)
    );
  });

  lines.push({ type: "close", depth, name, isLast, path });

  return lines;
}

/* ===== Collect all collapsible paths in XML DOM ===== */
function collectAllXmlPaths(node, path) {
  if (node.nodeType !== 1) return [];
  if (!hasRenderableChildren(node)) return [];

  const paths = [path];
  const children = Array.from(node.childNodes || []);
  children.forEach((ch, idx) => {
    const childPath = `${path}/${ch.nodeName}[${idx}]`;
    paths.push(...collectAllXmlPaths(ch, childPath));
  });
  return paths;
}

/* ===== Main Export ===== */
export default function XmlFoldPretty({
  data,
  openDepth = 2,
  fontSize = 14,
  defaultExpandAll = false,
  colors,
}) {
  const root = useMemo(() => {
    try {
      const doc = new DOMParser().parseFromString(data, "application/xml");
      if (doc.querySelector("parsererror")) return null;
      return doc.documentElement;
    } catch {
      return null;
    }
  }, [data]);

  const allPaths = useMemo(() => {
    if (!root) return [];
    return collectAllXmlPaths(root, "$");
  }, [root]);

  const initialOpenSet = useMemo(() => {
    if (defaultExpandAll) return new Set(allPaths);
    const set = new Set();
    function walk(node, path, depth) {
      if (node.nodeType !== 1) return;
      if (!hasRenderableChildren(node)) return;
      if (depth < openDepth) set.add(path);
      Array.from(node.childNodes || []).forEach((ch, idx) => {
        walk(ch, `${path}/${ch.nodeName}[${idx}]`, depth + 1);
      });
    }
    if (root) walk(root, "$", 0);
    return set;
  }, [root, openDepth, defaultExpandAll, allPaths]);

  const [openSet, setOpenSet] = useState(initialOpenSet);

  let colorsToRender = XML_COLORS;
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

  if (!root) {
    return <div style={{ color: "#ff5555" }}>Invalid XML</div>;
  }

  const lines = flattenXml(root, 0, true, openSet, "$");
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
          const attrInline =
            line.node ? attrsToInline(line.node, c) : null;

          if (line.type === "text") {
            return (
              <LineRow key={idx}>
                <Gutter>{lineNum}</Gutter>
                <ContentArea style={{ paddingLeft: line.depth * INDENT }}>
                  <IndentGuides depth={line.depth} />
                  <CaretPlaceholder />
                  <span style={{ color: c.text }}>{line.text}</span>
                </ContentArea>
              </LineRow>
            );
          }

          if (line.type === "comment") {
            return (
              <LineRow key={idx}>
                <Gutter>{lineNum}</Gutter>
                <ContentArea style={{ paddingLeft: line.depth * INDENT }}>
                  <IndentGuides depth={line.depth} />
                  <CaretPlaceholder />
                  <span style={{ color: c.brace }}>
                    {"<!--"}
                    <span style={{ color: c.text }}> {line.text} </span>
                    {"-->"}
                  </span>
                </ContentArea>
              </LineRow>
            );
          }

          if (line.type === "selfclose") {
            return (
              <LineRow key={idx}>
                <Gutter>{lineNum}</Gutter>
                <ContentArea style={{ paddingLeft: line.depth * INDENT }}>
                  <IndentGuides depth={line.depth} />
                  <CaretPlaceholder />
                  <span style={{ color: c.brace }}>&lt;</span>
                  <span style={{ color: c.tag }}>{line.name}</span>
                  {attrInline}
                  <span style={{ color: c.brace }}>/&gt;</span>
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
                  <span style={{ color: c.brace }}>&lt;</span>
                  <span style={{ color: c.tag }}>{line.name}</span>
                  {attrInline}
                  <span style={{ color: c.brace }}>&gt; </span>
                  <span style={{ opacity: 0.5, color: c.text, fontSize: "0.85em" }}>
                    {line.childCount} {line.childCount === 1 ? "child" : "children"}
                  </span>
                  <span style={{ color: c.brace }}> &lt;/{line.name}&gt;</span>
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
                  <span style={{ color: c.brace }}>&lt;</span>
                  <span style={{ color: c.tag }}>{line.name}</span>
                  {attrInline}
                  <span style={{ color: c.brace }}>&gt;</span>
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
                  <span style={{ color: c.brace }}>&lt;/</span>
                  <span style={{ color: c.tag }}>{line.name}</span>
                  <span style={{ color: c.brace }}>&gt;</span>
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
