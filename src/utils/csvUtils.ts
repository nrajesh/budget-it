/**
 * Utility functions for handling CSV data securely.
 */

/**
 * Sanitizes a field to prevent CSV Injection (Formula Injection).
 * Prepend a single quote if the field starts with =, +, -, @, or tab/CR.
 * This prevents Excel and other spreadsheet software from executing the cell as a formula.
 *
 * Exception: Safe numeric values (starting with + or -) are allowed to pass through
 * unescaped to preserve their numeric type in spreadsheets.
 *
 * @param field - The value to sanitize.
 * @returns The sanitized string.
 */
export const sanitizeCSVField = (
  field: string | number | null | undefined,
): string => {
  if (field === null || field === undefined) return "";
  const str = String(field);

  // If the string starts with any of the dangerous characters
  // Dangerous characters: =, +, -, @, Tab (0x09), Carriage Return (0x0D)
  if (/^[=+@\t\r-]/.test(str)) {
    // Allow valid numbers starting with + or - to remain unescaped
    // This regex matches standard integer or decimal numbers
    // e.g., -50, +100, -10.5
    if (/^[+-]?\d+(\.\d+)?$/.test(str)) {
      return str;
    }

    return "'" + str;
  }

  return str;
};
