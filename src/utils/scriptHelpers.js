import { JSON_TYPE, XML_TYPE, UNKNOWN_TYPE } from '../constants/constants';
import vkbeautify from 'vkbeautify';
import toast from "react-hot-toast";

export function showCopyPopup(code) {
  // Có thể là navigator.clipboard + toast
}
export function removeTags(str, emptyIfNull) {
  if ((str === null) || (str === ''))
    return false;

  let value = emptyOrWhiteSpaceToNull(str?.replace(/(<([^>]+)>)/ig, '').replace('&nbsp;', ''));
  return value === null && emptyIfNull ? 'string.Empty' : value;
}

export function emptyOrWhiteSpaceToNull(str) {
  return isNullOrWhitespace(str) ? null : str.trim()
}

export function isNullOrWhitespace(str) {
  return !str || str.trim().length === 0;
}

export function removeSpace(str) {
  return str?.replaceAll(' ', '');
}

export function getStringWithDefaultEmpty(str) {
  return str = str ? `"${str}"` : "string.Empty"
}

export function formatString(str) {
  return str === null ? null : `"${str}"`
}

export function compareString(str, str1) {
  return str?.toLowerCase() === str1?.toLowerCase();
}

export function detectDataType(str) {
  const trimmed = str.trim();

  if (trimmed) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object') return JSON_TYPE;
    } catch (_) { }

    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(trimmed, 'application/xml');
      const errorNodes = doc.getElementsByTagName('parsererror');

      if (errorNodes.length > 0) {
        for (let i = 0; i < errorNodes.length; i++) {
          const errorElement = errorNodes[i];
          const errorMessage = errorElement.innerHTML || 'Unknown XML parsing error';
          const match = errorMessage.match(/<div[^>]*>([^<]+)<\/div>/i);
          const cleanMessage = match ? match[1].trim() : 'Unknown XML parsing error';
          toast.error(`XML Parse Error: ${cleanMessage}`);
        }
      } else {
        return XML_TYPE;
      }
    }
  }

  return UNKNOWN_TYPE;
}

export function beautifyText(text, type) {
  try {
    if (type === JSON_TYPE) {
      return JSON.stringify(JSON.parse(text), null, 2);
    }

    if (type === XML_TYPE) {
      return vkbeautify.xml(text);
    }
  } catch (err) {
    return text;
  }

  return text;
}

function toPascalCase(str) {
  const cleaned = str
    .replace(/[_\- ]+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  // Nếu bắt đầu bằng số → thêm prefix
  if (/^\d/.test(cleaned)) {
    return 'Item' + cleaned;
  }
  return cleaned || 'Property';
}

export function jsonToCSharpClass(jsonString, className = 'Root', options = { addJsonProperty: false, addIgnoreNull: false }) {
  let obj;
  try {
    obj = JSON.parse(jsonString);
  } catch (e) {
    toast.error(`Invalid JSON`);
    return;
  }

  const classes = [];
  const usingDirectives = new Set();

  function getType(value, keyName) {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'double';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) {
      const inner = value[0];
      const innerType = inner ? getType(inner, keyName) : 'object';
      return `${innerType}[]`;
    }
    if (typeof value === 'object' && value !== null) {
      const nestedClassName = toPascalCase(keyName);
      buildClass(nestedClassName, value);
      return nestedClassName;
    }
    return 'string';
  }

  function buildClass(className, object) {
    const lines = Object.entries(object).map(([key, val]) => {
      const propType = getType(val, key);
      const propName = toPascalCase(key);

      const attrs = [];

      if (options.addJsonProperty) {
        usingDirectives.add('using System.Text.Json.Serialization;');
        attrs.push(`[JsonPropertyName("${key}")]`);
      }

      if (options.addIgnoreNull && (val === null || typeof val === 'object')) {
        usingDirectives.add('using System.Text.Json.Serialization;');
        attrs.push(`[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]`);
      }

      const propertyLines = [
        ...attrs.map(attr => `    ${attr}`),
        `    public ${propType} ${propName} { get; set; }`
      ];

      return propertyLines.join('\n');
    });

    const classDef = `public class ${className}\n{\n${lines.join('\n\n')}\n}`;
    classes.push(classDef);
  }

  buildClass(className, obj);

  return [
    ...[...usingDirectives].sort(),
    '',
    ...classes.reverse()
  ].join('\n');
}

export function xmlToCSharpClass(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const classMap = new Map();

  function toPascalCase(str) {
    return str
      .replace(/[_\- ]+(\w)/g, (_, c) => c.toUpperCase())
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  function parseElement(element, className) {
    const properties = [];

    const children = Array.from(element.children);
    const tagCount = {};
    children.forEach(child => {
      tagCount[child.tagName] = (tagCount[child.tagName] || 0) + 1;
    });

    children.forEach(child => {
      const tag = child.tagName;
      const pascalName = toPascalCase(tag);

      const childChildren = Array.from(child.children);
      const isWrapper = childChildren.length > 0 &&
        childChildren.every(grandchild => grandchild.tagName === childChildren[0].tagName);

      if (isWrapper) {
        // Case: container like ListaImpreseRI → List of Impresa
        const itemTag = childChildren[0].tagName;
        const itemPascal = toPascalCase(itemTag);

        properties.push({
          annotations: [
            `[XmlArray("${tag}")]`,
            `[XmlArrayItem("${itemTag}")]`,
          ],
          type: `List<${itemPascal}>`,
          name: `${itemPascal}List`,
        });

        if (!classMap.has(itemPascal)) {
          parseElement(childChildren[0], itemPascal);
        }

      } else if (child.children.length > 0) {
        // Complex type
        properties.push({
          annotations: [`[XmlElement("${tag}")]`],
          type: pascalName,
          name: pascalName,
        });

        if (!classMap.has(pascalName)) {
          parseElement(child, pascalName);
        }

      } else {
        // Simple string
        properties.push({
          annotations: [`[XmlElement("${tag}")]`],
          type: "string",
          name: pascalName,
        });
      }
    });

    const classCode = generateCSharpClass(className, properties);
    classMap.set(className, classCode);
  }

  function generateCSharpClass(className, properties) {
    const props = properties
      .map(
        (p) =>
          `    ${p.annotations.join("\n    ")}\n    public ${p.type} ${p.name} { get; set; }`
      )
      .join("\n\n");

    return `public class ${className}\n{\n${props}\n}`;
  }

  const root = xmlDoc.documentElement;
  const rootClass = toPascalCase(root.tagName);
  parseElement(root, rootClass);

  return Array.from(classMap.values()).reverse().join("\n\n");
}

export function formatXml(xml) {
  let formatted = "";
  const reg = /(>)(<)(\/*)/g;
  xml = xml.replace(reg, "$1\r\n$2$3");
  let pad = 0;
  xml.split("\r\n").forEach((node) => {
    let indent = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) indent = 0;
    else if (node.match(/^<\/\w/)) pad -= 1;
    else if (node.match(/^<\w([^>]*[^/])?>.*$/)) indent = 1;
    const padding = "  ".repeat(pad);
    formatted += padding + node + "\r\n";
    pad += indent;
  });
  return formatted.trim();
}