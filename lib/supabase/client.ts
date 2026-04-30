// Browser-side Supabase client. Uses the public anon key — RLS policies
// must be in place on every table before going to production.
//
// Falls back to `null` when env vars aren't set so the app still boots
// in localStorage-only mode during the migration.

"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!URL || !ANON) return null;
  if (!client) {
    client = createClient(URL, ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export const SUPABASE_LIVE = Boolean(URL && ANON);
