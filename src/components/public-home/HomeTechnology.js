"use client";

import { useTranslation } from "react-i18next";
import {
  Cpu,
  Zap,
  Smartphone,
  ShieldCheck,
  Database,
  Code2,
  Layers,
} from "lucide-react";
import { SectionHeader, TechCard } from "./shared";

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
        <SectionHeader
          title={t("home.technology.title")}
          subtitle={t("home.technology.subtitle")}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {technologies.map((tech, idx) => (
            <TechCard
              key={tech.tech}
              icon={tech.icon}
              title={tech.title}
              description={tech.description}
              tech={tech.tech}
              index={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
