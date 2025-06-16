"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Cpu,
  Zap,
  Smartphone,
  ShieldCheck,
  Database,
  Code2,
  Layers,
  Gauge,
} from "lucide-react";
import Image from "next/image";

export function HomeTechnology() {
  const { t } = useTranslation();

  const technologies = [
    {
      icon: <Cpu className="w-6 h-6 text-blue-500" />,
      title: t("home.technology.nextjs.title"),
      description: t("home.technology.nextjs.description"),
      tech: "Next.js 14",
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: t("home.technology.react.title"),
      description: t("home.technology.react.description"),
      tech: "React 18",
    },
    {
      icon: <Smartphone className="w-6 h-6 text-green-500" />,
      title: t("home.technology.tailwind.title"),
      description: t("home.technology.tailwind.description"),
      tech: "Tailwind CSS",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-red-500" />,
      title: t("home.technology.auth.title"),
      description: t("home.technology.auth.description"),
      tech: "Supabase Auth",
    },
    {
      icon: <Database className="w-6 h-6 text-purple-500" />,
      title: t("home.technology.database.title"),
      description: t("home.technology.database.description"),
      tech: "PostgreSQL",
    },
    {
      icon: <Code2 className="w-6 h-6 text-indigo-500" />,
      title: t("home.technology.typescript.title"),
      description: t("home.technology.typescript.description"),
      tech: "TypeScript",
    },
    {
      icon: <Layers className="w-6 h-6 text-orange-500" />,
      title: t("home.technology.radix.title"),
      description: t("home.technology.radix.description"),
      tech: "Radix UI",
    },
    {
      icon: <Gauge className="w-6 h-6 text-teal-500" />,
      title: t("home.technology.performance.title"),
      description: t("home.technology.performance.description"),
      tech: "Server Components",
    },
  ];

  return (
    <section className="py-16 relative overflow-hidden" id="technology">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4">
            {t("home.technology.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.technology.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-background rounded-lg p-2">{tech.icon}</div>
                <span className="text-sm font-medium text-muted-foreground">
                  {tech.tech}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{tech.title}</h3>
              <p className="text-muted-foreground text-sm">
                {tech.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Performance Metrics */}
        <motion.div
          className="mt-16 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {"<1s"}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("home.technology.metrics.loadTime")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">99</div>
              <div className="text-sm text-muted-foreground">
                {t("home.technology.metrics.performance")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">
                {t("home.technology.metrics.accessibility")}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
