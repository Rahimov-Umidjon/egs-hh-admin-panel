import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";
import { cn } from "@/lib/utils";

const SHORT_LABELS: Record<SupportedLanguage, string> = {
  uz: "UZ",
  "uz-Cyrl": "ЎЗ",
  ru: "РУ",
  en: "EN",
};

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl bg-slate-100 p-1 ",
        className
      )}
      onMouseLeave={() => setHovered(null)}
    >
      {SUPPORTED_LANGUAGES.map((lng, index) => {
        const selected = i18n.resolvedLanguage === lng;

        return (
          <button
            key={lng}
            type="button"
            onClick={() => i18n.changeLanguage(lng)}
            onMouseEnter={() => setHovered(index)}
            className="relative px-3 py-1.5 text-sm font-medium"
          >
            {hovered === index && !selected && (
              <motion.div
                layoutId="hover"
                className="absolute inset-0 rounded-lg bg-white"
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 30,
                }}
              />
            )}

            {selected && (
              <motion.div
                layoutId="selected"
                className="absolute inset-0 rounded-lg bg-indigo-600"
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 30,
                }}
              />
            )}

            <span
              className={cn(
                "relative z-10 transition-colors",
                selected
                  ? "text-white"
                  : hovered === index
                  ? "text-slate-900"
                  : "text-slate-500"
              )}
            >
              {SHORT_LABELS[lng]}
            </span>
          </button>
        );
      })}
    </div>
  );
}