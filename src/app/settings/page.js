import { Suspense } from "react";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { SettingsContent } from "@/components/features/settings/SettingsContent";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
      <LanguageProvider>
        <SettingsContent />
      </LanguageProvider>
    </main>
  );
}
