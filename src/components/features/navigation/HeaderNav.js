"use client";

import Link from "next/link";
import { ThemeSwitcher } from "@/components/core/ui/theme-switcher";
import { LanguageSwitcher } from "@/components/core/ui/language-switcher";
import Image from "next/image";

export function HeaderNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-[#151c29] shadow border-b border-blue-900">
      <div className="max-w-8xl mx-auto px-10 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 h-full">
          <Image
            src="/images/logo.png"
            alt="FeedTune Logo"
            width={28}
            height={28}
            className="w-7 h-7"
          />
          <span className="font-bold text-xl text-blue-500 hover:text-blue-600 transition-colors">
            FeedTune
          </span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
