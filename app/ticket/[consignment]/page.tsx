"use client";

import { Ticket, type TicketData } from "@/components/booking/Ticket";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function TicketLookupPage({
  params,
}: {
  params: Promise<{ consignment: string }>;
}) {
  const { consignment } = use(params);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`/api/tickets/${consignment}`);
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "Not found");
        if (!cancel) {
          setTicket({
            consignment: j.ticket.consignment,
            passengerName: j.ticket.passengerName,
            fromCode: j.ticket.fromCode,
            toCode: j.ticket.toCode,
            fromName: j.ticket.fromName,
            toName: j.ticket.toName,
            agencyName: j.ticket.agencyName,
            date: j.ticket.date,
            time: j.ticket.time,
            seat: j.ticket.seat,
            seatClass: j.ticket.seatClass,
            amount: j.ticket.amount,
            status: j.ticket.status,
            dropOff: j.ticket.dropOff ?? undefined,
          });
        }
      } catch (e: any) {
        if (!cancel) setError(e.message);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [consignment]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-ink-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-brand-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Trackline
        </Link>

        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-widest text-ink-400 font-semibold">
            Ticket lookup
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 mt-1">
            {consignment}
          </h1>
        </div>

        {!ticket && !error && (
          <div className="max-w-md mx-auto space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {error && (
          <div className="card p-8 text-center text-rose-600">
            Could not find ticket {consignment}.
          </div>
        )}

        {ticket && <Ticket data={ticket} />}
      </div>
    </main>
  );
}
