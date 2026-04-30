// Server-side Supabase client. Uses the service-role key, which bypasses
// RLS — NEVER expose this to the browser. Used by API routes that need
// to write bookings and reconcile payments.

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!URL || !SERVICE_ROLE) return null;
  if (!client) {
    client = createClient(URL, SERVICE_ROLE, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return client;
}

export const SUPABASE_ADMIN_LIVE = Boolean(URL && SERVICE_ROLE);
