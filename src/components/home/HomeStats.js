"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export function HomeStats({ stats }) {
  const { t } = useLanguage();

  return (
    <section className="py-8 lg:py-12">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xl text-center">
                {stats.totalFeeds}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center text-sm">
                {t("home.stats.totalFeeds")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xl text-center">
                {stats.totalItems}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center text-sm">
                {t("home.stats.totalItems")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xl text-center">
                {stats.unreadItems}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center text-sm">
                {t("home.stats.unreadItems")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xl text-center">
                {stats.favoriteItems}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center text-sm">
                {t("home.stats.favoriteItems")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xl text-center">
                {stats.readLaterItems}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center text-sm">
                {t("home.stats.readLaterItems")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
