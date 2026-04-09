
export function convertStringToBool(str) {
  let value = removeTags(removeSpace(str));
  if (!value || compareString(value, 'no') || compareString(value, 'false')) {
    return false;
  }

  return true;
}

export function removeTags(str) {
  if ((str === null) || (str === ''))
    return false;

  let value = emptyOrWhiteSpaceToNull(str?.replace(/(<([^>]+)>)/ig, '').replace('&nbsp;', ''));
  return value;
}

export function removeTagsWithDefaultValue(str, emptyIfNull) {
  if ((str === null) || (str === ''))
    return null;

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
  return str?.replace(/\s+/g, '');
}

export function formatString(str) {
  if (str === null) return null;

  const decoded = str
    ?.replace(/[\r\n\t]+/g, " ")
    ?.replace(/\s{2,}/g, " ") // Collapse multiple spaces
    ?.replace(/&lt;/g, "<")
    ?.replace(/&gt;/g, ">")
    ?.replace(/&amp;/g, "&")
    ?.replace(/&quot;/g, '"')
    ?.replace(/&#39;/g, "'")
    ?.trim();

  if (decoded?.startsWith('"') && decoded?.endsWith('"')) {
    return decoded;
  }

  return `"${decoded}"`;
}

export function compareString(str, str1) {
  return str?.toLowerCase() === str1?.toLowerCase();
}