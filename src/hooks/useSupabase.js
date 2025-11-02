import { createBrowserClient } from "@supabase/ssr";
import { useAuthState } from "./useAuthState";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function useSupabase() {
  const authState = useAuthState();

  return {
    supabase,
    session: authState.session,
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
  };
}
