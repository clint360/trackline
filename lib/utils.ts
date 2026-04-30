import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Convert "HH:mm" (24h) → "h:mm AM/PM" (12h).
export function formatTime(time: string): string {
  if (!/^\d{2}:\d{2}$/.test(time)) return time;
  const [hStr, m] = time.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function generateConsignment(fromCode: string, toCode: string): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `TRP-${fromCode}-${toCode}-${n}`;
}

// Deterministic pseudo-random for stable mock data per id
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickAvailability(seatsLeft: number, total: number) {
  const ratio = seatsLeft / total;
  if (ratio < 0.2) return "Almost full" as const;
  if (ratio < 0.5) return "Fast filling" as const;
  return "Available" as const;
}

/** Check if a trip (date + time) is in the past */
export function isTripExpired(date: string, time: string): boolean {
  const now = new Date();
  const [h, m] = time.split(":").map(Number);
  const tripDate = new Date(date + "T" + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":00");
  return tripDate < now;
}
