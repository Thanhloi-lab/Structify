/* global chrome */
import { useEffect, useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  C_SHARP_TYPE,
  JSON_TYPE,
  XML_TYPE,
  XML_COLORS_ARRAY,
  JSON_COLORS_ARRAY,
} from "../constants/constants";
import {
  beautifyText,
  detectDataType,
  formatXml,
  jsonToCSharpClass,
  xmlToCSharpClass,
} from "../utils/scriptHelpers";
import JsonFoldPretty from "./JsonFoldPretty";
import XmlFoldPretty from "./XmlFoldPretty";
import toast from "react-hot-toast";
import { useSettings } from "../contexts/SettingsContext";

export default function CodePreviewBlock({
  code = "",
  convertToCSharp = false,
  lang,
  fontSize = 20,
  foldable = true,
}) {
  const [formatted, setFormatted] = useState(code);
  const { settings, ready, isLoading, error } = useSettings();
  const language = useMemo(
    () => lang ?? (convertToCSharp ? C_SHARP_TYPE : detectDataType(code)),
    [code, lang, convertToCSharp],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSelf();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    const beautifiedCode = beautifyText(code, language);
    if (convertToCSharp) {
      setFormatted(handleConvertToCSharpClass(beautifiedCode));
      return;
    }
    try {
      if (language === JSON_TYPE) {
        setFormatted(JSON.stringify(JSON.parse(beautifiedCode), null, 2));
      } else if (language === XML_TYPE) {
        setFormatted(formatXml(beautifiedCode));
      } else {
        setFormatted(beautifiedCode);
      }
    } catch {
      setFormatted(beautifiedCode);
    }
  }, [code, language, convertToCSharp]);

  const parsedJson = useMemo(() => {
    if (language !== JSON_TYPE || convertToCSharp) return null;
    try {
      return JSON.parse(formatted);
    } catch {
      return null;
    }
  }, [formatted, language, convertToCSharp]);

  const handleConvertToCSharpClass = (input) => {
    let data = "";
    let type = detectDataType(input);
    switch (type) {
      case JSON_TYPE:
        data = jsonToCSharpClass(input);
        break;
      case XML_TYPE:
        data = xmlToCSharpClass(input);
        break;
      default:
        break;
    }
    return data;
  };

  const closeSelf = () => {
    try {
      window.close();
    } catch (e) {
      console.error(e);
    }
    if (chrome?.tabs?.query && chrome?.tabs?.remove) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) chrome.tabs.remove(tabs[0].id);
        else if (chrome?.windows?.getCurrent && chrome?.windows?.remove) {
          chrome.windows.getCurrent(
            (win) => win && chrome.windows.remove(win.id),
          );
        }
      });
    } else if (chrome?.windows?.getCurrent && chrome?.windows?.remove) {
      chrome.windows.getCurrent((win) => win && chrome.windows.remove(win.id));
    }
  };

  const getColors = (key, defaultColors) => {
    const colors = settings?.[key];
    if (Array.isArray(colors) && colors.length > 0) {
      return colors;
    }

    return defaultColors;
  };

  const handleRenderData = () => {
    if (foldable && !convertToCSharp && language === JSON_TYPE && parsedJson) {
      return (
        <JsonFoldPretty
          data={parsedJson}
          openDepth={2}
          defaultExpandAll={true}
          fontSize={fontSize}
          colors={getColors("jsonColors", JSON_COLORS_ARRAY)}
        />
      );
    } else if (
      foldable &&
      !convertToCSharp &&
      language === XML_TYPE &&
      formatted
    ) {
      return (
        <XmlFoldPretty
          data={formatted}
          openDepth={2}
          defaultExpandAll={true}
          fontSize={fontSize}
          colors={getColors("xmlColors", XML_COLORS_ARRAY)}
        />
      );
    } else {
      return (
        <SyntaxHighlighter
          language={language}
          style={dracula}
          wrapLongLines
          customStyle={{
            margin: 0,
            background: "transparent",
            fontSize: `${fontSize}px`,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            overflowWrap: "break-word",
            display: "block",
          }}
          codeTagProps={
            language !== C_SHARP_TYPE
              ? {
                  style: {
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    overflowWrap: "anywhere",
                    display: "block",
                  },
                }
              : {}
          }
        >
          {formatted}
        </SyntaxHighlighter>
      );
    }
  };

  if (!ready) {
    return (
      <div style={{ padding: 16, color: "#999" }}>
        {isLoading ? "Loading settings..." : "Settings not loaded"}
      </div>
    );
  } else {
    return <div style={{ padding: "16px" }}>{handleRenderData()}</div>;
  }
}
