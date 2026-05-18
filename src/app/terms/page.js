"use client";

import { useTranslation } from "react-i18next";
import { Shield, BookOpen, UserCheck, Mail } from "lucide-react";

const SECTION_ICONS = {
  service: BookOpen,
  account: Shield,
  usage: UserCheck,
};

function Section({ icon: Icon, title, description, items }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TermsPage() {
  const { t, i18n } = useTranslation();

  const lastUpdated = new Date("2025-05-18").toLocaleDateString(
    i18n.language === "tr" ? "tr-TR" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const sections = ["service", "account", "usage"];

  return (
    <div className="max-w-2xl mx-auto py-4 px-2 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("terms.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("terms.lastUpdated")}: {lastUpdated}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed pt-1">
          {t("terms.intro")}
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((key) => (
          <Section
            key={key}
            icon={SECTION_ICONS[key]}
            title={t(`terms.${key}.title`)}
            description={t(`terms.${key}.description`)}
            items={t(`terms.${key}.items`, { returnObjects: true })}
          />
        ))}
      </div>

      {/* Contact */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm text-muted-foreground">
          <span>{t("terms.contact")} </span>
          <a
            href="mailto:noreply@selimkoc.dev"
            className="text-primary hover:underline font-medium"
          >
            noreply@selimkoc.dev
          </a>
        </div>
      </div>
    </div>
  );
}
