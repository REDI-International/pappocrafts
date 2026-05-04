"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSiteSettings } from "@/lib/site-settings-context";

export default function LoginPage() {
  const router = useRouter();
  const { logo_url } = useSiteSettings();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registerRole, setRegisterRole] = useState<"user" | "seller">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [baseCountry, setBaseCountry] = useState("North Macedonia");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      localStorage.setItem("admin-token", data.token);
      localStorage.setItem(
        "admin-user",
        JSON.stringify({
          email: data.email,
          role: data.role,
          name: data.name,
          userId: data.userId ?? null,
        })
      );

      if (data.role === "superadmin" || data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/account");
      }
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: registerRole,
          businessName,
          baseCountry,
          phone,
          gender,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not create account.");
        setLoading(false);
        return;
      }

      setInfo(data.message || "Account created. Please check your email to verify your account.");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f6f3] via-white to-[#f0ede8] flex flex-col">
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-charcoal/50 hover:text-charcoal transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to shop
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <Image
                src={logo_url}
                alt="PappoShop"
                width={260}
                height={78}
                className="h-16 sm:h-[4.25rem] w-auto mx-auto"
                priority
                unoptimized
              />
            </Link>
            <h1 className="mt-6 text-2xl font-bold text-charcoal">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="mt-2 text-sm text-charcoal/50">
              {mode === "login"
                ? "Sign in to your PappoShop account, or create a customer/entrepreneur account below."
                : "Choose Customer or Entrepreneur below, create your account, then verify your email before signing in."}
            </p>
          </div>

          <form onSubmit={mode === "login" ? handleSubmit : handleRegister} className="bg-white rounded-2xl border border-charcoal/8 shadow-lg shadow-charcoal/5 p-8">
            <div className="space-y-5">
              {mode === "register" && (
                <>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-light/70 p-1">
                    {[
                      { value: "user", label: "Customer" },
                      { value: "seller", label: "Entrepreneur" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRegisterRole(option.value as "user" | "seller")}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                          registerRole === option.value ? "bg-green text-white" : "text-charcoal/60 hover:bg-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-charcoal/70 mb-1.5">
                      Full name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-green/40 focus:border-green/40 transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  {registerRole === "seller" && (
                    <>
                      <div>
                        <label htmlFor="business-name" className="block text-sm font-medium text-charcoal/70 mb-1.5">
                          Business / shop name
                        </label>
                        <input
                          id="business-name"
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-green/40 focus:border-green/40 transition-all"
                          placeholder="Your shop name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="country" className="block text-sm font-medium text-charcoal/70 mb-1.5">
                            Country
                          </label>
                          <select
                            id="country"
                            value={baseCountry}
                            onChange={(e) => setBaseCountry(e.target.value)}
                            className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-green/40 focus:border-green/40 transition-all"
                          >
                            <option>North Macedonia</option>
                            <option>Serbia</option>
                            <option>Albania</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="gender" className="block text-sm font-medium text-charcoal/70 mb-1.5">
                            Gender
                          </label>
                          <select
                            id="gender"
                            required
                            value={gender}
                            onChange={(e) => setGender(e.target.value as "M" | "F" | "")}
                            className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-green/40 focus:border-green/40 transition-all"
                          >
                            <option value="">Select</option>
                            <option value="M">Male (M)</option>
                            <option value="F">Female (F)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-charcoal/70 mb-1.5">
                          Phone
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-green/40 focus:border-green/40 transition-all"
                          placeholder="+389..."
                        />
                      </div>
                    </>
                  )}
                </>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-charcoal/70 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-green/40 focus:border-green/40 transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-charcoal/70 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 pr-11 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-green/40 focus:border-green/40 transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal/60 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {mode === "register" && (
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-charcoal/70 mb-1.5">
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-green/40 focus:border-green/40 transition-all"
                    placeholder="Repeat your password"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200/60 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {info && (
              <div className="mt-4 rounded-xl bg-green/5 border border-green/20 px-4 py-3">
                <p className="text-sm text-green">{info}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-green py-3 text-sm font-semibold text-white shadow-sm shadow-green/25 hover:bg-green-dark disabled:opacity-50 transition-all"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                mode === "login" ? "Sign in" : "Create account"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode((m) => (m === "login" ? "register" : "login"));
                setError("");
                setInfo("");
              }}
              className="mt-4 w-full text-sm font-medium text-green hover:text-green-dark"
            >
              {mode === "login" ? "Create an account" : "Already have an account? Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-charcoal/30">
              Customer and entrepreneur accounts require email verification before sign-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
