"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Bus, Ticket as TicketIcon } from "lucide-react";
import type { SearchedTrip, SeatClass } from "@/lib/types";
import type { PassengerForm, PaymentForm, RouteForm } from "@/lib/schemas";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { StepIndicator } from "./StepIndicator";
import { Ticket, type TicketData } from "./Ticket";
import { TicketLookupModal } from "./TicketLookupModal";
import { RouteStep } from "./steps/RouteStep";
import { TripStep } from "./steps/TripStep";
import { SeatStep } from "./steps/SeatStep";
import { PassengerStep } from "./steps/PassengerStep";
import { PaymentStep } from "./steps/PaymentStep";
import { TicketStep } from "./steps/TicketStep";

interface BookingState {
  route?: RouteForm;
  trip?: SearchedTrip;
  seatClass?: SeatClass;
  seat?: string;
  passenger?: PassengerForm;
  payment?: PaymentForm;
  ticket?: TicketData;
}

const TICKET_KEY = "trackline:lastTicket";

function saveLastTicket(ticket: TicketData) {
  try {
    localStorage.setItem(
      TICKET_KEY,
      JSON.stringify({ ticket, savedAt: Date.now() })
    );
  } catch {}
}

function loadLastTicket(): TicketData | null {
  try {
    const raw = localStorage.getItem(TICKET_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    // Keep tickets for 24h after issue â€” past that, the booking still exists
    // server-side but the in-flow experience is over. They can lookup by
    // consignment to retrieve it.
    if (Date.now() - (j.savedAt ?? 0) > 24 * 60 * 60 * 1000) return null;
    return j.ticket as TicketData;
  } catch {
    return null;
  }
}

function clearLastTicket() {
  try {
    localStorage.removeItem(TICKET_KEY);
  } catch {}
}

export function BookingFlow() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<BookingState>({});
  const [ticketLookupOpen, setTicketLookupOpen] = useState(false);
  const { t } = useI18n();

  // Recover last completed ticket on mount so a refresh on the success screen
  // still shows the ticket instead of resetting the user to step 0.
  useEffect(() => {
    const t = loadLastTicket();
    if (t) {
      setState({ ticket: t });
      setStep(5);
    }
  }, []);

  const goNext = () => setStep((s) => Math.min(s + 1, 5));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const STEPS = [
    { key: "route", label: t("step_route") },
    { key: "trip", label: t("step_trip") },
    { key: "seat", label: t("step_seat") },
    { key: "passenger", label: t("step_passenger") },
    { key: "payment", label: t("step_payment") },
    { key: "ticket", label: t("step_ticket") },
  ];

  const handleTicketSuccess = (ticket: TicketData) => {
    saveLastTicket(ticket);
    setState({ ...state, ticket });
    goNext();
  };

  const restart = () => {
    clearLastTicket();
    setState({});
    setStep(0);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-2xl bg-brand-gradient text-white flex items-center justify-center shadow-glow">
            <Bus className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-ink-900 leading-none">Trackline</h1>
            <p className="text-[11px] text-ink-500 truncate">{t("brand_tagline")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setTicketLookupOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-700 shadow-soft hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-700 transition"
          >
            <TicketIcon className="h-3.5 w-3.5" />
            <span>{t("check_ticket")}</span>
          </button>
          <LanguageToggle />
        </div>
      </header>

      {/* Progress */}
      <div className="card p-5 sm:p-6 mb-6">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      <div className="relative">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
          >
            {step === 0 && (
              <RouteStep
                initial={state.route}
                onSubmit={(r) => {
                  setState({ ...state, route: r });
                  goNext();
                }}
              />
            )}
            {step === 1 && state.route && (
              <TripStep
                route={state.route}
                onBack={goBack}
                onSelect={(trip, klass) => {
                  setState({ ...state, trip, seatClass: klass });
                  goNext();
                }}
              />
            )}
            {step === 2 && state.trip && state.seatClass && (
              <SeatStep
                trip={state.trip}
                seatClass={state.seatClass}
                initialSeat={state.seat}
                onBack={goBack}
                onSelect={(seat) => {
                  setState({ ...state, seat });
                  goNext();
                }}
              />
            )}
            {step === 3 && state.seat && state.trip && state.seatClass && (
              <PassengerStep
                initial={state.passenger}
                onBack={goBack}
                onSubmit={(p) => {
                  setState({ ...state, passenger: p });
                  goNext();
                }}
              />
            )}
            {step === 4 &&
              state.trip &&
              state.seat &&
              state.seatClass &&
              state.passenger && (
                <PaymentStep
                  trip={state.trip}
                  seat={state.seat}
                  seatClass={state.seatClass}
                  passenger={state.passenger}
                  onBack={goBack}
                  onSuccess={handleTicketSuccess}
                />
              )}
            {step === 5 && state.ticket && (
              <TicketStep ticket={state.ticket} onRestart={restart} />
            )}
            {/* Fallback: if step requires data that’s missing, auto-rewind */}
            {step === 3 && !(state.seat && state.trip && state.seatClass) && (
              <div className="card p-8 text-center">
                <p className="text-ink-600 font-medium">Please select a seat first</p>
                <button onClick={goBack} className="btn-primary mt-4 text-sm">Go back</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <TicketLookupModal
        open={ticketLookupOpen}
        onClose={() => setTicketLookupOpen(false)}
      />
    </div>
  );
}

