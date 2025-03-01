import { Suspense } from "react";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { SettingsContent } from "@/components/settings/SettingsContent";

export const dynamic = "force-dynamic";

async function getSession() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return (
    <main className="container py-6">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SettingsContent />
      </Suspense>
    </main>
  );
}
