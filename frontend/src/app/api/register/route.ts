import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_SELLER_COUNTRIES,
  insertBuyerUser,
  insertSellerUser,
  isValidSellerGender,
  normalizeSellerContactEmail,
  normalizeSellerGender,
  normalizeSellerPhone,
} from "@/lib/admin-user-provision";
import { createVerificationToken, sendVerificationEmail } from "@/lib/email-verification";
import { isSupabaseMissingColumnError } from "@/lib/supabase/admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    const role = String(body.role || "user").trim().toLowerCase();

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (role !== "user" && role !== "seller") {
      return NextResponse.json({ error: "Role must be customer or seller." }, { status: 400 });
    }

    const { token, tokenHash } = createVerificationToken();
    const sentAt = new Date().toISOString();
    const account =
      role === "seller"
        ? await (async () => {
            const businessName = String(body.businessName || body.business_name || "").trim();
            const baseCountry = String(body.baseCountry || body.base_country || "").trim();
            const gender = normalizeSellerGender(body.gender);
            const phone = normalizeSellerPhone(body.phone);
            const contactEmail = normalizeSellerContactEmail(body.contactEmail || body.contact_email || email);
            if (!businessName) return { data: null, error: { code: "VALIDATION", message: "Business name is required." } };
            if (!ALLOWED_SELLER_COUNTRIES.includes(baseCountry as (typeof ALLOWED_SELLER_COUNTRIES)[number])) {
              return { data: null, error: { code: "VALIDATION", message: "Country must be North Macedonia, Serbia, or Albania." } };
            }
            if (!isValidSellerGender(gender)) return { data: null, error: { code: "VALIDATION", message: "Gender is required." } };
            return insertSellerUser({
              email,
              password,
              name,
              businessName,
              baseCountry: baseCountry as (typeof ALLOWED_SELLER_COUNTRIES)[number],
              phone,
              contactEmail,
              gender,
              emailVerified: false,
              verificationTokenHash: tokenHash,
              verificationSentAt: sentAt,
            });
          })()
        : await insertBuyerUser({
            email,
            password,
            name,
            emailVerified: false,
            verificationTokenHash: tokenHash,
            verificationSentAt: sentAt,
          });

    const { data, error } = account;
    if (error) {
      if ("code" in error && error.code === "23505") {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      if (
        isSupabaseMissingColumnError(error, "email_verified") ||
        isSupabaseMissingColumnError(error, "verification_token_hash") ||
        isSupabaseMissingColumnError(error, "verification_sent_at")
      ) {
        return NextResponse.json(
          {
            error:
              "Email verification is not ready yet. Please apply Supabase migration 043_admin_users_email_verification.sql and refresh the Supabase schema cache.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: error.code === "VALIDATION" ? 400 : 500 });
    }

    const emailResult = await sendVerificationEmail({
      email,
      name,
      token,
      role: role as "user" | "seller",
    });
    if (!emailResult.ok) {
      return NextResponse.json(
        {
          error:
            "Account created, but verification email could not be sent. Please contact support.",
          detail: emailResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        email: data?.email || email,
        role,
        message: "Account created. Please check your email and click the verification link before signing in.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
