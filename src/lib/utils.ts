import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format minor units (paise/cents) to human-readable currency.
 * e.g., 150000000 paise -> ₹15,00,000 (INR) or $1,500,000.00
 */
export function formatCurrency(amountMinor: number, currency = "INR"): string {
  const major = amountMinor / 100;
  
  if (currency.toUpperCase() === "INR") {
    // Format according to Indian numbering system: ₹15,00,000
    const isNegative = major < 0;
    const absVal = Math.abs(Math.round(major));
    const str = absVal.toString();
    let lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    if (otherNumbers !== "") {
      lastThree = "," + lastThree;
    }
    const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    return `${isNegative ? "-" : ""}₹${res}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(major);
}

/**
 * Convert user input amount to minor units (e.g. ₹15,00,000 -> 150000000)
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert minor units back to major
 */
export function toMajorUnits(amountMinor: number): number {
  return Math.round(amountMinor / 100);
}

/**
 * Parse human date string or ISO date safely
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return "Not set";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Calculate relative days between target date and current date
 */
export function getDaysRemaining(targetDate?: string | null): number | null {
  if (!targetDate) return null;
  try {
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}
