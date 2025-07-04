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
  ];

  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {technologies.map((tech, idx) => (
            <motion.div
              key={tech.tech}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col items-center bg-card/80 rounded-xl p-6 shadow-md"
            >
              <div className="mb-3">{tech.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{tech.title}</h3>
              <p className="text-muted-foreground text-center mb-2">
                {tech.description}
              </p>
              <span className="text-xs text-muted-foreground">{tech.tech}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
