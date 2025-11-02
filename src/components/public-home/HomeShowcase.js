"use client";

import { useTranslation } from "react-i18next";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import {
  RssIcon,
  YoutubeIcon,
  BookmarkIcon,
  ShareIcon,
  MonitorSmartphoneIcon,
  MoonIcon,
  GlobeIcon,
  SearchIcon,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  SectionHeader,
  FeatureShowcaseCard,
  FeatureHighlight,
  FeatureBadge,
  AnimatedSection,
} from "./shared";

export function HomeShowcase() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const features = [
    {
      id: "feed-management",
      icon: <RssIcon className="w-5 h-5 md:w-6 md:h-6" />,
      title: t("home.showcase.feedManagement.title"),
      description: t("home.showcase.feedManagement.description"),
      image:
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "youtube-integration",
      icon: <YoutubeIcon className="w-5 h-5 md:w-6 md:h-6" />,
      title: t("home.showcase.youtube.title"),
      description: t("home.showcase.youtube.description"),
      image:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "reading-features",
      icon: <BookmarkIcon className="w-5 h-5 md:w-6 md:h-6" />,
      title: t("home.showcase.reading.title"),
      description: t("home.showcase.reading.description"),
      image:
        "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "sharing",
      icon: <ShareIcon className="w-5 h-5 md:w-6 md:h-6" />,
      title: t("home.showcase.sharing.title"),
      description: t("home.showcase.sharing.description"),
      image:
        "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const badges = [
    {
      icon: <MonitorSmartphoneIcon className="w-4 h-4 md:w-5 md:h-5" />,
      label: t("home.showcase.responsive"),
    },
    {
      icon: <MoonIcon className="w-4 h-4 md:w-5 md:h-5" />,
      label: t("home.showcase.darkMode"),
    },
    {
      icon: <GlobeIcon className="w-4 h-4 md:w-5 md:h-5" />,
      label: t("home.showcase.multilingual"),
    },
    {
      icon: <SearchIcon className="w-4 h-4 md:w-5 md:h-5" />,
      label: t("home.showcase.search"),
    },
  ];

  return (
    <section className="py-6 md:py-16 bg-muted/30" id="showcase">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <SectionHeader
          title={t("home.showcase.title")}
          subtitle={t("home.showcase.subtitle")}
        />

        {isMobile ? (
          <div className="flex flex-col gap-4 md:gap-8">
            {features.map((feature, index) => (
              <FeatureShowcaseCard
                key={feature.id}
                feature={feature}
                index={index}
              />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="feed-management" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-[800px] mx-auto mb-8">
              {features.map((feature) => (
                <TabsTrigger
                  key={feature.id}
                  value={feature.id}
                  className="flex items-center gap-2 data-[state=active]:bg-primary/10"
                >
                  {feature.icon}
                  <span>{feature.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {features.map((feature) => (
              <TabsContent key={feature.id} value={feature.id}>
                <FeatureHighlight
                  feature={feature}
                  learnMoreText={t("home.showcase.learnMore")}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}

        <AnimatedSection className="mt-6 md:mt-16 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4 max-w-[800px] mx-auto">
          {badges.map((badge, index) => (
            <FeatureBadge key={index} icon={badge.icon} label={badge.label} />
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}
