// Core domain types for Trackline

export type SeatClass = "VIP" | "Regular";

export type SeatCell = string | null | "driver";
// Layout: rows of cells. null = aisle/empty, "driver" = driver seat, string = seat label.
export type SeatLayout = SeatCell[][];

export interface DropOff {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  code: string; // 3-letter code e.g. YDE
  active: boolean;
  dropOffs: DropOff[]; // drop-offs within / around the city
}

export interface Agency {
  id: string;
  name: string;
  logoColor: string; // gradient classes e.g. "from-indigo-500 to-violet-500"
  imageUrl?: string; // profile picture / logo (data URL or remote URL)
}

export interface BusTemplate {
  id: string;
  name: string;
  type: SeatClass;
  layout: SeatLayout;
  locked?: boolean; // locked once bookings exist
}

export interface Route {
  id: string;
  fromCityId: string;
  toCityId: string;
}

export interface Schedule {
  id: string;
  time: string; // HH:mm
  label?: string;
}

export interface Trip {
  id: string;
  agencyId: string;
  routeId: string;
  busTemplateId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  priceRegular: number; // FCFA
  priceVip: number; // FCFA
  takenSeats: string[];
  dropOffId?: string; // drop-off within toCity (undefined = city center default)
  seatsLeft?: number;
  total?: number;
}

export interface SearchedTrip extends Trip {
  agency: Agency;
  fromCity: City;
  toCity: City;
  busTemplate: BusTemplate;
  dropOff?: DropOff; // resolved from dropOffId
  availabilityLabel: "Almost full" | "Fast filling" | "Available";
}

export interface PassengerInfo {
  fullName: string;
  phone: string;
  email?: string;
}

export type PaymentStatus =
  | "PENDING"
  | "SUCCESSFUL"
  | "FAILED"
  | "EXPIRED";

export interface Booking {
  consignment: string;
  tripId: string;
  passenger: PassengerInfo;
  seat: string;
  seatClass: SeatClass;
  amount: number;
  paymentMethod: "MTN" | "ORANGE";
  status: "valid" | "used" | "cancelled";
  dropOff?: string; // resolved drop-off label
  createdAt: string;
  paymentTransId?: string; // Fapshi transId for reconciliation
}
