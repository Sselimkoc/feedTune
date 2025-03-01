"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

export function LogoMigrationProvider({ children }) {
  const [migrationComplete, setMigrationComplete] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const migrateLogos = async () => {
      try {
        // Kullanıcı oturumunu kontrol et
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;

        // Daha önce migrate edilmiş mi kontrol et
        const { data: migrationData } = await supabase
          .from("settings")
          .select("*")
          .eq("key", "logo_migration_completed")
          .single();

        if (migrationData) {
          setMigrationComplete(true);
          return;
        }

        // YouTube feed'lerini ve ilgili logoları al
        const { data: youtubeFeeds, error: feedsError } = await supabase
          .from("youtube_feeds")
          .select("id, channel_avatar");

        if (feedsError) {
          console.error("Error fetching YouTube feeds:", feedsError);
          return;
        }

        // Her YouTube feed için logo bilgisini feeds tablosuna aktar
        let updatedCount = 0;

        for (const feed of youtubeFeeds) {
          if (feed.channel_avatar) {
            const { error: updateError } = await supabase
              .from("feeds")
              .update({ site_favicon: feed.channel_avatar })
              .eq("id", feed.id);

            if (!updateError) {
              updatedCount++;
            }
          }
        }

        // Migration tamamlandı olarak işaretle
        await supabase
          .from("settings")
          .insert([{ key: "logo_migration_completed", value: "true" }]);

        setMigrationComplete(true);

        if (updatedCount > 0) {
          toast.success(`${updatedCount} YouTube feed logosu güncellendi.`, {
            id: "logo-migration",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Logo migration error:", error);
      }
    };

    if (!migrationComplete) {
      migrateLogos();
    }
  }, [supabase, migrationComplete]);

  return <>{children}</>;
}
