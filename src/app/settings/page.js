import { SettingsContent } from "@/components/features/settings/SettingsContent";

export const metadata = {
  title: "Settings | FeedTune",
  description: "Customize your FeedTune experience with theme, language, and account settings.",
  keywords: ["settings", "preferences", "theme", "language", "account"],
  openGraph: {
    title: "Settings | FeedTune",
    description: "Customize your FeedTune experience with theme, language, and account settings.",
    type: "website",
  },
};

export default function SettingsPage() {
  return <SettingsContent />;
}
