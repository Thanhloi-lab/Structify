export const C_SHARP_TYPE = "csharp"
export const JSON_TYPE = "json"
export const XML_TYPE = "xml"
export const UNKNOWN_TYPE = "unknown"
export const XML_COLORS_ARRAY = [
  { key: "tag", color: "#569cd6", label: "Tag name" },
  { key: "attr", color: "#9cdcfe", label: "Attribute name" },
  { key: "val", color: "#ce9178", label: "Attribute value" },
  { key: "text", color: "#d4d4d4", label: "Text content" },
  { key: "brace", color: "#808080", label: "Braces / brackets" },
];
export const JSON_COLORS_ARRAY = [
  { key: "key", color: "#9cdcfe", label: "JSON key name" },
  { key: "str", color: "#ce9178", label: "String value" },
  { key: "num", color: "#b5cea8", label: "Number value" },
  { key: "bool", color: "#569cd6", label: "Boolean value" },
  { key: "nil", color: "#569cd6", label: "Null value" },
  { key: "brace", color: "#d4d4d4", label: "Braces / brackets" },
  { key: "text", color: "#d4d4d4", label: "General text" },
];

export const DEFAULT_SETTINGS = {
  beautifyCode: true,
  toCSharp: true,
  confluenceFormatPreElement: true,
  pasteToCP: true,
  fillData: true,
  truliooUtility: true,
  copyEvidence: true,
  copyAndCompareVariant: true,
  jsonColors: JSON_COLORS_ARRAY,
  xmlColors: XML_COLORS_ARRAY,
  pasteToCPUrls: []
};