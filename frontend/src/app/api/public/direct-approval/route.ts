import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function htmlPage(title: string, heading: string, body: string, isError = false) {
  const color = isError ? "#c0392b" : "#4A9B3F";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — PappoShop</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
         background:#f7f7f5;color:#2D2D2D;display:flex;align-items:center;
         justify-content:center;min-height:100vh;margin:0;padding:20px;}
    .card{background:#fff;border-radius:12px;padding:40px 48px;max-width:480px;
          width:100%;box-shadow:0 2px 16px rgba(0,0,0,.08);text-align:center;}
    .icon{font-size:48px;margin-bottom:16px;}
    h1{margin:0 0 12px;font-size:22px;color:${color};}
    p{margin:0 0 8px;line-height:1.6;color:#555;font-size:15px;}
    .meta{margin-top:20px;font-size:13px;color:#999;border-top:1px solid #eee;
          padding-top:16px;}
    a{color:${color};text-decoration:none;}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isError ? "⚠️" : heading.startsWith("Approved") ? "✅" : "🚫"}</div>
    <h1>${heading}</h1>
    ${body}
    <div class="meta">
      <a href="https://papposhop.org">papposhop.org</a>
    </div>
  </div>
</body>
</html>`;
}

/**
 * GET /api/public/direct-approval?token=UUID&action=approve|reject&type=product|service
 *
 * Email-link endpoint that lets regional reviewers approve or reject a pending
 * product or service listing request without logging into the admin UI.
 * The token is a secret UUID stored on the record — it serves as the credential.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();
  const action = searchParams.get("action")?.trim();
  const type = (searchParams.get("type")?.trim() || "product") as "product" | "service";

  if (!token) {
    return new NextResponse(
      htmlPage("Invalid link", "Invalid link", "<p>No approval token provided.</p>", true),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
  if (action !== "approve" && action !== "reject") {
    return new NextResponse(
      htmlPage("Invalid action", "Invalid action", "<p>Action must be <em>approve</em> or <em>reject</em>.</p>", true),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  let db;
  try {
    db = createAdminClient();
  } catch {
    return new NextResponse(
      htmlPage("Configuration error", "Server error", "<p>Database client could not be initialised. Contact a system administrator.</p>", true),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (type === "service") {
    return handleServiceApproval(db, token, action);
  }
  return handleProductApproval(db, token, action);
}

async function handleProductApproval(
  db: ReturnType<typeof createAdminClient>,
  token: string,
  action: "approve" | "reject"
) {
  const { data: product, error: fetchError } = await db
    .from("products")
    .select("id, name, artisan, approval_status, country")
    .eq("approval_token", token)
    .maybeSingle();

  if (fetchError || !product) {
    return new NextResponse(
      htmlPage("Link not found", "Link not found", "<p>This approval link is invalid or has expired.</p>", true),
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (product.approval_status !== "pending") {
    const already = product.approval_status === "approved" ? "already approved" : "already rejected";
    return new NextResponse(
      htmlPage(
        "Already reviewed",
        "Already reviewed",
        `<p>This product (<strong>${escapeHtml(product.name)}</strong>) has been ${already}. No further action is needed.</p>`
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const newStatus = action === "approve" ? "approved" : "rejected";
  const { error: updateError } = await db
    .from("products")
    .update({ approval_status: newStatus, reviewed_at: new Date().toISOString() })
    .eq("id", product.id);

  if (updateError) {
    return new NextResponse(
      htmlPage("Error", "Could not update status", `<p>${escapeHtml(updateError.message)}</p>`, true),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const heading = action === "approve" ? "Approved ✓" : "Rejected";
  const message =
    action === "approve"
      ? `<p>The product <strong>${escapeHtml(product.name)}</strong> by <strong>${escapeHtml(product.artisan ?? "")}</strong> is now <strong>live</strong> on PappoShop.</p>`
      : `<p>The product <strong>${escapeHtml(product.name)}</strong> by <strong>${escapeHtml(product.artisan ?? "")}</strong> has been <strong>rejected</strong> and will not appear in the shop.</p>`;

  return new NextResponse(
    htmlPage(
      action === "approve" ? "Approved" : "Rejected",
      heading,
      message
    ),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

async function handleServiceApproval(
  db: ReturnType<typeof createAdminClient>,
  token: string,
  action: "approve" | "reject"
) {
  const { data: req, error: fetchError } = await db
    .from("service_listing_requests")
    .select("*")
    .eq("approval_token", token)
    .maybeSingle();

  if (fetchError || !req) {
    return new NextResponse(
      htmlPage("Link not found", "Link not found", "<p>This approval link is invalid or has expired.</p>", true),
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const row = req as Record<string, unknown>;

  if (row.status !== "pending") {
    const already = row.status === "approved" ? "already approved" : "already rejected";
    return new NextResponse(
      htmlPage(
        "Already reviewed",
        "Already reviewed",
        `<p>This service request (<strong>${escapeHtml(String(row.service_title ?? ""))}</strong>) has been ${already}. No further action is needed.</p>`
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const newStatus = action === "approve" ? "approved" : "rejected";
  const { error: updateError } = await db
    .from("service_listing_requests")
    .update({ status: newStatus })
    .eq("id", row.id);

  if (updateError) {
    return new NextResponse(
      htmlPage("Error", "Could not update status", `<p>${escapeHtml(updateError.message)}</p>`, true),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // When approved, auto-publish to the public services table (same logic as admin PATCH).
  if (action === "approve") {
    const contactEmail = String(row.contact_email || "").trim().toLowerCase();
    let sellerId: string | null = null;

    if (contactEmail) {
      const { data: sellerMatch } = await db
        .from("admin_users")
        .select("id, role")
        .eq("email", contactEmail)
        .in("role", ["seller", "admin", "superadmin"])
        .maybeSingle();
      sellerId = (sellerMatch?.id as string | undefined) ?? null;
    }

    const hourlyRaw = row.hourly_rate;
    const hourlyRate =
      typeof hourlyRaw === "number"
        ? hourlyRaw
        : typeof hourlyRaw === "string"
          ? Number(hourlyRaw)
          : 0;
    const requestId = String(row.id || "").trim();

    await db.from("services").upsert(
      {
        id: `service-request-${requestId}`,
        name: String(row.contact_name || row.service_title || "Service Provider").trim(),
        provider_name: String(row.contact_name || "").trim(),
        title: String(row.service_title || "").trim(),
        summary: String(row.service_description || "").trim(),
        description: String(row.service_description || "").trim(),
        long_description: String(row.service_description || "").trim(),
        category: String(row.service_category || "").trim(),
        hourly_rate: Number.isFinite(hourlyRate) ? Math.max(0, hourlyRate) : 0,
        currency: String(row.currency || "EUR").trim().toUpperCase() || "EUR",
        location: String(row.location || "").trim(),
        country: String(row.country || "").trim(),
        phone: String(row.contact_phone || "").trim(),
        image: String(row.image_url || "").trim(),
        available: true,
        response_time: "Within 24 hours",
        completed_jobs: 0,
        seller_id: sellerId,
        badges: [],
      },
      { onConflict: "id" }
    );
  }

  const title = String(row.service_title ?? "");
  const provider = String(row.contact_name ?? "");
  const heading = action === "approve" ? "Approved ✓" : "Rejected";
  const message =
    action === "approve"
      ? `<p>The service <strong>${escapeHtml(title)}</strong> by <strong>${escapeHtml(provider)}</strong> is now <strong>live</strong> on PappoShop.</p>`
      : `<p>The service request <strong>${escapeHtml(title)}</strong> by <strong>${escapeHtml(provider)}</strong> has been <strong>rejected</strong>.</p>`;

  return new NextResponse(
    htmlPage(action === "approve" ? "Approved" : "Rejected", heading, message),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
