import { parse } from "date-fns";

export function parseRobustDate(dateString: string, dateFormatPre?: string): string | null {
    if (!dateString) return null;

    // If explicit format provided
    if (dateFormatPre && dateFormatPre !== 'auto') {
        const parsed = parse(dateString, dateFormatPre, new Date());
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
        }
        console.warn(`Failed to parse date '${dateString}' with format '${dateFormatPre}'`);
        return null;
    }

    // Heuristics (Auto)
    const simpleDate = new Date(dateString);
    if (!isNaN(simpleDate.getTime())) {
        return simpleDate.toISOString();
    }

    const formats = [
        'd/M/yyyy',
        'M/d/yyyy',
        'd-M-yyyy',
        'yyyy/M/d',
        'yyyy-M-d',
        'd.M.yyyy'
    ];

    for (const fmt of formats) {
        const parsed = parse(dateString, fmt, new Date());
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
        }
    }

    return null;
}

export function parseRobustAmount(amountString: string, decimalSeparator?: '.' | ','): number {
    if (!amountString) return 0;

    let cleanString = amountString.replace(/[^0-9.,-]/g, '');
    if (!cleanString) return 0;

    if (decimalSeparator === ',') {
        // European format: 1.234,56 -> 1234.56
        // Remove dots (thousands)
        cleanString = cleanString.replace(/\./g, '');
        // Replace decimal comma with dot
        cleanString = cleanString.replace(',', '.');
    } else if (decimalSeparator === '.') {
        // US format: 1,234.56 -> 1234.56
        // Remove commas (thousands)
        cleanString = cleanString.replace(/,/g, '');
    } else {
        // Auto-detection (Legacy/Fallback)
        const dotIndex = cleanString.lastIndexOf('.');
        const commaIndex = cleanString.lastIndexOf(',');

        if (dotIndex > -1 && commaIndex > -1) {
            if (dotIndex > commaIndex) {
                cleanString = cleanString.replace(/,/g, '');
            } else {
                cleanString = cleanString.replace(/\./g, '').replace(',', '.');
            }
        } else if (commaIndex > -1) {
            // Ambiguous but assumed decimal if looks like one
            cleanString = cleanString.replace(/,/g, '.');
        }
    }

    const result = parseFloat(cleanString);
    return isNaN(result) ? 0 : result;
}
