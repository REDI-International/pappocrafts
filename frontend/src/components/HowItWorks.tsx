"use client";

import { useLocale } from "@/lib/locale-context";
import type { TranslationKey } from "@/lib/translations";

const steps: { number: string; titleKey: TranslationKey; descKey: TranslationKey; icon: React.ReactNode }[] = [
  {
    number: "01",
    titleKey: "how.step1Title",
    descKey: "how.step1Desc",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    number: "02",
    titleKey: "how.step2Title",
    descKey: "how.step2Desc",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
  },
  {
    number: "03",
    titleKey: "how.step3Title",
    descKey: "how.step3Desc",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  const { t, locale } = useLocale();

  return (
    <section id="how-it-works" className="py-24 sm:py-32" key={locale}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-green uppercase tracking-wide">
            {t("how.badge")}
          </p>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-charcoal tracking-tight">
            {t("how.title")}
          </h2>
          <p className="mt-4 text-lg text-charcoal/60 leading-relaxed">
            {t("how.desc")}
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative rounded-2xl bg-white p-8 shadow-sm border border-charcoal/5 hover:shadow-md hover:border-green/20 transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green/10 text-green group-hover:bg-green group-hover:text-white transition-colors">
                  {step.icon}
                </div>
                <span className="font-serif text-4xl font-bold text-charcoal/10">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-charcoal">{t(step.titleKey)}</h3>
              <p className="mt-3 text-charcoal/60 leading-relaxed">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
