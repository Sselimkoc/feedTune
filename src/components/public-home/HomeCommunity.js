"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/core/ui/button";
import {
  TwitterIcon,
  GithubIcon,
  HeartIcon,
  UsersIcon,
  MessageSquareIcon,
  StarIcon,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SectionHeader, StatCard, TestimonialCard, AnimatedSection } from "./shared";

export function HomeCommunity() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const testimonials = [
    {
      id: 1,
      name: "Alex Chen",
      role: t("home.community.roles.developer"),
      avatar: "https://ui-avatars.com/api/?name=Alex+Chen&background=random",
      content: t("home.community.testimonials.alex"),
      rating: 5,
    },
    {
      id: 2,
      name: "Sarah Miller",
      role: t("home.community.roles.contentCreator"),
      avatar: "https://ui-avatars.com/api/?name=Sarah+Miller&background=random",
      content: t("home.community.testimonials.sarah"),
      rating: 5,
    },
    {
      id: 3,
      name: "David Kim",
      role: t("home.community.roles.journalist"),
      avatar: "https://ui-avatars.com/api/?name=David+Kim&background=random",
      content: t("home.community.testimonials.david"),
      rating: 5,
    },
  ];

  const stats = [
    {
      icon: <UsersIcon className="w-5 h-5" />,
      value: "10,000+",
      label: t("home.community.stats.users"),
    },
    {
      icon: <MessageSquareIcon className="w-5 h-5" />,
      value: "50,000+",
      label: t("home.community.stats.feeds"),
    },
    {
      icon: <StarIcon className="w-5 h-5" />,
      value: "4.9/5",
      label: t("home.community.stats.rating"),
    },
  ];

  return (
    <section className="py-8 md:py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <SectionHeader
          title={t("home.community.title")}
          subtitle={t("home.community.subtitle")}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-16">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              index={index}
            />
          ))}
        </div>

        {!isMobile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                index={index}
              />
            ))}
          </div>
        )}

        <AnimatedSection className="text-center">
          <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
            {t("home.community.join.title")}
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            <Button
              variant="outline"
              size={isMobile ? "default" : "lg"}
              className="w-full md:w-auto"
            >
              <GithubIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              {t("home.community.join.github")}
            </Button>
            <Button
              variant="outline"
              size={isMobile ? "default" : "lg"}
              className="w-full md:w-auto"
            >
              <TwitterIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              {t("home.community.join.twitter")}
            </Button>
            <Button
              variant="default"
              size={isMobile ? "default" : "lg"}
              className="w-full md:w-auto"
            >
              <HeartIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              {t("home.community.join.support")}
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
