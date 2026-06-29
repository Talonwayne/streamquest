import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore.
        }
      },
    },
  });
}

export async function createServiceClient() {
  const key = getSupabaseServiceRoleKey();
  if (!key || key === "placeholder-service-key") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is not configured"
    );
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(getSupabaseUrl(), key);
}
