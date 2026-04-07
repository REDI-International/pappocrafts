"use client";

import Image from "next/image";
import { useLocale } from "@/lib/locale-context";
import { useSiteSettings } from "@/lib/site-settings-context";
import type { TranslationKey } from "@/lib/translations";

const values: { titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { titleKey: "mission.val1Title", descKey: "mission.val1Desc" },
  { titleKey: "mission.val2Title", descKey: "mission.val2Desc" },
  { titleKey: "mission.val3Title", descKey: "mission.val3Desc" },
  { titleKey: "mission.val4Title", descKey: "mission.val4Desc" },
];

export default function Mission() {
  const { t } = useLocale();
  const siteSettings = useSiteSettings();

  const badge = siteSettings.mission_badge.trim() || t("mission.badge");
  const title = siteSettings.mission_title.trim() || t("mission.title");
  const desc1 = siteSettings.mission_desc1.trim() || t("mission.desc1");
  const desc2 = siteSettings.mission_desc2.trim() || t("mission.desc2");

  return (
    <section id="mission" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
          <div>
            <p className="text-sm font-semibold text-green uppercase tracking-wide">
              {badge}
            </p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-charcoal tracking-tight leading-tight">
              {title}
            </h2>
            <div className="mt-4 inline-flex items-center rounded-full border border-green/25 bg-green/10 px-3 py-1.5 text-xs font-semibold text-green-dark">
              Grandfather&apos;s Workshop
            </div>
            <p className="mt-6 text-lg text-charcoal/70 leading-relaxed">
              {desc1}
            </p>
            <p className="mt-4 text-lg text-charcoal/70 leading-relaxed">
              {desc2}
            </p>

            <div className="mt-8 flex items-center gap-4">
              <Image src="/redi-logo.png" alt="REDI" width={60} height={60} className="h-14 w-auto" />
              <p className="text-sm text-charcoal/60">
                {t("mission.supportedBy")} <strong className="text-charcoal">REDI</strong> — Roma Entrepreneurship Development Initiative
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((value, i) => (
              <div
                key={value.titleKey}
                className={`rounded-2xl p-6 ${
                  i % 2 === 0
                    ? "bg-green/5 border border-green/10"
                    : "bg-blue/5 border border-blue/10"
                }`}
              >
                <h3 className="font-semibold text-charcoal">{t(value.titleKey)}</h3>
                <p className="mt-2 text-sm text-charcoal/60 leading-relaxed">{t(value.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
