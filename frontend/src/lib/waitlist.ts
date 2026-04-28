import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function sendWaitlistWelcomeEmail(email: string, role: "buyer" | "seller") {
  const resend = getResend();
  if (!resend) return;

  const roleLine =
    role === "seller"
      ? "Thank you for your interest in selling on PappoShop. Our team will contact you about the next steps for entrepreneur accounts."
      : "Thank you for joining the PappoShop community. You will be the first to hear about marketplace updates and new products.";

  await resend.emails.send({
    from: "PappoShop <noreply@papposhop.org>",
    to: [email],
    subject: "Welcome to PappoShop",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333;">
        <h1 style="color:#4A9B3F;margin:0 0 12px;">Welcome to PappoShop</h1>
        <p style="font-size:16px;line-height:1.6;">${roleLine}</p>
        <p style="font-size:15px;line-height:1.6;">PappoShop brings together entrepreneurs from across the Western Balkans, offering products, goods, and services in one place.</p>
        <p style="font-size:13px;color:#777;margin-top:24px;">This email was sent automatically after your signup.</p>
      </div>
    `,
  });
}

export async function addToWaitlist(
  email: string,
  role: "buyer" | "seller"
): Promise<{ success: boolean; message: string }> {
  const normalized = email.toLowerCase().trim();

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("[waitlist] missing Supabase env (URL or service role key)");
    throw new Error("Waitlist storage is not configured.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("waitlist").insert({
    email: normalized,
    role,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        message: "This email is already on the waitlist.",
      };
    }
    console.error("[waitlist] insert failed:", error.code, error.message);
    throw error;
  }

  try {
    await sendWaitlistWelcomeEmail(normalized, role);
  } catch (emailError) {
    console.error("[waitlist] welcome email failed:", emailError);
  }

  return {
    success: true,
    message:
      "Welcome aboard! You'll be the first to know when PappoShop launches.",
  };
}
