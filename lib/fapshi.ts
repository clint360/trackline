// Fapshi server-side client.
//
// In production, set these env vars:
//   FAPSHI_BASE_URL   = https://live.fapshi.com  (or https://sandbox.fapshi.com)
//   FAPSHI_API_USER   = <your apiuser header>
//   FAPSHI_API_KEY    = <your apikey header>
//
// When the keys aren't set we fall through to a deterministic mock so the
// payment flow stays testable in dev. The mock walks transactions through
// PENDING → SUCCESSFUL after ~6s, but FAILS for phones ending in "0000".

import "server-only";
import type { PaymentStatus } from "./types";

const BASE_URL = process.env.FAPSHI_BASE_URL ?? "";
const API_USER = process.env.FAPSHI_API_USER ?? "";
const API_KEY = process.env.FAPSHI_API_KEY ?? "";

export const FAPSHI_LIVE = Boolean(BASE_URL && API_USER && API_KEY);

interface DirectPayInput {
  /** Amount in FCFA (XAF). Must be a positive integer. */
  amount: number;
  /** Payer's mobile money number — 9 digits, no country code. */
  phone: string;
  /** Operator hint. Optional; Fapshi can detect from the phone prefix. */
  medium?: "mobile money" | "orange money";
  /** Display name shown in transaction history. */
  userName?: string;
  /** Reference your system uses to reconcile (e.g. consignment). */
  externalId?: string;
  /** Short description sent to the payer. */
  message?: string;
  /** Email for receipt. */
  email?: string;
}

export interface DirectPayResponse {
  transId: string;
  status: PaymentStatus;
  message: string;
  dateInitiated: string;
}

export interface PaymentStatusResponse {
  transId: string;
  status: PaymentStatus;
  amount: number;
  externalId?: string;
  medium?: string;
  payerName?: string;
  email?: string;
  message?: string;
  dateInitiated?: string;
  dateConfirmed?: string;
}

// ---- Mock store (in-memory, dev-only) ----
const mockTxns = new Map<
  string,
  PaymentStatusResponse & { initiatedAt: number; willFail: boolean }
>();

function mockTransId() {
  return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePhone(p: string) {
  // strip +237, spaces, dashes — Fapshi expects 9 digits
  return p.replace(/^\+?237/, "").replace(/\D/g, "").trim();
}

// ---- Public API ----

export async function fapshiDirectPay(
  input: DirectPayInput
): Promise<DirectPayResponse> {
  const phone = normalizePhone(input.phone);
  if (phone.length !== 9) {
    throw new Error("Phone must be 9 digits (Cameroon)");
  }
  if (!Number.isInteger(input.amount) || input.amount < 100) {
    throw new Error("Amount must be a positive integer ≥ 100 FCFA");
  }

  if (FAPSHI_LIVE) {
    const res = await fetch(`${BASE_URL}/direct-pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiuser: API_USER,
        apikey: API_KEY,
      },
      body: JSON.stringify({
        amount: input.amount,
        phone,
        medium: input.medium,
        name: input.userName,
        email: input.email,
        userName: input.userName,
        externalId: input.externalId,
        message: input.message,
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Fapshi direct-pay failed (${res.status}) ${txt}`);
    }
    const j = (await res.json()) as DirectPayResponse;
    return j;
  }

  // ---- Mock ----
  const transId = mockTransId();
  const willFail = phone.endsWith("0000");
  const now = Date.now();
  const record: PaymentStatusResponse & {
    initiatedAt: number;
    willFail: boolean;
  } = {
    transId,
    status: "PENDING",
    amount: input.amount,
    externalId: input.externalId,
    medium: input.medium,
    payerName: input.userName,
    email: input.email,
    message: input.message,
    dateInitiated: new Date(now).toISOString(),
    initiatedAt: now,
    willFail,
  };
  mockTxns.set(transId, record);
  return {
    transId,
    status: "PENDING",
    message: "Accepted. Awaiting payer confirmation.",
    dateInitiated: record.dateInitiated!,
  };
}

export async function fapshiPaymentStatus(
  transId: string
): Promise<PaymentStatusResponse> {
  if (FAPSHI_LIVE) {
    const res = await fetch(`${BASE_URL}/payment-status/${transId}`, {
      headers: {
        apiuser: API_USER,
        apikey: API_KEY,
      },
      // status endpoint changes — never cache
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Fapshi payment-status failed (${res.status}) ${txt}`);
    }
    return (await res.json()) as PaymentStatusResponse;
  }

  // ---- Mock state machine ----
  const rec = mockTxns.get(transId);
  if (!rec) {
    throw new Error("Unknown transaction");
  }
  const elapsed = Date.now() - rec.initiatedAt;
  // Resolve after ~6s
  if (elapsed > 6000) {
    rec.status = rec.willFail ? "FAILED" : "SUCCESSFUL";
    rec.dateConfirmed = new Date().toISOString();
  }
  return { ...rec };
}
