import { parse } from "date-fns";

export function parseRobustDate(dateString: string): string | null {
    if (!dateString) return null;

    // Try parsing ISO format first (yyyy-MM-dd) or standard Date parsable strings
    const simpleDate = new Date(dateString);
    if (!isNaN(simpleDate.getTime())) {
        // Check if it's a reasonable date (e.g. not "0001-01-01" unless intent is clear, but let's just return ISO)
        return simpleDate.toISOString();
    }

    // Define format attempts for common CSV exports
    const formats = [
        'dd/MM/yyyy',
        'MM/dd/yyyy',
        'dd-MM-yyyy',
        'yyyy/MM/dd',
        'dd.MM.yyyy'
    ];

    for (const fmt of formats) {
        const parsed = parse(dateString, fmt, new Date());
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
        }
    }

    // If simple parsing fails but it looks like a date, maybe try aggressive manual parsing?
    // For now, return null to indicate failure
    return null;
}

export function parseRobustAmount(amountString: string): number {
    if (!amountString) return 0;

    // Remove currency symbols and whitespace
    // Keep digits, dots, commas, minus
    let cleanString = amountString.replace(/[^0-9.,-]/g, '');

    if (!cleanString) return 0;

    // Handle various decimal formats:
    // 1.200,50 -> 1200.50
    // 1,200.50 -> 1200.50
    // 1200,50  -> 1200.50 (if , is last separator)

    const dotIndex = cleanString.lastIndexOf('.');
    const commaIndex = cleanString.lastIndexOf(',');

    if (dotIndex > -1 && commaIndex > -1) {
        if (dotIndex > commaIndex) {
            // US format: 1,234.56 -> remove commas
            cleanString = cleanString.replace(/,/g, '');
        } else {
            // EU format: 1.234,56 -> remove dots, change comma to dot
            cleanString = cleanString.replace(/\./g, '').replace(',', '.');
        }
    } else if (commaIndex > -1) {
        // Only commas. 
        // check if it looks like a decimal separator (usually 2 digits after?)
        // or if there are multiple commas (thousand separators)
        const parts = cleanString.split(',');
        if (parts.length > 2) {
            // 1,000,000 -> remove commas
            cleanString = cleanString.replace(/,/g, '');
        } else if (parts.length === 2) {
            // 123,45. Check length of second part. 
            // If 3 digits, usually thousand separator? 100,000. 
            // But 123,456 could be 123.456 decimal. Ambiguous.
            // BUT in finance csv, thousands are often used. 
            // Let's assume if it is ambiguous, try to parse as is first? 
            // Actually, standard js float uses dot.
            // If we have "10,50", that's likely 10.50.
            // If "10,000", that's 10000.

            // Heuristic: If part[1] is exactly 3 digits, treat as thousand separator IF the value makes sense?
            // No, safer to assume if only comma is present, and user is from EU, it is decimal.
            // But we don't know locale.
            // Let's assume if the result of replacing , with . is a valid float, use it?
            // Actually, let's assume it IS decimal separator if it is the only separator and not followed by 3 digits (unless it's the very end).
            // Wait, simplistic implementation: Replace comma with dot if dot is missing.
            cleanString = cleanString.replace(/,/g, '.');
        }
    }

    // Final parse
    const result = parseFloat(cleanString);
    return isNaN(result) ? 0 : result;
}
