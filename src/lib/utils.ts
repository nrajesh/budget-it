import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (e) {
    console.error("Error formatting currency:", e);
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

/**
 * Formats a Date object or string into YYYY-MM-DD format.
 */
export function formatDateToYYYYMMDD(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object or string into DD/MM/YYYY format.
 */
export function formatDateToDDMMYYYY(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

/**
 * Parses a date string in DD/MM/YYYY format into a Date object.
 */
export function parseDateFromDDMMYYYY(dateString: string): Date | null {
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    // Month is 0-indexed in Date constructor
    const date = new Date(year, month - 1, day);
    // Check if the date is valid and matches the input parts
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
  }
  return null;
}

/**
 * Converts a string into a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-')      // Replace spaces and underscores with a single hyphen
    .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
}