import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * User context ile Supabase client oluşturucu
 * User authentication'a ihtiyaç olan operasyonlar için
 * Next.js 15 asenkron çerez yapısına uygun hale getirildi.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (error) {
            // Server Component içinde çerez set etmek bazen kısıtlıdır.
            // Bu hata genellikle Middleware tarafından yönetildiği için debug edilebilir.
            console.debug("Supabase SSR cookie setAll warning:", error.message);
          }
        },
      },
    },
  );
}

/**
 * Service role ile Supabase admin client oluşturucu
 * Backend operasyonları için (RLS bypass'i)
 * UYARI: Service role key hiçbir zaman client-side'da expose edilmemelidir
 */
export function createServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable not set");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
