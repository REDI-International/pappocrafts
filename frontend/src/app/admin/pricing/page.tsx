"use client";

import { useState, useEffect, useCallback } from "react";
import {
  regionConfigs,
  shippingRates,
  getRegionalPrice,
  calculateShipping,
  calculateMargin,
  type PricingRegion,
  type ShippingZone,
} from "@/lib/pricing";
import { type Product, mapSupabaseProduct } from "@/lib/products";

export default function AdminPricingPage() {
  const [calcBasePrice, setCalcBasePrice] = useState(45);
  const [calcWeight, setCalcWeight] = useState(1);
  const [calcRegion, setCalcRegion] = useState<PricingRegion>("western_europe");
  const [calcZone, setCalcZone] = useState<ShippingZone>("eu");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    const token = localStorage.getItem("admin-token");
    if (!token) {
      setProductsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data.map(mapSupabaseProduct));
    } catch {
      // products remain empty
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const margin = calculateMargin(calcBasePrice, calcRegion, calcZone, calcWeight);
  const shipping = calculateShipping(margin.sellingPrice, calcZone, calcWeight);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Pricing & Shipping</h1>
        <p className="text-sm text-white/40 mt-1">Regional pricing multipliers and shipping rate management</p>
      </div>

      {/* Regional Multipliers */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-white mb-4">Regional Price Multipliers</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {regionConfigs.map((r) => (
            <div key={r.region} className="rounded-xl bg-[#1A1D27] border border-white/5 p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">{r.label}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  r.priceMultiplier < 1 ? "bg-blue-500/10 text-blue-400" : r.priceMultiplier > 1 ? "bg-green-500/10 text-green-400" : "bg-white/5 text-white/40"
                }`}>
                  {r.priceMultiplier < 1 ? `${((1 - r.priceMultiplier) * 100).toFixed(0)}% off` : r.priceMultiplier > 1 ? `+${((r.priceMultiplier - 1) * 100).toFixed(0)}%` : "Base"}
                </span>
              </div>
              <p className="text-xs text-white/30 mb-2">{r.description}</p>
              <p className="text-xl font-bold text-white">&times;{r.priceMultiplier}</p>
              <p className="text-[10px] text-white/20 mt-1">&euro;45 &rarr; &euro;{(45 * r.priceMultiplier).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shipping Rates */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-white mb-4">Shipping Rate Table</h2>
        <div className="overflow-x-auto rounded-xl bg-[#1A1D27] border border-white/5">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Zone</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40">Base Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40">Per Extra kg</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/40">Free Above</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/40">Est. Delivery</th>
              </tr>
            </thead>
            <tbody>
              {shippingRates.map((rate) => (
                <tr key={rate.zone} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-white text-xs font-medium">{rate.label}</td>
                  <td className="px-4 py-3 text-right text-white/60 text-xs">&euro;{rate.baseCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-white/60 text-xs">&euro;{rate.perKgCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-xs">{rate.freeAbove ? <span className="text-[#4A9B3F]">&euro;{rate.freeAbove}</span> : <span className="text-white/20">Never</span>}</td>
                  <td className="px-4 py-3 text-white/30 text-xs">{rate.estimatedDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Calculator */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-white mb-4">Margin Calculator</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-[#1A1D27] border border-white/5 p-5 space-y-4">
            <div>
              <label className="block text-xs text-white/40 mb-1">Base Price (EUR)</label>
              <input type="number" min={1} step={0.5} value={calcBasePrice} onChange={(e) => setCalcBasePrice(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4A9B3F]" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Weight (kg)</label>
              <input type="number" min={0.1} step={0.1} value={calcWeight} onChange={(e) => setCalcWeight(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4A9B3F]" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Pricing Region</label>
              <select value={calcRegion} onChange={(e) => setCalcRegion(e.target.value as PricingRegion)} className="w-full rounded-lg border border-white/10 bg-white/5 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#4A9B3F]">
                {regionConfigs.map((r) => <option key={r.region} value={r.region} className="bg-[#1A1D27]">{r.label} (&times;{r.priceMultiplier})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Shipping Zone</label>
              <select value={calcZone} onChange={(e) => setCalcZone(e.target.value as ShippingZone)} className="w-full rounded-lg border border-white/10 bg-white/5 text-white text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#4A9B3F]">
                {shippingRates.map((r) => <option key={r.zone} value={r.zone} className="bg-[#1A1D27]">{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded-xl bg-[#1A1D27] border border-white/5 p-5 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-white/40">Base price</span><span className="text-white">&euro;{calcBasePrice.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-white/40">Multiplier</span><span className="text-white">&times;{regionConfigs.find((r) => r.region === calcRegion)!.priceMultiplier}</span></div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-3"><span className="text-white font-semibold">Selling Price</span><span className="text-[#4A9B3F] font-bold">&euro;{margin.sellingPrice.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-white/40">Shipping{shipping.isFree ? " (FREE)" : ""}</span><span className="text-white">&euro;{shipping.cost.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-3"><span className="text-white/40">Platform fee (8%)</span><span className="text-blue-400">&euro;{margin.platformFee.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-white/40">Artisan payout (92%)</span><span className="text-[#4A9B3F]">&euro;{margin.artisanPayout.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-3"><span className="text-white font-semibold">Customer Total</span><span className="text-lg font-bold text-white">&euro;{(margin.sellingPrice + shipping.cost).toFixed(2)}</span></div>
          </div>
        </div>
      </section>

      {/* Products Table */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-4">Product Prices by Region</h2>
        {productsLoading ? (
          <div className="rounded-xl bg-[#1A1D27] border border-white/5 p-8 text-center">
            <p className="text-sm text-white/30 animate-pulse">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl bg-[#1A1D27] border border-white/5 p-8 text-center">
            <p className="text-sm text-white/30">No products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-[#1A1D27] border border-white/5">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-3 py-2.5 text-left font-semibold text-white/40">Product</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-white/40">Base</th>
                  {regionConfigs.map((r) => <th key={r.region} className="px-3 py-2.5 text-right font-semibold text-white/40">{r.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-2 text-white max-w-[160px] truncate">{p.name}</td>
                    <td className="px-3 py-2 text-right text-white/40">&euro;{p.price.toFixed(2)}</td>
                    {regionConfigs.map((r) => (
                      <td key={r.region} className={`px-3 py-2 text-right font-medium ${r.priceMultiplier < 1 ? "text-blue-400" : r.priceMultiplier > 1 ? "text-[#4A9B3F]" : "text-white/60"}`}>
                        &euro;{getRegionalPrice(p.price, r.region).toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
