"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isIntroHiddenPath,
  readIntroDismissedFromDocument,
  writeIntroDismissedCookie,
} from "@/lib/intro-entry";

/**
 * One dismiss cookie persists for a year. Mounted once from root layout so client
 * navigations to `/` do not remount and replay the intro; client-side cookie read
 * corrects stale RSC payloads that omit the dismissal cookie.
 */
export default function IntroEntryLayer({ initiallyOpen }: { initiallyOpen: boolean }) {
  const pathname = usePathname();
  const [userClosed, setUserClosed] = useState(false);

  const open =
    !userClosed &&
    !isIntroHiddenPath(pathname) &&
    (typeof document === "undefined" ? initiallyOpen : !readIntroDismissedFromDocument());

  if (!open) return null;

  function dismiss() {
    writeIntroDismissedCookie();
    setUserClosed(true);
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-charcoal/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/20 bg-white p-6 shadow-2xl sm:p-7">
        <p className="inline-block rounded-full bg-green/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-green">
          Grandfather&apos;s Workshop
        </p>
        <h2 className="mt-3 font-serif text-2xl font-bold text-charcoal sm:text-3xl">
          Pappo! The first community based shop for the Western Balkans!
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
          Before you enter the marketplace, discover the story behind PappoShop and how we support
          artisans from vulnerable communities.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/landing#mission"
            onClick={dismiss}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-dark transition-colors"
          >
            Read the story first
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-charcoal/20 px-5 py-2.5 text-sm font-semibold text-charcoal/75 hover:bg-charcoal/5"
          >
            Continue to website
          </button>
        </div>
      </div>
    </div>
  );
}
