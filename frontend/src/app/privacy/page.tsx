import type { Metadata } from "next";
import Link from "next/link";
import { getDomainConfig } from "@/lib/domain-config";

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getDomainConfig();
  return {
    title: "Privacy Policy",
    description: "PappoShop privacy policy — how we collect, use, and protect your personal data.",
    alternates: { canonical: `${cfg.baseUrl}/privacy` },
  };
}

export default function PrivacyPage() {
  return (
    <main className="pt-20 pb-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-charcoal/50 hover:text-green transition-colors">&larr; Back to Home</Link>
        <h1 className="mt-6 font-serif text-4xl font-bold text-charcoal tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-charcoal/50 text-sm">Last updated: March 2026</p>

        <div className="mt-10 prose prose-charcoal max-w-none text-charcoal/80 text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">1. Who We Are</h2>
            <p>PappoShop (accessible at pappo.org and papposhop.org) is a social enterprise marketplace operated by REDI North Macedonia, connecting Roma entrepreneurs across the Western Balkans with customers worldwide.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">2. Information We Collect</h2>
            <p><strong>Account information:</strong> Name, email address, and password when you create an account.</p>
            <p><strong>Order information:</strong> Name, email, phone number, shipping address, and payment details when you place an order.</p>
            <p><strong>Usage data:</strong> Pages visited, time spent, clicks, device type, browser, IP address, and referring URL through cookies and analytics tools.</p>
            <p><strong>Communications:</strong> Emails you send us and waitlist sign-ups.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Process and fulfil your orders</li>
              <li>Send order confirmation and shipping update emails</li>
              <li>Improve our website and product offerings</li>
              <li>Analyse traffic and usage patterns (Google Analytics, PostHog)</li>
              <li>Display relevant advertising (Facebook Pixel, Google Ads)</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">4. Cookies &amp; Tracking</h2>
            <p>We use the following tracking technologies:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Analytics (GA4)</strong> — website traffic analysis</li>
              <li><strong>Google Ads</strong> — conversion tracking and remarketing</li>
              <li><strong>Meta (Facebook) Pixel</strong> — conversion tracking and ad optimisation</li>
              <li><strong>PostHog</strong> — product analytics and user behaviour</li>
              <li><strong>Sentry</strong> — error tracking and performance monitoring</li>
            </ul>
            <p>You can manage your cookie preferences through the cookie consent banner or your browser settings. Declining cookies will disable non-essential tracking.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">5. Sharing Your Information</h2>
            <p>We do not sell your personal information. We share data only with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Payment processors</strong> (Stripe) to process payments securely</li>
              <li><strong>Email providers</strong> (Resend) to send transactional emails</li>
              <li><strong>Analytics providers</strong> (Google, Meta, PostHog) in anonymised/aggregated form</li>
              <li><strong>Hosting providers</strong> (Vercel, Supabase) as part of our infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">6. Your Rights (GDPR)</h2>
            <p>If you are in the European Economic Area or Western Balkans, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent at any time</li>
              <li>Data portability</li>
              <li>Object to processing</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:redimk@redi-ngo.eu" className="text-green font-medium hover:underline">redimk@redi-ngo.eu</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">7. Data Security</h2>
            <p>We use industry-standard security measures including HTTPS encryption, secure payment processing through Stripe, and access-controlled databases. However, no method of electronic transmission is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">8. Data Retention</h2>
            <p>We retain order data for up to 5 years for legal and accounting purposes. Analytics data is retained according to each provider&apos;s policies. You can request deletion of your personal data at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">9. Contact</h2>
            <p>For privacy-related inquiries, contact:<br />
            <strong>REDI North Macedonia</strong><br />
            Email: <a href="mailto:redimk@redi-ngo.eu" className="text-green font-medium hover:underline">redimk@redi-ngo.eu</a></p>
          </section>
        </div>
      </div>
    </main>
  );
}
