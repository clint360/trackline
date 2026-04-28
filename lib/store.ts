// Client-side in-memory store using localStorage for persistence.
// Used by /admin and /dashboard. The booking flow itself uses mock APIs.
"use client";

import {
  AGENCIES,
  BUS_TEMPLATES,
  CITIES,
  ROUTES,
  SCHEDULES,
} from "./mock-data";
import type {
  Agency,
  Booking,
  BusTemplate,
  City,
  Route,
  Schedule,
  Trip,
} from "./types";

const KEY = "trackline:store:v1";

export interface Store {
  cities: City[];
  agencies: Agency[];
  busTemplates: BusTemplate[];
  routes: Route[];
  schedules: Schedule[];
  trips: Trip[];
  bookings: Booking[];
  citiesArchived: string[];
}

function defaultStore(): Store {
  return {
    cities: [...CITIES],
    agencies: [...AGENCIES],
    busTemplates: [...BUS_TEMPLATES],
    routes: [...ROUTES],
    schedules: [...SCHEDULES],
    trips: [],
    bookings: [],
    citiesArchived: [],
  };
}

export function loadStore(): Store {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultStore();
    const data = JSON.parse(raw);
    // Merge with defaults so newly added defaults are included
    return { ...defaultStore(), ...data };
  } catch {
    return defaultStore();
  }
}

export function saveStore(s: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function resetStore() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
