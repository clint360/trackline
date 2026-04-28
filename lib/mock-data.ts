import type {
  Agency,
  BusTemplate,
  City,
  Route,
  Schedule,
  SeatLayout,
  Trip,
} from "./types";

// ---- Cities (with drop-off locations) ----
export const CITIES: City[] = [
  {
    id: "c-yde",
    name: "Yaounde",
    code: "YDE",
    active: true,
    dropOffs: [
      { id: "d-yde-mvan", name: "Yaounde — Mvan" },
      { id: "d-yde-nsam", name: "Yaounde — Nsam" },
      { id: "d-yde-mokolo", name: "Yaounde — Mokolo" },
    ],
  },
  {
    id: "c-dla",
    name: "Douala",
    code: "DLA",
    active: true,
    dropOffs: [
      { id: "d-dla-bonaberi", name: "Douala — Bonaberi" },
      { id: "d-dla-akwa", name: "Douala — Akwa" },
      { id: "d-dla-ndokoti", name: "Douala — Ndokoti" },
    ],
  },
  {
    id: "c-bda",
    name: "Bamenda",
    code: "BDA",
    active: true,
    dropOffs: [
      { id: "d-bda-bambui", name: "Bamenda — Bambui" },
      { id: "d-bda-mile4", name: "Bamenda — Mile 4" },
      { id: "d-bda-cmtn", name: "Bamenda — Commercial Avenue" },
    ],
  },
  {
    id: "c-bua",
    name: "Buea",
    code: "BUA",
    active: true,
    dropOffs: [
      { id: "d-bua-mile17", name: "Buea — Mile 17" },
      { id: "d-bua-molyko", name: "Buea — Molyko" },
    ],
  },
];

// ---- Agencies ----
export const AGENCIES: Agency[] = [
  { id: "a-finex", name: "Finexs Voyages", logoColor: "from-indigo-500 to-violet-500" },
  { id: "a-musango", name: "Musango Express", logoColor: "from-amber-500 to-orange-500" },
  { id: "a-vatican", name: "Vatican Express", logoColor: "from-rose-500 to-pink-500" },
  { id: "a-buca", name: "Buca Voyages", logoColor: "from-emerald-500 to-teal-500" },
  { id: "a-united", name: "United Express", logoColor: "from-sky-500 to-blue-500" },
];

// ---- Default seat layouts ----
// VIP: 1+2 abreast, more legroom
export const VIP_LAYOUT: SeatLayout = [
  ["driver", null, null, "1A"],
  ["2A", null, "2B", "2C"],
  ["3A", null, "3B", "3C"],
  ["4A", null, "4B", "4C"],
  ["5A", null, "5B", "5C"],
  ["6A", null, "6B", "6C"],
  ["7A", null, "7B", "7C"],
  ["8A", "8B", "8C", "8D"],
];

// Regular: 2+2 abreast
export const REGULAR_LAYOUT: SeatLayout = [
  ["driver", null, null, null, "1A"],
  ["2A", "2B", null, "2C", "2D"],
  ["3A", "3B", null, "3C", "3D"],
  ["4A", "4B", null, "4C", "4D"],
  ["5A", "5B", null, "5C", "5D"],
  ["6A", "6B", null, "6C", "6D"],
  ["7A", "7B", null, "7C", "7D"],
  ["8A", "8B", null, "8C", "8D"],
  ["9A", "9B", "9C", "9D", "9E"],
];

export const BUS_TEMPLATES: BusTemplate[] = [
  { id: "bt-vip", name: "VIP Coach 30", type: "VIP", layout: VIP_LAYOUT },
  { id: "bt-reg", name: "Regular Coach 70", type: "Regular", layout: REGULAR_LAYOUT },
];

// ---- Routes (all city pairs) ----
function buildRoutes(): Route[] {
  const routes: Route[] = [];
  for (const a of CITIES) {
    for (const b of CITIES) {
      if (a.id === b.id) continue;
      routes.push({ id: `r-${a.code}-${b.code}`, fromCityId: a.id, toCityId: b.id });
    }
  }
  return routes;
}
export const ROUTES: Route[] = buildRoutes();

export const SCHEDULES: Schedule[] = [
  { id: "s-06", time: "06:00", label: "Morning" },
  { id: "s-08", time: "08:30", label: "Morning" },
  { id: "s-11", time: "11:00", label: "Midday" },
  { id: "s-14", time: "14:00", label: "Afternoon" },
  { id: "s-17", time: "17:30", label: "Evening" },
  { id: "s-20", time: "20:00", label: "Night" },
];

// ---- Pricing matrix (FCFA) ----
const PRICE_MATRIX: Record<string, { regular: number; vip: number }> = {
  "YDE-DLA": { regular: 4000, vip: 7500 },
  "DLA-YDE": { regular: 4000, vip: 7500 },
  "YDE-BDA": { regular: 6500, vip: 12000 },
  "BDA-YDE": { regular: 6500, vip: 12000 },
  "YDE-BUA": { regular: 6000, vip: 11000 },
  "BUA-YDE": { regular: 6000, vip: 11000 },
  "DLA-BDA": { regular: 5500, vip: 10000 },
  "BDA-DLA": { regular: 5500, vip: 10000 },
  "DLA-BUA": { regular: 2500, vip: 5000 },
  "BUA-DLA": { regular: 2500, vip: 5000 },
  "BDA-BUA": { regular: 4500, vip: 8500 },
  "BUA-BDA": { regular: 4500, vip: 8500 },
};

export function priceFor(fromCode: string, toCode: string) {
  return PRICE_MATRIX[`${fromCode}-${toCode}`] ?? { regular: 5000, vip: 9500 };
}

// Generate trips deterministically for a given route+date
import { seededRandom } from "./utils";

export function listSeatLabels(layout: SeatLayout): string[] {
  const seats: string[] = [];
  for (const row of layout) {
    for (const cell of row) {
      if (cell && cell !== "driver") seats.push(cell);
    }
  }
  return seats;
}

export function generateTripsForRoute(
  fromCode: string,
  toCode: string,
  date: string
): (Trip & { agencyId: string })[] {
  const rand = seededRandom(`${fromCode}-${toCode}-${date}`);
  const price = priceFor(fromCode, toCode);
  const trips: Trip[] = [];
  const toCity = getCityByCode(toCode);

  // Generate ~5-7 trips
  const count = 5 + Math.floor(rand() * 2);
  const usedSchedules = new Set<string>();

  for (let i = 0; i < count; i++) {
    let sched = SCHEDULES[Math.floor(rand() * SCHEDULES.length)];
    let safety = 0;
    while (usedSchedules.has(sched.id) && safety < 10) {
      sched = SCHEDULES[Math.floor(rand() * SCHEDULES.length)];
      safety++;
    }
    usedSchedules.add(sched.id);
    const agency = AGENCIES[Math.floor(rand() * AGENCIES.length)];
    const isVip = rand() > 0.4;
    const tpl = isVip ? BUS_TEMPLATES[0] : BUS_TEMPLATES[1];
    const allSeats = listSeatLabels(tpl.layout);
    const total = allSeats.length;
    // Random taken seats
    const takenCount = Math.floor(rand() * (total * 0.7));
    const taken = new Set<string>();
    while (taken.size < takenCount) {
      taken.add(allSeats[Math.floor(rand() * total)]);
    }
    // Pick a drop-off in the destination city, if any. ~25% chance of city-center default.
    let dropOffId: string | undefined;
    if (toCity?.dropOffs?.length && rand() > 0.25) {
      dropOffId = toCity.dropOffs[Math.floor(rand() * toCity.dropOffs.length)].id;
    }
    trips.push({
      id: `t-${fromCode}-${toCode}-${date}-${i}`,
      agencyId: agency.id,
      routeId: `r-${fromCode}-${toCode}`,
      busTemplateId: tpl.id,
      date,
      time: sched.time,
      priceRegular: price.regular + Math.floor(rand() * 1000),
      priceVip: price.vip + Math.floor(rand() * 1500),
      takenSeats: Array.from(taken),
      dropOffId,
      seatsLeft: total - taken.size,
      total,
    });
  }

  // Sort by departure time
  trips.sort((a, b) => a.time.localeCompare(b.time));
  return trips;
}

export function getCityByCode(code: string) {
  return CITIES.find((c) => c.code === code);
}

export function getCityById(id: string) {
  return CITIES.find((c) => c.id === id);
}

export function getAgencyById(id: string) {
  return AGENCIES.find((a) => a.id === id);
}

export function getBusTemplateById(id: string) {
  return BUS_TEMPLATES.find((b) => b.id === id);
}
