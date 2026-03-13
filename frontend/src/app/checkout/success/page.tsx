"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";
import { trackPurchase } from "@/components/Analytics";

function SuccessContent() {
  const { clearCart } = useCart();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const method = searchParams.get("method");
  const tracked = useRef(false);

  useEffect(() => {
    clearCart();

    if (orderId && method === "online" && !tracked.current) {
      tracked.current = true;
      trackPurchase({ orderId, total: 0 });
      if (posthog.__loaded) {
        posthog.capture("purchase_completed", {
          order_id: orderId,
          payment_method: "online",
        });
      }
    }
  }, [clearCart, orderId, method]);

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 text-center py-16">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green/10">
        <svg className="h-10 w-10 text-green" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal tracking-tight">
        {t("success.title")}
      </h1>

      {orderId && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-charcoal/5 px-5 py-2">
          <span className="text-xs text-charcoal/50">{t("success.orderNumber")}:</span>
          <span className="font-mono font-bold text-charcoal">{orderId}</span>
        </div>
      )}

      <p className="mt-6 text-lg text-charcoal/60 leading-relaxed">
        {t("success.desc")}
      </p>

      {method === "later" && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 px-5 py-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">{t("checkout.payLater")}</p>
          <p className="text-amber-700">{t("checkout.payLaterDesc")}</p>
        </div>
      )}

      <p className="mt-4 text-sm text-charcoal/50">
        {t("success.emailSent")}
      </p>

      <div className="mt-4 rounded-lg bg-green/5 px-4 py-3">
        <p className="text-sm text-charcoal/60">
          {t("success.contactUs")}{" "}
          <a href="mailto:petrica@redi-ngo.eu" className="font-semibold text-green hover:underline">
            petrica@redi-ngo.eu
          </a>
        </p>
      </div>

      <p className="mt-4 text-charcoal/60">
        {t("success.supports")}
      </p>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-full bg-green px-8 py-3 text-base font-semibold text-white shadow-lg shadow-green/25 hover:bg-green-dark transition-all"
        >
          {t("success.continueShopping")}
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border-2 border-charcoal/20 px-8 py-3 text-base font-semibold text-charcoal hover:border-green hover:text-green transition-colors"
        >
          {t("success.backHome")}
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <>
      <Navbar />
      <main className="pt-20 pb-24">
        <Suspense fallback={<div className="py-24 text-center text-charcoal/40">Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
