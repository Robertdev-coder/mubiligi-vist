import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const KIGALI_TZ = "Africa/Kigali";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayKigali(): string {
  return formatInTimeZone(new Date(), KIGALI_TZ, "yyyy-MM-dd");
}

export function kigaliNow(): Date {
  return toZonedTime(new Date(), KIGALI_TZ);
}

export function formatDateKigali(
  value: string | Date | null | undefined,
  pattern = "dd MMM yyyy",
): string {
  if (!value) return "—";
  try {
    const date = typeof value === "string" ? parseISO(value) : value;
    return formatInTimeZone(date, KIGALI_TZ, pattern);
  } catch {
    return "—";
  }
}

export function formatDateTimeKigali(value: string | Date | null | undefined): string {
  return formatDateKigali(value, "dd MMM yyyy, HH:mm");
}

export function formatTimeKigali(value: string | Date | null | undefined): string {
  return formatDateKigali(value, "HH:mm");
}

export function formatLongDateKigali(value: string | Date | null | undefined): string {
  return formatDateKigali(value, "EEEE, dd MMMM yyyy");
}

export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  try {
    const date = typeof value === "string" ? parseISO(value) : value;
    return format(date, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

export function toDateTimeLocalKigali(value: string | Date | null | undefined): string {
  if (!value) return "";
  try {
    const date = typeof value === "string" ? parseISO(value) : value;
    return formatInTimeZone(date, KIGALI_TZ, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+250")) return digits;
  if (digits.startsWith("250")) return `+${digits}`;
  if (digits.startsWith("0")) return `+250${digits.slice(1)}`;
  if (/^7[2389]\d{7}$/.test(digits)) return `+250${digits}`;
  return digits;
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return "•••••";
  return `${phone.slice(0, 5)}•••${phone.slice(-3)}`;
}

export function generateReferenceCode(): string {
  const year = new Date().getFullYear();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  const code = Array.from(bytes)
    .map((b) => alphabet[b % alphabet.length])
    .join("");
  return `MVD-${year}-${code}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(value: string, length = 60): string {
  return value.length > length ? `${value.slice(0, length).trimEnd()}…` : value;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function classNamesForTrade(trade: string, level: string): string {
  return `${trade} ${level}`;
}

export function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) lines.push(row.map(csvEscape).join(","));
  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function attendanceProgress(arrived: number, expected: number): number {
  if (expected <= 0) return 0;
  return Math.min(100, Math.round((arrived / expected) * 100));
}

export function isRegistrationOpen(visitDay: {
  is_active: boolean;
  registration_open: string;
  registration_close: string;
}): boolean {
  if (!visitDay.is_active) return false;
  const now = Date.now();
  return (
    new Date(visitDay.registration_open).getTime() <= now &&
    new Date(visitDay.registration_close).getTime() >= now
  );
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
