import { Suspense } from "react";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const dynamic = "force-dynamic";

async function getSession() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    return (
      <main className="container py-6">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
        <div className="bg-destructive/10 p-4 rounded-md">
          <p className="text-destructive">
            You must be logged in to access this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-6">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <AdminPanel userId={session.user.id} />
      </Suspense>
    </main>
  );
}
