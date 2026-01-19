import { startOfMonth, endOfMonth, subWeeks, subMonths, startOfYear, endOfYear, subDays } from 'date-fns';
import { DateRange } from "react-day-picker";

export interface ParsedFilterState {
    searchTerm: string; // The remaining text that wasn't parsed into a structured filter
    selectedAccounts: string[];
    selectedCategories: string[];
    selectedSubCategories: string[];
    selectedVendors: string[];
    dateRange: DateRange | undefined;
    minAmount?: number;
    maxAmount?: number;
    limit?: number;
    sortOrder?: 'largest' | 'smallest';
}

interface SearchContext {
    accounts: { name: string; slug: string; type?: string }[];
    categories: { name: string; slug: string }[];
    subCategories: { name: string; slug: string }[];
    vendors: { name: string; slug: string }[];
}

export const parseSearchQuery = (query: string, context: SearchContext): ParsedFilterState => {
    const result: ParsedFilterState = {
        searchTerm: query,
        selectedAccounts: [],
        selectedCategories: [],
        selectedSubCategories: [],
        selectedVendors: [],
        dateRange: undefined,
        minAmount: undefined,
        maxAmount: undefined,
        limit: undefined,
        sortOrder: undefined
    };

    let remainingQuery = query;

    // --- 1. Date Parsing (Basic Regex) ---
    const lowerQuery = query.toLowerCase();
    const today = new Date();

    // Helper to replace matched text
    const replaceMatch = (match: string) => {
        remainingQuery = remainingQuery.replace(new RegExp(match, 'gi'), '').trim();
    };

    if (lowerQuery.includes('past week')) { replaceMatch('past week'); result.dateRange = { from: subDays(today, 7), to: today }; }
    else if (lowerQuery.includes('last week')) { replaceMatch('last week'); result.dateRange = { from: subDays(today, 7), to: today }; }
    else if (lowerQuery.includes('past 7 days')) { replaceMatch('past 7 days'); result.dateRange = { from: subDays(today, 7), to: today }; }

    else if (lowerQuery.includes('past 2 weeks')) { replaceMatch('past 2 weeks'); result.dateRange = { from: subWeeks(today, 2), to: today }; }
    else if (lowerQuery.includes('last 2 weeks')) { replaceMatch('last 2 weeks'); result.dateRange = { from: subWeeks(today, 2), to: today }; }

    else if (lowerQuery.includes('last month')) { replaceMatch('last month'); result.dateRange = { from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) }; }
    else if (lowerQuery.includes('past month')) { replaceMatch('past month'); result.dateRange = { from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) }; }

    else if (lowerQuery.includes('this month')) { replaceMatch('this month'); result.dateRange = { from: startOfMonth(today), to: endOfMonth(today) }; }

    else if (lowerQuery.includes('this year')) { replaceMatch('this year'); result.dateRange = { from: startOfYear(today), to: endOfYear(today) }; }
    else if (lowerQuery.includes('this year')) { replaceMatch('this year'); result.dateRange = { from: startOfYear(today), to: endOfYear(today) }; }
    else if (lowerQuery.includes('last year')) { replaceMatch('last year'); result.dateRange = { from: startOfYear(subWeeks(today, 52)), to: endOfYear(subWeeks(today, 52)) }; }

    // --- 1.0 Explicit Date Parsing (Range: DD/MM/YYYY - DD/MM/YYYY) ---
    // Check for ranges first so single-date regex doesn't consume the start date
    // Supports: 01/01/2025-31/01/2025, 01/01/2025 - 31/01/2025, 01/01/2025 to 31/01/2025
    const rangeRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\s*(?:-|to)\s*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/i;
    const rangeMatch = remainingQuery.match(rangeRegex);
    if (rangeMatch) {
        const fromDay = parseInt(rangeMatch[1], 10);
        const fromMonth = parseInt(rangeMatch[2], 10) - 1;
        const fromYear = parseInt(rangeMatch[3], 10);
        const fromDate = new Date(fromYear, fromMonth, fromDay);
        fromDate.setHours(12, 0, 0, 0);

        const toDay = parseInt(rangeMatch[4], 10);
        const toMonth = parseInt(rangeMatch[5], 10) - 1;
        const toYear = parseInt(rangeMatch[6], 10);
        const toDate = new Date(toYear, toMonth, toDay);
        toDate.setHours(12, 0, 0, 0);

        if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
            result.dateRange = { from: fromDate, to: toDate };
            remainingQuery = remainingQuery.replace(rangeMatch[0], '').trim();
        }
    }

    // --- 1.1 Single Date (DD/MM/YYYY) ---
    // Match DD/MM/YYYY or DD-MM-YYYY
    const dmyRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/;
    const dmyMatch = remainingQuery.match(dmyRegex);
    if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed
        const year = parseInt(dmyMatch[3], 10);
        const date = new Date(year, month, day);
        date.setHours(12, 0, 0, 0); // Noon to avoid timezone shifts
        if (!isNaN(date.getTime())) {
            // If a single date is provided, range is that day
            result.dateRange = { from: date, to: date };
            remainingQuery = remainingQuery.replace(dmyMatch[0], '').trim();
        }
    }

    // --- 1.2 Explicit Month Range ("Nov 2025 to Jan 2026", "Nov - Jan") ---
    const monthNames = 'jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december';
    const monthRangeRegex = new RegExp(
        `\\b(${monthNames})\\s*(\\d{4})?\\s*(?:-|to)\\s*(${monthNames})\\s*(\\d{4})?\\b`,
        'i'
    );
    const monthRangeMatch = remainingQuery.match(monthRangeRegex);

    if (monthRangeMatch) {
        const fromMonthName = monthRangeMatch[1].toLowerCase();
        const fromYearStr = monthRangeMatch[2];
        const toMonthName = monthRangeMatch[3].toLowerCase();
        const toYearStr = monthRangeMatch[4];

        const getMonthIndex = (name: string) => [
            'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
        ].findIndex(m => name.startsWith(m));

        const fromMonth = getMonthIndex(fromMonthName);
        const toMonth = getMonthIndex(toMonthName);

        if (fromMonth >= 0 && toMonth >= 0) {
            let fromYear = fromYearStr ? parseInt(fromYearStr, 10) : today.getFullYear();
            let toYear = toYearStr ? parseInt(toYearStr, 10) : fromYear; // Default to same as start year if missing

            // Handle case where start year is missing but end year is present? 
            // Usually "Nov to Jan 2026" implies Nov 2025. 
            // If fromYear was defaulted to 'today.year' but toYear was explicit...
            if (!fromYearStr && toYearStr) {
                // Try to infer. If fromMonth > toMonth, likely spans year boundary implies toYear - 1
                // BUT if toYear is strictly explicit, maybe we just take toYear. 
                // Example "Nov to Jan 2026". Nov 2025 to Jan 2026.
                // If we have toYear 2026. Jan is month 0. Nov is month 10.
                // If we assume same year: Nov 2026 -> Jan 2026 (backwards).
                // So if fromMonth > toMonth, fromYear should be toYear - 1.
                if (fromMonth > toMonth) {
                    fromYear = toYear - 1;
                } else {
                    fromYear = toYear;
                }
            }

            // Handle case where both years missing? "Nov to Jan"
            // If Nov > Jan, assumes Nov (Year X) to Jan (Year X+1). relative to today?
            // Usually implies "upcoming" or "recent past"? 
            // Let's assume current year for fromYear.
            if (!fromYearStr && !toYearStr) {
                if (fromMonth > toMonth) {
                    toYear = fromYear + 1;
                }
            }

            const fromDate = new Date(fromYear, fromMonth, 1, 12, 0, 0);
            const toDate = endOfMonth(new Date(toYear, toMonth, 1, 12, 0, 0));
            toDate.setHours(12, 0, 0, 0);

            result.dateRange = { from: fromDate, to: toDate };
            remainingQuery = remainingQuery.replace(monthRangeMatch[0], '').trim();
        }
    }

    // Match Month YYYY (e.g. August 2025, Aug 2025)
    // Needs to be robust to handle full names and abbreviations.
    const monthYearRegex = /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s+(\d{4})\b/i;
    const monthYearMatch = remainingQuery.match(monthYearRegex);
    if (monthYearMatch) {
        const monthName = monthYearMatch[1].toLowerCase();
        const year = parseInt(monthYearMatch[2], 10);
        // Map month name to index
        const monthIndex = [
            'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
        ].findIndex(m => monthName.startsWith(m));

        if (monthIndex >= 0) {
            const startDate = new Date(year, monthIndex, 1, 12, 0, 0); // Noon
            const endDate = endOfMonth(startDate);
            endDate.setHours(12, 0, 0, 0);

            result.dateRange = { from: startDate, to: endDate };
            remainingQuery = remainingQuery.replace(monthYearMatch[0], '').trim();
        }
    }

    // --- 1.1 Generic Relative Date Parsing ("last 3 months", "past 30 days", "last one year", "one year data") ---
    const numberWords: { [key: string]: number } = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'eleven': 11, 'twelve': 12
    };

    // Helper to parse number or number word
    const parseNum = (str: string): number => {
        const n = parseInt(str, 10);
        if (!isNaN(n)) return n;
        return numberWords[str.toLowerCase()] || 0;
    };

    // Regex for "last/past X days/weeks/etc" OR "X years data"
    // expanded to capture number words
    const genericDateRegex = /(?:last|past)?\s*((?:\d+)|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve))\s+(days?|weeks?|months?|years?)(?:\s+data)?\b/i;
    const dateMatch = remainingQuery.match(genericDateRegex);
    if (dateMatch) {
        const num = parseNum(dateMatch[1]);
        const unit = dateMatch[2].toLowerCase();

        // If "last" or "past" is present OR "data" is present, we treat it as relative past range
        // If just "3 months" appears, it's ambiguous, but usually implies past 3 months in search context.
        if (num > 0) {
            if (unit.startsWith('day')) result.dateRange = { from: subDays(today, num), to: today };
            else if (unit.startsWith('week')) result.dateRange = { from: subWeeks(today, num), to: today };
            else if (unit.startsWith('month')) result.dateRange = { from: subMonths(today, num), to: today };
            else if (unit.startsWith('year')) result.dateRange = { from: subMonths(today, num * 12), to: today };

            remainingQuery = remainingQuery.replace(dateMatch[0], '').trim();
        }
    }



    // --- 2. Relative Search Parsing ("top 5", "largest 10") ---
    const relativeRegex = /(?:top|largest|biggest|highest|smallest|lowest|bottom)\s+(\d+)\b/i;
    const relativeMatch = remainingQuery.match(relativeRegex);
    if (relativeMatch) {
        result.limit = parseInt(relativeMatch[1], 10);
        const keyword = relativeMatch[0].split(/\s+/)[0].toLowerCase();
        if (['smallest', 'lowest', 'bottom'].includes(keyword)) {
            result.sortOrder = 'smallest';
        } else {
            result.sortOrder = 'largest';
        }
        remainingQuery = remainingQuery.replace(relativeMatch[0], '').trim();
    }

    // --- 3. Amount Parsing (>, <, over, under) ---
    // Regex for specific amount patterns (simple integers/decimals)
    const amountRegex = /(?:amount|spending|cost|value|transfers)?\s*(?:>|>=|<|<=|over|under|above|below|more than|less than)\s*(\$)?\s*(\d+(?:\.\d{1,2})?)/i;
    const match = remainingQuery.match(amountRegex);

    if (match) {
        const fullMatch = match[0].toLowerCase();
        const value = parseFloat(match[2]);

        if (fullMatch.includes('>') || fullMatch.includes('over') || fullMatch.includes('above') || fullMatch.includes('more than')) {
            result.minAmount = value;
        } else if (fullMatch.includes('<') || fullMatch.includes('under') || fullMatch.includes('below') || fullMatch.includes('less than')) {
            result.maxAmount = value;
        }

        // Remove amount part from query to prevent it being used as text search
        remainingQuery = remainingQuery.replace(match[0], '').trim();
    }

    // --- 2. Entity Matching (Fuzzy/Exact) ---
    // We split the query into words and also try to match multi-word phrases against our lists.
    // A simple approach: iterate through all known entities and check if their name exists in the query.

    // 2.0 Account Groups (e.g. "checking", "savings")
    const accountTypes = ['Checking', 'Savings', 'Credit Card', 'Investment'];
    accountTypes.forEach(type => {
        // e.g. "checking accounts", "my savings", "credit cards"
        if (remainingQuery.toLowerCase().includes(type.toLowerCase())) {
            // Find all accounts of this type
            const accountsOfType = context.accounts.filter(acc => acc.type === type);
            if (accountsOfType.length > 0) {
                accountsOfType.forEach(acc => {
                    // Avoid duplicates
                    if (!result.selectedAccounts.includes(acc.slug)) {
                        result.selectedAccounts.push(acc.slug);
                    }
                });
            }
            // Remove the type keyword from query?
            // "checking" might be part of "Checking Account 1".
            // If we remove "checking", we might break the exact name match below if the name relies on it.
            // BUT, if we match the group, do we still want to match individual accounts by name?
            // If I say "Chase Checking", "Checking" matches the group -> adds all checking accounts. 
            // Then "Chase Checking" matches the specific account -> adds it again (or handled by Set).
            // Usually if user says "Chase Checking", they mean the specific one.
            // If they say "All Checking", they mean the group.
            // Heuristic: If we match a specific account name exactly (or close enough), we prefer that.
            // But here we are doing a simple contains.

            // Let's rely on the specific list. If we add all 'Checking', adding 'Chase Checking' specifically is redundant but harmless (selected accounts is a list, UI usually handles it).
            // However, we should probably only trigger group match if it looks like a group request?
            // "Checking accounts", "all checking", "savings".
            // If I search "Chase Checking", I probably don't want ALL checking accounts. 
            // I only want that one.
            // So, maybe strictly remove the type keyword?
            // If I remove "checking", "Chase Checking" becomes "Chase ". "Chase" might match "Chase Checking" still.

            // Refined approach: Match specific accounts FIRST.
            // If "Chase Checking" is matched, we consume it.
            // Then if "Checking" remains, we matched the group?
            // Actually, code below matches specific accounts. Let's do that FIRST.
        }
    });

    // Moved Account Group logic AFTER specific account matching to avoid over-matching if possible, 
    // OR we consume specific names first.

    // Accounts
    context.accounts.forEach(acc => {
        if (remainingQuery.toLowerCase().includes(acc.name.toLowerCase())) {
            result.selectedAccounts.push(acc.slug);
            remainingQuery = remainingQuery.replace(new RegExp(acc.name, 'gi'), '').trim();
        }
    });

    // NOW check for Account Groups in the remaining query
    accountTypes.forEach(type => {
        // Simple plural handling: "credit cards" -> "credit card". "savings" is same. "investments" -> "investment"?
        // Let's just match the base type name case-insensitive.
        const typeLower = type.toLowerCase();
        // Check for "checking", "savings", "credit card", "investment"
        // Also handle "investments"
        const regex = new RegExp(`\\b${typeLower}(s)?\\b`, 'i');

        if (regex.test(remainingQuery)) {
            const accountsOfType = context.accounts.filter(acc => acc.type === type);
            if (accountsOfType.length > 0) {
                accountsOfType.forEach(acc => {
                    if (!result.selectedAccounts.includes(acc.slug)) {
                        result.selectedAccounts.push(acc.slug);
                    }
                });
            }
            // Remove distinct keyword occurrences
            remainingQuery = remainingQuery.replace(regex, '').trim();
        }
    });

    // Categories
    context.categories.forEach(cat => {
        if (remainingQuery.toLowerCase().includes(cat.name.toLowerCase())) {
            result.selectedCategories.push(cat.slug);
            remainingQuery = remainingQuery.replace(new RegExp(cat.name, 'gi'), '').trim();
        }
    });

    // Sub-Categories
    context.subCategories.forEach(sub => {
        if (remainingQuery.toLowerCase().includes(sub.name.toLowerCase())) {
            result.selectedSubCategories.push(sub.slug);
            remainingQuery = remainingQuery.replace(new RegExp(sub.name, 'gi'), '').trim();
        }
    });

    // Vendors
    context.vendors.forEach(vendor => {
        if (remainingQuery.toLowerCase().includes(vendor.name.toLowerCase())) {
            result.selectedVendors.push(vendor.slug);
            remainingQuery = remainingQuery.replace(new RegExp(vendor.name, 'gi'), '').trim();
        }
    });

    // If no date range found, default is often current month in the app, but here we return undefined to let the global default take over 
    // OR we interpret "no date" as "all time" if the user explicitly typed a search?
    // The prompt says: "If no time is mentioned consider current calendar month"
    if (!result.dateRange) {
        result.dateRange = { from: startOfMonth(today), to: endOfMonth(today) };
    }

    // The simplified query is basically the original query, 
    // but if the user wants "Amazon transactions", we parse "Amazon" as a vendor -> filter by vendor.
    // Do we keep "Amazon" in the text search?
    // If we filter by vendor ID, we don't necessarily need to text search "Amazon" anymore, filtering is stricter.
    // However, for safety, keeping the text search is fine unless it yields no results due to over-filtering.
    // Let's refine: The searchTerm usually filters *description* or *payee*.
    // If we detected a Vendor Entity, we set `selectedVendors`. The `searchTerm` is less relevant for that specific entity, 
    // but might match other fields. 
    // Ideally, if we confidently match an entity, we rely on the structured filter.

    // Clean up remaining query (remove dangling & , and, and filler words)
    // Clean up remaining query (remove dangling & , and, and filler words)
    let cleanSearchTerm = remainingQuery
        .replace(/\b(and|&|all|transactions?|items?|show|me|list|my)\b/gi, ' ')
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim();

    // If just punctuation remains, clear it
    if (/^[^a-zA-Z0-9]+$/.test(cleanSearchTerm)) {
        cleanSearchTerm = "";
    }

    result.searchTerm = cleanSearchTerm;

    return result;
};
