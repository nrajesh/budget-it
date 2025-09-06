import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, parse } from "date-fns"; // Import parse for custom format parsing

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Formats an ISO date string or Date object to "DD-MMM-YYYY" format.
 * Example: "2023-01-15T12:00:00.000Z" or new Date(2023, 0, 15) -> "15-Jan-2023"
 */
export function formatDateToDDMMYYYY(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, "dd-MMM-yyyy");
}

/**
 * Parses a date string in "DD-MMM-YYYY" format into a Date object.
 * Example: "15-Jan-2023" -> Date object
 */
export function parseDateFromDDMMYYYY(dateString: string): Date {
  return parse(dateString, "dd-MMM-yyyy", new Date());
}

/**
 * Formats an ISO date string or Date object to "YYYY-MM-DD" format.
 * This is typically used for HTML date input fields.
 * Example: "2023-01-15T12:00:00.000Z" or new Date(2023, 0, 15) -> "2023-01-15"
 */
export function formatDateToYYYYMMDD(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, "yyyy-MM-dd");
}