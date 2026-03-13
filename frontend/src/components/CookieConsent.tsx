"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "papposhop-cookie-consent";

type ConsentStatus = "accepted" | "rejected" | null;

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY) as ConsentStatus;
    if (saved) {
      setConsent(saved);
    } else {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setConsent("accepted");
    setVisible(false);
  }

  function reject() {
    localStorage.setItem(CONSENT_KEY, "rejected");
    setConsent("rejected");
    setVisible(false);
  }

  if (consent || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white border border-charcoal/10 shadow-2xl shadow-charcoal/10 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-charcoal mb-1">
              We value your privacy
            </p>
            <p className="text-xs text-charcoal/60 leading-relaxed">
              We use cookies and similar technologies to improve your experience,
              analyse traffic, and personalise ads. By accepting, you consent to
              our use of cookies.{" "}
              <Link
                href="/privacy"
                className="text-green font-medium hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={reject}
              className="rounded-full border border-charcoal/15 px-5 py-2 text-xs font-semibold text-charcoal/60 hover:border-charcoal/30 hover:text-charcoal transition-colors"
            >
              Decline
            </button>
            <button
              onClick={accept}
              className="rounded-full bg-green px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-dark transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "accepted";
}
