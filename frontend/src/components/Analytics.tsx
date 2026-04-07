"use client";

import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export default function Analytics() {
  const hasGA = !!GA_ID;
  const hasGAds = !!GADS_ID;
  const hasFB = !!FB_PIXEL_ID;

  if (!hasGA && !hasFB) return null;

  return (
    <>
      {/* Google Analytics + Google Ads */}
      {hasGA && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: true });
              ${hasGAds ? `gtag('config', '${GADS_ID}');` : ""}
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel */}
      {hasFB && (
        <>
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${FB_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
    </>
  );
}

/**
 * Track a purchase event across all configured analytics platforms.
 * Call from checkout success or after order confirmation.
 */
export function trackPurchase(params: {
  orderId: string;
  total: number;
  currency?: string;
  items?: { id: string; name: string; price: number; quantity: number }[];
}) {
  const { orderId, total, currency = "EUR", items = [] } = params;

  // Google Analytics 4 — purchase event
  if (typeof window !== "undefined" && "gtag" in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "purchase", {
      transaction_id: orderId,
      value: total,
      currency,
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  // Google Ads conversion
  if (typeof window !== "undefined" && "gtag" in window && GADS_ID) {
    const conversionLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;
    if (conversionLabel) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "conversion", {
        send_to: `${GADS_ID}/${conversionLabel}`,
        value: total,
        currency,
        transaction_id: orderId,
      });
    }
  }

  // Facebook Pixel — Purchase event
  if (typeof window !== "undefined" && "fbq" in window) {
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "Purchase", {
      value: total,
      currency,
      content_ids: items.map((i) => i.id),
      content_type: "product",
      num_items: items.reduce((s, i) => s + i.quantity, 0),
    });
  }
}

/**
 * Track "Add to Cart" across platforms.
 */
export function trackAddToCart(params: {
  id: string;
  name: string;
  price: number;
  currency?: string;
}) {
  const { id, name, price, currency = "EUR" } = params;

  if (typeof window !== "undefined" && "gtag" in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "add_to_cart", {
      currency,
      value: price,
      items: [{ item_id: id, item_name: name, price, quantity: 1 }],
    });
  }

  if (typeof window !== "undefined" && "fbq" in window) {
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "AddToCart", {
      value: price,
      currency,
      content_ids: [id],
      content_name: name,
      content_type: "product",
    });
  }
}

/**
 * Track "Initiate Checkout" across platforms.
 */
export function trackInitiateCheckout(params: {
  total: number;
  itemCount: number;
  currency?: string;
}) {
  const { total, itemCount, currency = "EUR" } = params;

  if (typeof window !== "undefined" && "gtag" in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "begin_checkout", {
      currency,
      value: total,
    });
  }

  if (typeof window !== "undefined" && "fbq" in window) {
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "InitiateCheckout", {
      value: total,
      currency,
      num_items: itemCount,
    });
  }
}

/**
 * Track "View Content" (product page) across platforms.
 */
export function trackViewContent(params: {
  id: string;
  name: string;
  price: number;
  category?: string;
  currency?: string;
}) {
  const { id, name, price, category, currency = "EUR" } = params;

  if (typeof window !== "undefined" && "gtag" in window) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "view_item", {
      currency,
      value: price,
      items: [{ item_id: id, item_name: name, price, item_category: category }],
    });
  }

  if (typeof window !== "undefined" && "fbq" in window) {
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq("track", "ViewContent", {
      value: price,
      currency,
      content_ids: [id],
      content_name: name,
      content_type: "product",
      content_category: category,
    });
  }
}

type MarketplaceEventType = "product_view" | "service_view" | "profile_visit";

const MARKETPLACE_SESSION_KEY = "papposhop-analytics-session-id";

function readOrCreateMarketplaceSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const existing = localStorage.getItem(MARKETPLACE_SESSION_KEY);
    if (existing && existing.trim()) return existing.trim();
    const created = crypto.randomUUID();
    localStorage.setItem(MARKETPLACE_SESSION_KEY, created);
    return created;
  } catch {
    return undefined;
  }
}

/**
 * Track first-party marketplace events into Supabase analytics_events.
 */
export function trackMarketplaceEvent(params: {
  eventType: MarketplaceEventType;
  listingId?: string;
  sellerSlug?: string;
  sellerName?: string;
  pagePath?: string;
}) {
  if (typeof window === "undefined") return;

  const payload = {
    eventType: params.eventType,
    listingId: params.listingId,
    sellerSlug: params.sellerSlug,
    sellerName: params.sellerName,
    pagePath: params.pagePath || window.location.pathname + window.location.search,
    sessionId: readOrCreateMarketplaceSessionId(),
  };

  try {
    if ("sendBeacon" in navigator) {
      const body = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon("/api/public/analytics-event", body);
      return;
    }
  } catch {
    // Fallback to fetch below.
  }

  fetch("/api/public/analytics-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
