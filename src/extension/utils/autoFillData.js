import { LOCALE_MAP } from './localeMap.js';
import { getCodeByName, get3LettersCodeByName } from './countryMap.js';
import { getNormalizedKeyByFieldName } from './normalizedFieldMapping.js';
import languageData from "../constants/language_templates.min.json";
import countryData from "../constants/country_templates.min.json";
import { showToast } from "./toast.js";

function numStr(min, max) {
  const value = Math.floor(Math.random() * (max - min + 1)) + min;
  return String(value);
}
const GENERATORS = {
  // --- Basic Name Fields ---
  FirstGivenName: (c, l) => getData("FirstGivenName", c, l),
  MiddleName: (c, l) => getData("MiddleName", c, l),
  FirstSurName: (c, l) => getData("FirstSurName", c, l),
  SecondSurname: (c, l) => getData("SecondSurname", c, l),
  FullName: (c, l) => getData("FullName", c, l),

  // --- Address / Location ---
  Location: (c, l) => getLocation(c),
  Address1: (c, l) => getLocation(c).Address1 || "",
  Address2: (c, l) => getLocation(c).Address2 || "",
  AddressCountryCode: (c, l) => c,
  AddressCountryName: (c, l) => getData("AddressCountryName", c, l),
  City: (c, l) => getLocation(c).City || "",
  Suburb: (c, l) => getLocation(c).Suburb || "",
  StateProvinceCode: (c, l) => getLocation(c).StateProvinceCode || "",
  PostalCode: (c, l) => getLocation(c).PostalCode || "",
  BuildingNumber: (c, l) => getLocation(c).BuildingNumber || "1",
  BuildingName: (c, l) => getLocation(c).BuildingName || "",
  StreetName: (c, l) => getLocation(c).StreetName || "",
  StreetType: (c, l) => getLocation(c).StreetType || "rd",
  UnitNumber: (c, l) => getLocation(c).UnitNumber || "2",
  FloorNumber: (c, l) => getLocation(c).FloorNumber || "1",
  BlockNumber: (c, l) => getLocation(c).BlockNumber || "2",
  PropertyName: (c, l) => getLocation(c).PropertyName || "",
  POBox: (c, l) => getLocation(c).POBox || "3",

  // --- Identification ---
  PassportNumber: (c, l) => getData("PassportNumber", c, l),
  DocumentType: (c, l) => getData("DocumentType", c, l),
  DocumentSeries: (c, l) => getData("DocumentSeries", c, l),

  // --- Business ---
  BusinessName: (c, l) => getData("BusinessName", c, l),
  BusinessIDNumber: (c, l) => getData("BusinessIDNumber", c, l),
  BusinessIDType: (c, l) => getData("BusinessIDType", c, l),
  BusinessActivities: (c, l) => getData("BusinessActivities", c, l),
  JurisdictionOfIncorporation: (c, l) => getData("JurisdictionOfIncorporation", c, l),
  LocalActivityType: (c, l) => getData("LocalActivityType", c, l),
  LegalStatus: (c, l) => getData("LegalStatus", c, l),

  // --- Contact ---
  Telephone: (c, l) => getData("Telephone", c, l),
  EmailAddress: (c, l) => getData("EmailAddress", c, l),

  // --- Misc ---
  Gender: () => (Math.random() < 0.5 ? "M" : "F"),
  Region: (c, l) => getData("Region", c, l),
  County: (c, l) => getData("County", c, l),
  Latitude: (c, l) => getLocation(c).Latitude || "",
  Longitude: (c, l) => getLocation(c).Longitude || "",
  DayOfBirth: (c, l) => numStr(1, 28),
  MonthOfBirth: (c, l) => numStr(1, 12),
  YearOfBirth: (c, l) => numStr(1930, 2000),
  PassportMRZLine1: (c, l) => randomMRZLine1(c),
  PassportMRZLine2: (c, l) => randomMRZLine2(c),
};

function randomMRZLine1(country) {
  let iso3 = get3LettersCodeByName(country);
  return `P<${iso3}SMITH<<JOHN<ALBERT<<<<<<<<<<<<<<<<<<<<<`;
}

function randomMRZLine2(country) {
  let iso3 = get3LettersCodeByName(country);
  iso3 = (iso3 || 'XXX').toUpperCase().slice(0, 3).padEnd(3, '<');

  const rndChar = () => {
    const pool = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const rndAlnum = (len) => Array.from({ length: len }, rndChar).join('');

  // MRZ char value mapping: 0-9 -> 0-9, A-Z -> 10-35, '<' -> 0
  function mrzValue(ch) {
    if (ch === '<') return 0;
    if (/[0-9]/.test(ch)) return ch.charCodeAt(0) - 48; // '0' -> 0
    if (/[A-Z]/.test(ch)) return ch.charCodeAt(0) - 55; // 'A' -> 10
    // fallback: treat unknown as 0
    return 0;
  }

  // compute check digit for a string per ICAO 9303
  function checkDigit(input) {
    const weights = [7, 3, 1];
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      sum += mrzValue(input[i]) * weights[i % 3];
    }
    return String(sum % 10);
  }

  // --- Passport number (9 chars) ---
  // Passport numbers are often alphanumeric; use random upper-case alnum
  let passportNumber = rndAlnum(9);

  // --- Date of birth: YYMMDD (6) ---
  // choose a DOB between 18 and 90 years old
  const now = new Date();
  const minAge = 18, maxAge = 90;
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
  const birthYear = now.getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1; // safe 1-28 to avoid invalid dates
  const dobYY = String(birthYear).slice(-2);
  const dobMM = String(birthMonth).padStart(2, '0');
  const dobDD = String(birthDay).padStart(2, '0');
  const dateOfBirth = `${dobYY}${dobMM}${dobDD}`;

  // --- Sex ---
  const sex = Math.random() < 0.5 ? 'M' : 'F'; // could be '<' too if desired

  // --- Expiry date: YYMMDD (6) ---
  // expiry between 1 and 10 years from today
  const addYears = Math.floor(Math.random() * 10) + 1;
  const expDate = new Date(now.getFullYear() + addYears, now.getMonth(), now.getDate());
  const expYY = String(expDate.getFullYear()).slice(-2);
  const expMM = String(expDate.getMonth() + 1).padStart(2, '0');
  const expDD = String(expDate.getDate()).padStart(2, '0');
  const expiry = `${expYY}${expMM}${expDD}`;

  // --- Personal number / optional data (14) ---
  // random alnum or mostly filler '<'
  // to simulate empty optional, we'll randomly choose some filled and some '<'
  const personalNumber = (() => {
    if (Math.random() < 0.4) return '<'.repeat(14); // empty optional
    // otherwise mix alnum and fillers
    return Array.from({ length: 14 }).map(() => (Math.random() < 0.6 ? rndChar() : '<')).join('');
  })();

  // --- Compute check digits ---
  const passportCheck = checkDigit(passportNumber);
  const dobCheck = checkDigit(dateOfBirth);
  const expiryCheck = checkDigit(expiry);
  const personalCheck = checkDigit(personalNumber);

  // Final check digit: computed over concat of:
  // passportNumber (9) + passportCheck (1) +
  // dateOfBirth (6) + dobCheck (1) +
  // expiry (6) + expiryCheck (1) +
  // personalNumber (14) + personalCheck (1)
  const composite = passportNumber + passportCheck +
    dateOfBirth + dobCheck +
    expiry + expiryCheck +
    personalNumber + personalCheck;
  const finalCheck = checkDigit(composite);

  // Build line 2: positions 1-44
  // 1-9   passportNumber
  // 10    passportCheck
  // 11-13 nationality (iso3)
  // 14-19 dateOfBirth (YYMMDD)
  // 20    dobCheck
  // 21    sex
  // 22-27 expiry (YYMMDD)
  // 28    expiryCheck
  // 29-42 personalNumber (14)
  // 43    personalCheck
  // 44    finalCheck
  const pad = (s, len) => (s + '<'.repeat(len)).slice(0, len);

  const line2 = [
    pad(passportNumber, 9),
    passportCheck,
    pad(iso3, 3),
    dateOfBirth,
    dobCheck,
    sex,
    expiry,
    expiryCheck,
    pad(personalNumber, 14),
    personalCheck,
    finalCheck
  ].join('');

  if (line2.length !== 44) {
    throw new Error(`MRZ generation error: expected 44 chars but got ${line2.length}: "${line2}"`);
  }

  return line2;
}

function getData(field, countryCode, langCode) {
  const countryPart = countryData[countryCode]?.[field];
  const langPart = languageData[langCode]?.[field];

  if (countryPart && countryPart.length > 0) return pickRandom(countryPart);
  if (langPart && langPart.length > 0) return pickRandom(langPart);
  return "";
}

function getLocation(countryCode) {
  const locs = countryData[countryCode]?.Location;
  if (!Array.isArray(locs) || locs.length === 0) return {};
  return pickRandom(locs);
}

function pickRandom(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateFormData(fieldNames, country) {
  const data = {};
  // Automatically strip suffixes like " (GB)" or " (USA)" so mapping works correctly
  const normalizedCountry = country ? country.replace(/\s*\([A-Z]{2,3}\)\s*$/, '').trim() : "";

  const localeCode = (normalizedCountry && LOCALE_MAP[normalizedCountry.toUpperCase()]) || 'en';
  const countryCode = getCodeByName(normalizedCountry);

  if (!countryCode) {
    showToast(`Fail to get country code for: ${country}`, 'error');
    return data;
  }

  fieldNames.forEach((name) => {
    const normalizedKey = getNormalizedKeyByFieldName(name);
    if (normalizedKey) {
      const gen = GENERATORS[normalizedKey];
      if (gen) {
        var value = gen(countryCode, localeCode);
        data[name] = value;
      }
    }
  });

  return data;
};

export const fillDataOldUI = () => {
  const countryName = document.querySelector(".country-name").innerText;
  const elements = document.querySelectorAll(`
    textarea[id^="textarea-field"],
    select[id^="option-field"],
    input[id^="number-range-field"],
    input[type="checkbox"],
    input[placeholder="Month"],
    div[data-testid="input-page-personal-info-section"] input[id]:not([type="checkbox"]),
    div[data-testid="input-page-personal-info-section"] select[id],
    div[data-testid="input-page-personal-info-section"] textarea[id]
  `);

  const names = Array.from(elements)
    .map(el => {
      const parts = el.id.split('-');
      const suffix = parts.length > 1 ? parts[parts.length - 1] : parts.length === 1 ? parts[0] : null;
      if (el.id === 'search' && el.getAttribute('placeholder') === 'Month') {
        return 'MonthOfBirth';
      }

      return suffix;
    })
    .filter(suffix => suffix && /^[A-Za-z0-9]+$/.test(suffix));

  const uniqueNames = [...new Set(names)];

  const data = generateFormData(uniqueNames, countryName);

  elements.forEach(el => {
    const parts = el.id.split('-');
    const suffix = parts.length > 1 ? parts[parts.length - 1] : parts.length === 1 ? parts[0] : null;

    if (!suffix || !data[suffix]) return;

    const value = data[suffix];

    if (el.type === 'checkbox') {
      el.checked = !!value;
    } else if (el.tagName === 'SELECT') {
      let option = Array.from(el.options).find(opt => opt.value === value || opt.text === value);
      if (!option) {
        const pool = Array.from(el.options).filter(
          o => !o.disabled && !o.hidden && o.value !== ""
        );
        const list = pool.length ? pool : Array.from(el.options);
        option = list[Math.floor(Math.random() * list.length)];
      }

      el.value = option.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  const testTransactionContainer = document.querySelector('[data-testid="input-page-run-a-test-transaction-checkbox"]');

  if (testTransactionContainer) {
    if (testTransactionContainer.textContent.includes('Run a Test Transaction')) {
      const input = testTransactionContainer.querySelector('input[type="checkbox"]');
      if (input && !input.checked) {
        input.click();
      }
    }
  } else {
    const label = Array.from(document.querySelectorAll('label.checkbox-set'))?.find(l => l.textContent.includes('Run A Test Transaction'));

    if (label) {
      const input = label.querySelector('input[type="checkbox"]');
      if (input && !input.checked) {
        input.click();
      }
    }
  }
}

function fillDataNewUI(root) {
  const countryName = document.getElementById("search")?.value || document.querySelector('.StCountryField-sc-56xzqc-0 label')?.textContent || "";

  const elements = root.querySelectorAll(`
    input[id],
    select[id],
    textarea[id]
  `);

  const names = Array.from(elements)
    .map(el => el.id)
    .filter(id => /^[A-Za-z0-9]+$/.test(id));

  const uniqueNames = [...new Set(names)];

  const data = generateFormData(uniqueNames, countryName);

  elements.forEach(el => {
    const field = el.id;
    const value = data[field];

    if (!value) return;

    if (el.type === "checkbox") {
      el.checked = !!value;
    }
    else if (el.tagName === "SELECT") {
      let option = Array.from(el.options).find(
        opt => opt.value === value || opt.text === value
      );

      if (!option) {
        const pool = Array.from(el.options).filter(
          o => !o.disabled && !o.hidden && o.value !== ""
        );

        const list = pool.length ? pool : Array.from(el.options);
        option = list[Math.floor(Math.random() * list.length)];
      }

      el.value = option.value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    else {
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  toggleTestTransaction(root);
}

function toggleTestTransaction(root) {
  const checkbox = root.querySelector(
    'input[type="checkbox"][name*="Test"], input[type="checkbox"][id*="Test"]'
  );

  if (checkbox && !checkbox.checked) {
    checkbox.click();
  }
}

export const fillData = () => {
  const microFrontendRoot = document.querySelector("#micro-frontend-root");

  if (microFrontendRoot) {
    fillDataNewUI(microFrontendRoot);
  } else {
    fillDataOldUI();
  }
};