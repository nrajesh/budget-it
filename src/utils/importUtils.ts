import { parse } from "date-fns";

// Pre-allocate format arrays to avoid reallocation on every function call
const dmyFormats = [
  "d/M/yyyy",
  "dd/MM/yyyy",
  "d-M-yyyy",
  "dd-MM-yyyy",
  "d.M.yyyy",
  "dd.MM.yyyy",
  "dd/M/yyyy",
  "d/MM/yyyy", // Mixed padding
];

const mdyFormats = [
  "M/d/yyyy",
  "MM/dd/yyyy",
  "M-d-yyyy",
  "MM-dd-yyyy",
  "M.d.yyyy",
  "MM.dd.yyyy",
  "MM/d/yyyy",
  "M/dd/yyyy", // Mixed padding
];

const ymdFormats = [
  "yyyy-M-d",
  "yyyy-MM-dd",
  "yyyy/M/d",
  "yyyy/MM/dd",
  "yyyy.M.d",
  "yyyy.MM.dd",
];

const autoFormats = [
  "yyyy-MM-dd",
  "yyyy/MM/dd",
  "d/M/yyyy",
  "M/d/yyyy", // Ambiguous ones are risk, usually prefer local or consistent.
  // If auto, we really rely on date-fns/js parsing or list.
  "d-M-yyyy",
  "d.M.yyyy",
];

/**
 * Helper to try parsing a list of formats.
 */
function tryFormats(dateString: string, formats: string[]): string | null {
  for (const fmt of formats) {
    const parsed = parse(dateString, fmt, new Date());
    if (!isNaN(parsed.getTime())) {
      // Sanity check: year should be reasonable (e.g., within +/- 100 years) or > 1900
      if (parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
        // Set to noon to avoid timezone shifts when converting to UTC
        parsed.setHours(12, 0, 0, 0);
        return parsed.toISOString();
      }
    }
  }
  return null;
}

export function parseRobustDate(
  dateString: string,
  dateFormatPre?: string,
): string | null {
  if (!dateString) return null;
  dateString = dateString.trim();

  // If explicit format provided
  if (dateFormatPre && dateFormatPre !== "auto") {
    // 1. Try strict match first
    const strictMatch = tryFormats(dateString, [dateFormatPre]);
    if (strictMatch) return strictMatch;

    // 2. Identify intent and try fallbacks
    // Check structural intent (DMY vs MDY vs YMD)
    const isDMY =
      dateFormatPre.startsWith("d") || dateFormatPre.startsWith("D");
    const isMDY =
      dateFormatPre.startsWith("M") || dateFormatPre.startsWith("m");
    const isYMD =
      dateFormatPre.startsWith("y") || dateFormatPre.startsWith("Y");

    let fallbacks: string[] = [];
    if (isDMY) fallbacks = dmyFormats;
    else if (isMDY) fallbacks = mdyFormats;
    else if (isYMD) fallbacks = ymdFormats;

    if (fallbacks.length > 0) {
      const fallbackMatch = tryFormats(dateString, fallbacks);
      if (fallbackMatch) return fallbackMatch;
    }

    console.warn(
      `Failed to parse date '${dateString}' with format '${dateFormatPre}' and fallbacks.`,
    );
    return null;
  }

  // Heuristics (Auto)
  // Try ISO first
  const isoTry = new Date(dateString);
  if (!isNaN(isoTry.getTime())) {
    // Set to noon to avoid timezone shifts
    isoTry.setHours(12, 0, 0, 0);
    return isoTry.toISOString();
  }

  // Try common ones
  return tryFormats(dateString, autoFormats);
}

export function parseRobustAmount(
  amountString: string,
  decimalSeparator?: "." | ",",
): number {
  if (!amountString) return 0;

  let cleanString = amountString.replace(/[^0-9.,-]/g, "");
  if (!cleanString) return 0;

  if (decimalSeparator === ",") {
    // European format: 1.234,56 -> 1234.56
    // Remove dots (thousands)
    cleanString = cleanString.replace(/\./g, "");
    // Replace decimal comma with dot
    cleanString = cleanString.replace(",", ".");
  } else if (decimalSeparator === ".") {
    // US format: 1,234.56 -> 1234.56
    // Remove commas (thousands)
    cleanString = cleanString.replace(/,/g, "");
  } else {
    // Auto-detection (Legacy/Fallback)
    const dotIndex = cleanString.lastIndexOf(".");
    const commaIndex = cleanString.lastIndexOf(",");

    if (dotIndex > -1 && commaIndex > -1) {
      if (dotIndex > commaIndex) {
        cleanString = cleanString.replace(/,/g, "");
      } else {
        cleanString = cleanString.replace(/\./g, "").replace(",", ".");
      }
    } else if (commaIndex > -1) {
      // Ambiguous but assumed decimal if looks like one
      cleanString = cleanString.replace(/,/g, ".");
    }
  }

  const result = parseFloat(cleanString);
  return isNaN(result) ? 0 : result;
}
