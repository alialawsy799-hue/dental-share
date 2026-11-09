import { CLINIC_TIMEZONE } from "./types";

const LATIN = { numberingSystem: "latn" } as const;

export function formatIqd(amount: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} د.ع`;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("ar-IQ", {
    ...LATIN,
    timeZone: CLINIC_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDay(isoDate: string): string {
  return new Intl.DateTimeFormat("ar-IQ", {
    ...LATIN,
    timeZone: CLINIC_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${isoDate}T12:00:00+03:00`));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ar-IQ", {
    ...LATIN,
    timeZone: CLINIC_TIMEZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function dateKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return parts;
}

export function weekContaining(isoDate: string): string[] {
  const base = new Date(`${isoDate}T12:00:00Z`);
  const day = base.getUTCDay();
  const daysSinceSaturday = (day + 1) % 7;
  const start = new Date(base);
  start.setUTCDate(start.getUTCDate() - daysSinceSaturday);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(start);
    next.setUTCDate(start.getUTCDate() + index);
    return next.toISOString().slice(0, 10);
  });
}

export function baghdadIso(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  return `${date}T${time}:00+03:00`;
}
