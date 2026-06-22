import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold">Your account</h1>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-black/60 dark:text-white/60">Email</dt>
        <dd>{user.email}</dd>
        <dt className="text-black/60 dark:text-white/60">User ID</dt>
        <dd className="font-mono text-xs">{user.id}</dd>
      </dl>

      <form action="/auth/signout" method="post" className="mt-8">
        <button
          type="submit"
          className="rounded-lg border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/15"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
