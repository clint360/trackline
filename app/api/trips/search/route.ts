import { NextResponse } from "next/server";
import {
  AGENCIES,
  BUS_TEMPLATES,
  CITIES,
  generateTripsForRoute,
  getAgencyById,
  getBusTemplateById,
  getCityById,
} from "@/lib/mock-data";
import { pickAvailability } from "@/lib/utils";
import type { SearchedTrip } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromCityId = searchParams.get("fromCityId") ?? "";
  const toCityId = searchParams.get("toCityId") ?? "";
  const date = searchParams.get("date") ?? "";

  const fromCity = getCityById(fromCityId);
  const toCity = getCityById(toCityId);
  if (!fromCity || !toCity) {
    return NextResponse.json({ error: "Invalid cities" }, { status: 400 });
  }
  if (fromCity.id === toCity.id) {
    return NextResponse.json({ error: "Same city" }, { status: 400 });
  }

  // Simulate latency
  await new Promise((r) => setTimeout(r, 600));

  const raw = generateTripsForRoute(fromCity.code, toCity.code, date);
  const trips: SearchedTrip[] = raw.map((t) => {
    const agency = getAgencyById(t.agencyId)!;
    const tpl = getBusTemplateById(t.busTemplateId)!;
    const dropOff = t.dropOffId
      ? toCity.dropOffs?.find((d) => d.id === t.dropOffId)
      : undefined;
    return {
      ...t,
      agency,
      fromCity,
      toCity,
      busTemplate: tpl,
      dropOff,
      availabilityLabel: pickAvailability(t.seatsLeft ?? 0, t.total ?? 1),
    };
  });

  return NextResponse.json({ trips });
}
