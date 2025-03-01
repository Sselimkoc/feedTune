"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function LogoMigrationProvider({ children }) {
  const [migrationComplete, setMigrationComplete] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const migrateLogos = async () => {
      try {
        // Check if migration was already completed
        if (localStorage.getItem("logo_migration_completed") === "true") {
          setMigrationComplete(true);
          return;
        }

        // Check user session
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          setMigrationComplete(true);
          return;
        }

        // Simplify the approach - just try to fetch YouTube feeds directly
        // If the table doesn't exist, it will fail gracefully
        const { data: youtubeFeeds, error: feedsError } = await supabase
          .from("youtube_feeds")
          .select("id, channel_avatar");

        // If there's an error (table doesn't exist or no permission), just mark as complete
        if (feedsError) {
          console.log(
            "Logo migration skipped: YouTube feeds table not accessible"
          );
          localStorage.setItem("logo_migration_completed", "true");
          setMigrationComplete(true);
          return;
        }

        // If we have YouTube feeds with avatars, update the feeds table
        let updatedCount = 0;
        for (const feed of youtubeFeeds || []) {
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

        // Mark migration as complete
        localStorage.setItem("logo_migration_completed", "true");
        setMigrationComplete(true);

        console.log(`Logo migration completed: ${updatedCount} feeds updated`);
      } catch (error) {
        console.error("Logo migration error:", error);
        // Mark as complete even on error to prevent repeated attempts
        localStorage.setItem("logo_migration_completed", "true");
        setMigrationComplete(true);
      }
    };

    if (!migrationComplete) {
      migrateLogos();
    }
  }, [supabase, migrationComplete]);

  return <>{children}</>;
}
