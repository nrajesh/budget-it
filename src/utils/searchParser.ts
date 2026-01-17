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
    accounts: { name: string; slug: string }[];
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
    else if (lowerQuery.includes('last year')) { replaceMatch('last year'); result.dateRange = { from: startOfYear(subWeeks(today, 52)), to: endOfYear(subWeeks(today, 52)) }; }

    // --- 1.1 Generic Relative Date Parsing ("last 3 months", "past 30 days") ---
    const genericDateRegex = /(?:last|past)\s+(\d+)\s+(days?|weeks?|months?|years?)\b/i;
    const dateMatch = remainingQuery.match(genericDateRegex);
    if (dateMatch) {
        const num = parseInt(dateMatch[1], 10);
        const unit = dateMatch[2].toLowerCase();
        if (unit.startsWith('day')) result.dateRange = { from: subDays(today, num), to: today };
        else if (unit.startsWith('week')) result.dateRange = { from: subWeeks(today, num), to: today };
        else if (unit.startsWith('month')) result.dateRange = { from: subMonths(today, num), to: today };
        else if (unit.startsWith('year')) result.dateRange = { from: subMonths(today, num * 12), to: today };

        remainingQuery = remainingQuery.replace(dateMatch[0], '').trim();
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

    // Accounts
    context.accounts.forEach(acc => {
        if (remainingQuery.toLowerCase().includes(acc.name.toLowerCase())) {
            result.selectedAccounts.push(acc.slug);
            remainingQuery = remainingQuery.replace(new RegExp(acc.name, 'gi'), '').trim();
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
