import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parse } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  // Normalize -0 or effectively zero values to 0 to prevent -€0.00
  if (Math.abs(amount) < 0.005) {
    amount = 0;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with a single dash
    .replace(/^-+|-+$/g, ""); // Remove dashes from start and end
}

export function formatDateToYYYYMMDD(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "";
  return format(dateObj, "yyyy-MM-dd");
}

export function formatDateToDDMMYYYY(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "";
  return format(dateObj, "dd/MM/yyyy");
}

export function parseDateFromDDMMYYYY(dateString: string): Date {
  // Parses date string like '31/12/2023' into a Date object
  return parse(dateString, "dd/MM/yyyy", new Date());
}
