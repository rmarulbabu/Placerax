import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.345, "w"],
    [12, "mo"],
    [Number.POSITIVE_INFINITY, "y"],
  ];
  let value = secs;
  let unit = "s";
  for (const [div, label] of units) {
    if (value < div) {
      unit = label;
      break;
    }
    value = Math.floor(value / div);
    unit = label;
  }
  return value <= 0 ? "now" : `${value}${unit} ago`;
}

export function formatSalary(salary?: {
  min?: number;
  max?: number;
  currency?: string;
  period?: string;
}): string {
  if (!salary || (!salary.min && !salary.max)) return "Not disclosed";
  const cur = salary.currency ?? "INR";
  const fmt = (n?: number) =>
    n ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n) : "";
  const range = salary.max ? `${fmt(salary.min)}–${fmt(salary.max)}` : fmt(salary.min);
  return `${cur} ${range}/${salary.period ?? "month"}`;
}
