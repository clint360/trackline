// Map between Supabase row shape (snake_case) and the app's domain types.
import type {
  Agency,
  Booking,
  BusTemplate,
  City,
  DropOff,
  Route,
  Schedule,
  SearchedTrip,
  Trip,
} from "@/lib/types";

export function rowToCity(r: any, dropoffs: any[] = []): City {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    active: r.active,
    dropOffs: dropoffs.map(rowToDropOff),
  };
}

export function rowToDropOff(r: any): DropOff {
  return { id: r.id, name: r.name };
}

export function rowToAgency(r: any): Agency {
  return {
    id: r.id,
    name: r.name,
    logoColor: r.logo_color,
    imageUrl: r.image_url ?? undefined,
  };
}

export function rowToBusTemplate(r: any): BusTemplate {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    layout: r.layout,
    locked: r.locked,
  };
}

export function rowToRoute(r: any): Route {
  return {
    id: r.id,
    fromCityId: r.from_city_id,
    toCityId: r.to_city_id,
  };
}

export function rowToSchedule(r: any): Schedule {
  return { id: r.id, time: r.time, label: r.label ?? undefined };
}

export function rowToTrip(r: any): Trip {
  const dateStr =
    typeof r.date === "string" && r.date
      ? r.date
      : r.date
        ? new Date(r.date).toISOString().slice(0, 10)
        : "";
  return {
    id: r.id,
    agencyId: r.agency_id,
    routeId: r.route_id,
    busTemplateId: r.bus_template_id,
    date: dateStr,
    time: r.time,
    priceRegular: r.price_regular,
    priceVip: r.price_vip,
    takenSeats: r.taken_seats ?? [],
    dropOffId: r.drop_off_id ?? undefined,
  };
}

export function rowToBooking(r: any): Booking {
  return {
    consignment: r.consignment,
    tripId: r.trip_id,
    passenger: {
      fullName: r.passenger_name,
      phone: r.passenger_phone,
      email: r.passenger_email ?? undefined,
    },
    seat: r.seat,
    seatClass: r.seat_class,
    amount: r.amount,
    paymentMethod: r.payment_method,
    paymentTransId: r.payment_trans_id ?? undefined,
    status: r.status,
    dropOff: r.drop_off ?? undefined,
    createdAt: r.created_at,
  };
}

// ---- Inverse: app → DB row ----

export function cityToRow(c: Partial<City>) {
  const r: Record<string, any> = {};
  if (c.id) r.id = c.id;
  if (c.name !== undefined) r.name = c.name;
  if (c.code !== undefined) r.code = c.code;
  if (c.active !== undefined) r.active = c.active;
  return r;
}

export function agencyToRow(a: Partial<Agency>) {
  const r: Record<string, any> = {};
  if (a.id) r.id = a.id;
  if (a.name !== undefined) r.name = a.name;
  if (a.logoColor !== undefined) r.logo_color = a.logoColor;
  if (a.imageUrl !== undefined) r.image_url = a.imageUrl ?? null;
  return r;
}

export function templateToRow(t: Partial<BusTemplate>) {
  const r: Record<string, any> = {};
  if (t.id) r.id = t.id;
  if (t.name !== undefined) r.name = t.name;
  if (t.type !== undefined) r.type = t.type;
  if (t.layout !== undefined) r.layout = t.layout;
  if (t.locked !== undefined) r.locked = t.locked;
  return r;
}

export function routeToRow(r: Partial<Route>) {
  const o: Record<string, any> = {};
  if (r.id) o.id = r.id;
  if (r.fromCityId !== undefined) o.from_city_id = r.fromCityId;
  if (r.toCityId !== undefined) o.to_city_id = r.toCityId;
  return o;
}

export function scheduleToRow(s: Partial<Schedule>) {
  const r: Record<string, any> = {};
  if (s.id) r.id = s.id;
  if (s.time !== undefined) r.time = s.time;
  if (s.label !== undefined) r.label = s.label ?? null;
  return r;
}

export function tripToRow(t: Partial<Trip>) {
  const r: Record<string, any> = {};
  if (t.id) r.id = t.id;
  if (t.agencyId !== undefined) r.agency_id = t.agencyId;
  if (t.routeId !== undefined) r.route_id = t.routeId;
  if (t.busTemplateId !== undefined) r.bus_template_id = t.busTemplateId;
  if (t.date !== undefined) r.date = t.date;
  if (t.time !== undefined) r.time = t.time;
  if (t.priceRegular !== undefined) r.price_regular = t.priceRegular;
  if (t.priceVip !== undefined) r.price_vip = t.priceVip;
  if (t.takenSeats !== undefined) r.taken_seats = t.takenSeats;
  if (t.dropOffId !== undefined) r.drop_off_id = t.dropOffId ?? null;
  return r;
}

export type SearchedTripRow = SearchedTrip;
