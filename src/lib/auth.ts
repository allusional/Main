import { createClient } from "@/lib/supabase/server";

// Returns the currently authenticated Supabase user, or null. Use in Server
// Components and Route Handlers to gate access.
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
