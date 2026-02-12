import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";

export interface SearchFilters {
  dateRange?: { from: Date; to: Date };
  minAmount?: number;
  maxAmount?: number;
  text?: string[]; // Multiple text terms to match against various fields
}

export const parseSearchQuery = (query: string): SearchFilters => {
  const filters: SearchFilters = { text: [] };
  const lowerQuery = query.toLowerCase();

  // 1. Date Parsing
  // Check for keywords
  const today = new Date();

  if (lowerQuery.includes("all time")) {
    filters.dateRange = undefined;
  } else if (lowerQuery.includes("last week")) {
    const lastWeekStart = startOfWeek(subWeeks(today, 1));
    const lastWeekEnd = endOfWeek(subWeeks(today, 1));
    filters.dateRange = { from: lastWeekStart, to: lastWeekEnd };
  } else if (lowerQuery.includes("this week")) {
    filters.dateRange = { from: startOfWeek(today), to: endOfWeek(today) };
  } else if (lowerQuery.includes("last month")) {
    const lastMonthStart = startOfMonth(subMonths(today, 1));
    const lastMonthEnd = endOfMonth(subMonths(today, 1));
    filters.dateRange = { from: lastMonthStart, to: lastMonthEnd };
  } else if (lowerQuery.includes("this month")) {
    filters.dateRange = { from: startOfMonth(today), to: endOfMonth(today) };
  } else if (lowerQuery.includes("last year")) {
    const lastYearStart = startOfYear(subYears(today, 1));
    const lastYearEnd = endOfYear(subYears(today, 1));
    filters.dateRange = { from: lastYearStart, to: lastYearEnd };
  } else if (lowerQuery.includes("this year")) {
    filters.dateRange = { from: startOfYear(today), to: endOfYear(today) };
  } else if (lowerQuery.includes("yesterday")) {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const endYesterday = new Date(today);
    endYesterday.setDate(today.getDate() - 1);
    endYesterday.setHours(23, 59, 59, 999);
    filters.dateRange = { from: yesterday, to: endYesterday };
  } else if (lowerQuery.includes("today")) {
    const startToday = new Date(today);
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(today);
    endToday.setHours(23, 59, 59, 999);
    filters.dateRange = { from: startToday, to: endToday };
  } else {
    // Check for explicit month names e.g. "december" or "jan"
    const months = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    const shortMonths = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];

    let monthIndex = -1;
    for (let i = 0; i < months.length; i++) {
      if (lowerQuery.includes(months[i])) {
        monthIndex = i;
        break;
      }
    }
    if (monthIndex === -1) {
      for (let i = 0; i < shortMonths.length; i++) {
        // Word boundary check might be good, but simple includes for now
        if (lowerQuery.split(" ").includes(shortMonths[i])) {
          monthIndex = i;
          break;
        }
      }
    }

    if (monthIndex !== -1) {
      // Assume current year if not specified, logic could be improved to detect year
      const yearMatch = lowerQuery.match(/\b20\d{2}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : today.getFullYear();

      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = endOfMonth(monthStart);
      filters.dateRange = { from: monthStart, to: monthEnd };
    }
  }

  // Specific year check alone e.g. "2023"
  if (!filters.dateRange) {
    const yearOnlyMatch = lowerQuery.match(/\b(20\d{2})\b/);
    if (yearOnlyMatch) {
      const year = parseInt(yearOnlyMatch[1]);
      filters.dateRange = {
        from: new Date(year, 0, 1),
        to: new Date(year, 11, 31),
      };
    }
  }

  // 2. Amount Parsing
  // > 100, < 500, 100..200
  const amountGtRegex = />\s*(\d+)/;
  const amountLtRegex = /<\s*(\d+)/;
  const amountRangeRegex = /(\d+)\s*\.\.\s*(\d+)/;

  const gtMatch = query.match(amountGtRegex);
  if (gtMatch) {
    filters.minAmount = parseInt(gtMatch[1]);
  }

  const ltMatch = query.match(amountLtRegex);
  if (ltMatch) {
    filters.maxAmount = parseInt(ltMatch[1]);
  }

  if (lowerQuery.includes("negative")) {
    filters.maxAmount = 0;
  }

  const rangeMatch = query.match(amountRangeRegex);
  if (rangeMatch) {
    filters.minAmount = parseInt(rangeMatch[1]);
    filters.maxAmount = parseInt(rangeMatch[2]);
  }

  // 3. Text Extraction
  // Remove matched date/amount patterns to leave residual text
  // This is a naive approach; robust NLP would be better but this suffices for "google-like" feel
  let residual = lowerQuery;

  // Remove known date keywords
  [
    "all time",
    "last week",
    "this week",
    "last month",
    "this month",
    "last year",
    "this year",
    "yesterday",
    "today",
    "negative",
  ].forEach((k) => {
    residual = residual.replace(k, "");
  });

  // Remove months
  [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ].forEach((k) => {
    residual = residual.replace(k, "");
  });
  [
    "jan",
    "feb",
    "mar",
    "apr",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ].forEach((k) => {
    // may is covered
    residual = residual.replace(new RegExp(`\\b${k}\\b`, "g"), "");
  });

  // Remove years
  residual = residual.replace(/\b20\d{2}\b/g, "");

  // Remove amounts
  residual = residual.replace(amountGtRegex, "");
  residual = residual.replace(amountLtRegex, "");
  residual = residual.replace(amountRangeRegex, "");

  // Clean up whitespace
  const terms = residual
    .split(/\s+/)
    .filter((t) => t.length > 0 && t !== ">" && t !== "<" && t !== "..");
  if (terms.length > 0) {
    filters.text = terms;
  }

  return filters;
};

export const filterTransactions = (transactions: any[], query: string) => {
  if (!query || query.trim() === "") return transactions;

  const filters = parseSearchQuery(query);

  return transactions.filter((t) => {
    let match = true;

    // Date Check
    if (filters.dateRange) {
      const tDate = new Date(t.date);
      if (tDate < filters.dateRange.from || tDate > filters.dateRange.to) {
        match = false;
      }
    }

    // Amount Check
    if (filters.minAmount !== undefined) {
      if (Math.abs(t.amount) <= filters.minAmount) match = false; // Check absolute amount? Or signed? Usually magnitude for search.
    }
    if (filters.maxAmount !== undefined) {
      if (Math.abs(t.amount) >= filters.maxAmount) match = false;
    }

    // Text Check
    if (filters.text && filters.text.length > 0) {
      const searchableText =
        `${t.vendor} ${t.category} ${t.account} ${t.remarks || ""}`.toLowerCase();
      // All terms must match (AND logic)
      const textMatch = filters.text.every((term) =>
        searchableText.includes(term),
      );
      if (!textMatch) match = false;
    }

    return match;
  });
};

export const filterAccounts = (accounts: any[], query: string) => {
  if (!query || query.trim() === "") return accounts;

  const filters = parseSearchQuery(query);

  return accounts.filter((acc) => {
    let match = true;

    // Amount Check (against running_balance)
    // Special handling for 'negative' keyword which sets maxAmount to 0
    // If "negative" is present, we care about signed value being < 0.
    // But the parser sets maxAmount = 0.
    // If parser sets maxAmount = 0 (and it came from 'negative'), we want strictly < 0.

    if (filters.maxAmount !== undefined) {
      if (filters.maxAmount === 0 && query.toLowerCase().includes("negative")) {
        if (acc.running_balance >= 0) match = false;
      } else {
        if (Math.abs(acc.running_balance) >= filters.maxAmount) match = false;
      }
    }

    if (filters.minAmount !== undefined) {
      if (Math.abs(acc.running_balance) <= filters.minAmount) match = false;
    }

    // Text Check
    if (filters.text && filters.text.length > 0) {
      const searchableText =
        `${acc.name} ${acc.currency} ${acc.remarks || ""}`.toLowerCase();
      const textMatch = filters.text.every((term) =>
        searchableText.includes(term),
      );
      if (!textMatch) match = false;
    }

    return match;
  });
};
