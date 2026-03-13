import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "PappoShop terms of service — rules and conditions for using our marketplace.",
  alternates: { canonical: "https://pappo.org/terms" },
};

export default function TermsPage() {
  return (
    <main className="pt-20 pb-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-charcoal/50 hover:text-green transition-colors">&larr; Back to Home</Link>
        <h1 className="mt-6 font-serif text-4xl font-bold text-charcoal tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-charcoal/50 text-sm">Last updated: March 2026</p>

        <div className="mt-10 prose prose-charcoal max-w-none text-charcoal/80 text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using PappoShop (pappo.org and papposhop.org), you agree to these Terms of Service. If you do not agree, please do not use our platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">2. About PappoShop</h2>
            <p>PappoShop is an online marketplace operated by REDI International that connects Roma artisans and entrepreneurs in the Western Balkans with customers. We facilitate the sale of handmade products and local services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">3. Products &amp; Services</h2>
            <p>All products are handmade by independent artisans. While we strive for accuracy, slight variations in colour, size, and finish are natural characteristics of handcrafted items and do not constitute defects.</p>
            <p>Prices are displayed in Euros (EUR) and may be shown in other currencies for convenience. The final charge is always in EUR.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">4. Orders &amp; Payment</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Orders are confirmed upon receipt of your order confirmation email</li>
              <li>Online payments are processed securely through Stripe</li>
              <li>&ldquo;Pay Later&rdquo; orders are confirmed upon receiving payment via bank transfer or cash on delivery</li>
              <li>We reserve the right to cancel orders due to stock issues, pricing errors, or suspected fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">5. Shipping &amp; Delivery</h2>
            <p>Delivery times vary by region:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Western Balkans:</strong> 3–7 business days</li>
              <li><strong>European Union:</strong> 7–14 business days</li>
              <li><strong>International:</strong> 14–21 business days</li>
            </ul>
            <p>Free shipping is available for orders above the specified threshold for your region. Shipping costs are calculated at checkout.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">6. Returns &amp; Refunds</h2>
            <p>We accept returns within 14 days of delivery for items in their original condition. Custom or personalised items cannot be returned unless defective. To initiate a return, contact us at <a href="mailto:petrica@redi-ngo.eu" className="text-green font-medium hover:underline">petrica@redi-ngo.eu</a> with your order number.</p>
            <p>Refunds are processed to the original payment method within 10 business days of receiving the returned item.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">7. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your login details or use another person&apos;s account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">8. Intellectual Property</h2>
            <p>All content on PappoShop — including logos, text, images, and design — is owned by REDI International or our artisan partners and is protected by copyright law. You may not reproduce, distribute, or use our content without written permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">9. Limitation of Liability</h2>
            <p>PappoShop is provided &ldquo;as is.&rdquo; We are not liable for indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount paid for the relevant order.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">10. Changes to Terms</h2>
            <p>We may update these terms from time to time. Material changes will be notified via email or a notice on the website. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">11. Contact</h2>
            <p>For questions about these terms:<br />
            <strong>REDI International</strong><br />
            Email: <a href="mailto:petrica@redi-ngo.eu" className="text-green font-medium hover:underline">petrica@redi-ngo.eu</a></p>
          </section>
        </div>
      </div>
    </main>
  );
}
