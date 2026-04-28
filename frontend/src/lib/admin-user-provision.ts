import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugifyBusinessName } from "@/lib/slug";

export const ALLOWED_SELLER_COUNTRIES = ["North Macedonia", "Serbia", "Albania"] as const;
export type SellerCountry = (typeof ALLOWED_SELLER_COUNTRIES)[number];

export function normalizeSellerPhone(raw: unknown): string {
  return String(raw ?? "").trim();
}

export function isValidSellerPhone(phone: string): boolean {
  return phone.trim().length >= 6;
}

export type SellerGender = "M" | "F";

export function normalizeSellerGender(raw: unknown): SellerGender | "" {
  const value = String(raw ?? "").trim().toUpperCase();
  if (value === "M" || value === "MALE") return "M";
  if (value === "F" || value === "FEMALE") return "F";
  return "";
}

export function isValidSellerGender(gender: string): gender is SellerGender {
  return gender === "M" || gender === "F";
}

export function normalizeSellerContactEmail(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

export function isValidSellerContactEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sha256Password(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function nextUniqueBusinessSlug(
  db: ReturnType<typeof createAdminClient>,
  businessName: string,
  excludeUserId?: string | null
): Promise<string> {
  const baseSlug = slugifyBusinessName(businessName);
  let slug = baseSlug;
  for (let i = 0; i < 20; i++) {
    let q = db.from("admin_users").select("id").eq("business_slug", slug);
    if (excludeUserId) q = q.neq("id", excludeUserId);
    const { data: existing } = await q.maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i + 2}`;
  }
  return slug;
}

export async function insertSellerUser(input: {
  email: string;
  password: string;
  name: string;
  businessName: string;
  baseCountry: SellerCountry;
  phone?: string;
  contactEmail: string;
  gender: SellerGender;
}) {
  const db = createAdminClient();
  const email = input.email.trim().toLowerCase();
  const businessName = input.businessName.trim();
  const phone = String(input.phone ?? "").trim();
  const slug = await nextUniqueBusinessSlug(db, businessName);
  const { data, error } = await db
    .from("admin_users")
    .insert({
      email,
      password_hash: sha256Password(input.password),
      role: "seller",
      name: input.name.trim(),
      business_name: businessName,
      business_slug: slug,
      base_country: input.baseCountry,
      phone,
      contact_email: input.contactEmail.trim().toLowerCase(),
      gender: input.gender,
    })
    .select("id, email, name, business_name, business_slug, base_country, phone, contact_email, gender")
    .single();
  return { data, error };
}

export async function insertBuyerUser(input: { email: string; password: string; name: string }) {
  const db = createAdminClient();
  const email = input.email.trim().toLowerCase();
  const { data, error } = await db
    .from("admin_users")
    .insert({
      email,
      password_hash: sha256Password(input.password),
      role: "user",
      name: input.name.trim(),
    })
    .select("id, email, name, role")
    .single();
  return { data, error };
}
