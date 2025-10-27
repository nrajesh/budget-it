import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parse } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencyCode: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

export const slugify = (text: string) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

export const formatDateToDDMMYYYY = (date: Date | string) => format(new Date(date), 'dd/MM/yyyy');
export const formatDateToYYYYMMDD = (date: Date | string) => format(new Date(date), 'yyyy-MM-dd');

export const parseDateFromDDMMYYYY = (dateString: string) => parse(dateString, 'dd/MM/yyyy', new Date());