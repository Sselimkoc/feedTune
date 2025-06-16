"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TwitterIcon,
  GithubIcon,
  HeartIcon,
  UsersIcon,
  MessageSquareIcon,
  StarIcon,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
            {t("home.community.title")}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.community.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center p-4 md:p-6 rounded-lg bg-card/50 backdrop-blur-sm"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 text-primary mb-3 md:mb-4">
                {stat.icon}
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
                {stat.value}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {!isMobile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar>
                        <AvatarImage src={testimonial.avatar} />
                        <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {testimonial.content}
                    </p>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className="w-4 h-4 fill-primary text-primary"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
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
        </motion.div>
      </div>
    </section>
  );
}
