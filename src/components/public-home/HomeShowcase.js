"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/core/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/core/ui/tabs";
import { Card, CardContent } from "@/components/core/ui/card";
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

  return (
    <section className="py-6 md:py-16 bg-muted/30" id="showcase">
      <div className="container mx-auto px-2 md:px-4">
        <motion.div
          className="text-center mb-6 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg md:text-3xl font-bold mb-2 md:mb-4">
            {t("home.showcase.title")}
          </h2>
          <p className="text-xs md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.showcase.subtitle")}
          </p>
        </motion.div>
        {isMobile ? (
          <div className="flex flex-col gap-4 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-card/90 rounded-xl shadow-sm">
                  <CardContent className="flex items-start gap-3 p-3 md:p-6">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm md:text-xl mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs md:text-base text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <>
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
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid md:grid-cols-2 gap-8 items-center"
                  >
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold">{feature.title}</h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                      <Button variant="outline" size="sm">
                        <SearchIcon className="w-4 h-4 mr-2" />
                        {t("home.showcase.learnMore")}
                      </Button>
                    </div>
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border/50 shadow-xl">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 0px, 600px"
                        priority={false}
                      />
                    </div>
                  </motion.div>
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
        <motion.div
          className="mt-6 md:mt-16 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4 max-w-[800px] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-1 md:gap-2 justify-center p-2 md:p-4 rounded-lg bg-card/50 backdrop-blur-sm">
            <MonitorSmartphoneIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-[10px] md:text-sm font-medium">
              {t("home.showcase.responsive")}
            </span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 justify-center p-2 md:p-4 rounded-lg bg-card/50 backdrop-blur-sm">
            <MoonIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-[10px] md:text-sm font-medium">
              {t("home.showcase.darkMode")}
            </span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 justify-center p-2 md:p-4 rounded-lg bg-card/50 backdrop-blur-sm">
            <GlobeIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-[10px] md:text-sm font-medium">
              {t("home.showcase.multilingual")}
            </span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 justify-center p-2 md:p-4 rounded-lg bg-card/50 backdrop-blur-sm">
            <SearchIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-[10px] md:text-sm font-medium">
              {t("home.showcase.search")}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
