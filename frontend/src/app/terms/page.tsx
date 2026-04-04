import type { Metadata } from "next";
import Link from "next/link";
import { getDomainConfig } from "@/lib/domain-config";

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getDomainConfig();
  return {
    title: "Terms of Service",
    description: "PappoShop terms of service — rules and conditions for using our marketplace.",
    alternates: { canonical: `${cfg.baseUrl}/terms` },
  };
}

export default function TermsPage() {
  return (
    <main className="pt-20 pb-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-charcoal/50 hover:text-green transition-colors">&larr; Back to Home</Link>
        <h1 className="mt-6 font-serif text-4xl font-bold text-charcoal tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-charcoal/50 text-sm">Last updated: April 2026</p>

        <div className="mt-10 prose prose-charcoal max-w-none text-charcoal/80 text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using PappoShop (pappo.com and papposhop.org), you agree to comply with and be
              bound by these Terms of Service. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">2. About PappoShop</h2>
            <p>
              PappoShop is an online marketplace operated by REDI International that connects independent Roma
              Entrepreneurs and Service Providers from the Western Balkans with customers. The platform facilitates
              the sale of handmade products, products and local services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">3. Nature of the Platform</h2>
            <p>
              PappoShop acts as an intermediary between buyers and independent sellers. We do not produce, store,
              or directly sell the products listed on the platform. Sellers are solely responsible for their
              products, including descriptions, pricing, quality, and delivery.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">4. Products and Services</h2>
            <p>
              Products offered on the platform are provided by independent sellers and may include a variety of
              goods and services. Product descriptions, specifications, and images are provided by sellers.
            </p>
            <p>
              While we encourage accuracy, we do not guarantee that all information is complete, reliable, or
              error-free. We strive to ensure accuracy in product descriptions, but we do not guarantee that all
              information is complete, reliable, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">5. Orders and Payment</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Orders are confirmed upon receipt of an order confirmation email.</li>
              <li>Payment is made exclusively upon delivery (Cash on Delivery).</li>
              <li>Customers are required to pay the full amount in cash at the time of delivery.</li>
              <li>Orders may be cancelled if the customer refuses to accept or pay for the delivery.</li>
              <li>
                We reserve the right to cancel or refuse any order due to stock issues, pricing errors, or
                suspected fraudulent activity.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">6. Shipping and Delivery</h2>
            <p>Shipping is available only within the following countries: Albania, Serbia, and North Macedonia.</p>
            <p>Estimated delivery times:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Domestic deliveries (within the same country): 1-3 business days</li>
              <li>Cross-border deliveries (Albania, Serbia, North Macedonia): 2-5 business days</li>
            </ul>
            <p>
              Delivery times may vary depending on the courier service and location. We work with regional
              logistics providers, including Eco Logistic Service (ELS), to ensure reliable delivery.
            </p>
            <p>
              Shipping costs are calculated at checkout. Free shipping may be available for orders above a specified
              threshold, which is clearly indicated on the platform.
            </p>
            <p>
              PappoShop is not responsible for delays caused by courier services, customs procedures (if
              applicable), or other external factors.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">7. Returns and Refunds</h2>
            <p>
              Customers have the right to request a return or refund within 10 days of receiving the product, in
              accordance with applicable consumer protection laws.
            </p>
            <p>To be eligible for a return:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The item must be unused and in its original condition.</li>
              <li>Proof of purchase must be provided.</li>
              <li>
                Return shipping costs may be the responsibility of the customer unless the product is defective or
                incorrect.
              </li>
            </ul>
            <p>Refunds are processed after the returned item is received and inspected.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">8. User Responsibilities</h2>
            <p>Users agree to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate and complete information.</li>
              <li>Use the platform in compliance with applicable laws.</li>
              <li>Not engage in fraudulent, abusive, or harmful activities.</li>
            </ul>
            <p>Users are responsible for maintaining the confidentiality of their account information.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">9. Intellectual Property</h2>
            <p>
              All content on the platform, including logos, text, graphics, and design, is the property of
              PappoShop or its licensors and is protected by intellectual property laws. Unauthorized use is
              prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">10. Privacy and Data Protection</h2>
            <p>
              We are committed to protecting your personal data. Please refer to our Privacy Policy for detailed
              information on how your data is collected, used, and protected, in accordance with GDPR and
              applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">11. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, PappoShop shall not be liable for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Indirect, incidental, or consequential damages.</li>
              <li>Losses resulting from delays, delivery issues, or product defects.</li>
              <li>Actions or omissions of third-party sellers or service providers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">12. Governing Law</h2>
            <p>These Terms shall be governed by and interpreted in accordance with the laws of North Macedonia.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">13. Dispute Resolution</h2>
            <p>
              Any disputes arising from the use of the platform shall be resolved through amicable negotiation.
              If no resolution is reached, disputes shall be subject to the jurisdiction of the competent courts in
              North Macedonia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">14. Changes to Terms</h2>
            <p>
              We reserve the right to update or modify these Terms at any time. Changes will be effective upon
              posting on the platform. Continued use of the platform constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-charcoal mt-8 mb-3">15. Contact Information</h2>
            <p>
              For any questions or concerns regarding these Terms, please contact us at:{" "}
              <a href="mailto:papposhop@redi-ngo.eu" className="text-green font-medium hover:underline">
                papposhop@redi-ngo.eu
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
