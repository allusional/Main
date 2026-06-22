import { createClient } from "@/lib/supabase/server";

// Returns the currently authenticated Supabase user, or null. Use in Server
// Components and Route Handlers to gate access.
export async function getCurrentUser() {
  // No Supabase configured (Phase 0 / demo) → treat as signed out.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
