"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";

export default function CartSidebar() {
  const { items, removeItem, updateQuantity, totalPrice, isCartOpen, setIsCartOpen } = useCart();
  const { t, formatRegionalPrice, formatProductRegionalPrice } = useLocale();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={() => setIsCartOpen(false)} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-charcoal">{t("cart.title")}</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1 text-charcoal/50 hover:text-charcoal transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <svg className="h-16 w-16 text-charcoal/20 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <p className="text-charcoal/50 mb-4">{t("cart.empty")}</p>
            <Link
              href="/"
              onClick={() => setIsCartOpen(false)}
              className="rounded-full bg-green px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-dark transition-colors"
            >
              {t("cart.startShopping")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 rounded-xl border border-charcoal/5 p-3">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-light">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-charcoal truncate">{item.product.name}</h3>
                      <p className="text-sm text-green font-semibold mt-0.5">
                        {formatProductRegionalPrice(item.product.price, item.product.currency)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="h-7 w-7 rounded-md border border-charcoal/10 flex items-center justify-center text-charcoal/60 hover:border-green hover:text-green transition-colors"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium text-charcoal w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="h-7 w-7 rounded-md border border-charcoal/10 flex items-center justify-center text-charcoal/60 hover:border-green hover:text-green transition-colors"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="ml-auto text-charcoal/30 hover:text-red-500 transition-colors"
                          aria-label={t("checkout.remove")}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-charcoal/10 px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-charcoal/60">{t("cart.subtotal")}</span>
                <span className="text-lg font-semibold text-charcoal">{formatRegionalPrice(totalPrice)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="block w-full rounded-full bg-green py-3 text-center text-sm font-semibold text-white shadow-lg shadow-green/25 hover:bg-green-dark transition-all"
              >
                {t("cart.checkout")}
              </Link>
              <button
                onClick={() => setIsCartOpen(false)}
                className="block w-full mt-2 py-2 text-center text-sm text-charcoal/50 hover:text-charcoal transition-colors"
              >
                {t("cart.continueShopping")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
