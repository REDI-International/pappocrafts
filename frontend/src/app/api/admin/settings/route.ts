import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-store";
import { SITE_LOGO_URL } from "@/lib/site-logo";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

const DEFAULT_SETTINGS: Record<string, string> = {
  logo_url: SITE_LOGO_URL,
  hero_badge: "Western Balkans Marketplace",
  hero_title1: "Handcrafted with",
  hero_title2: "Heart & Heritage",
  hero_description:
    "Discover authentic products and local services from Roma entrepreneurs across the Western Balkans. Every purchase supports livelihoods and preserves cultural traditions.",
  footer_description:
    "A marketplace that brings together entrepreneurs from across the Western Balkans, offering products, goods, and services in one place.",
  mission_badge: "",
  mission_title: "",
  mission_desc1: "",
  mission_desc2: "",
};

export async function GET(request: NextRequest) {
  try {
    const db = createAdminClient();
    const { data } = await db.from("site_settings").select("key, value");
    if (data && data.length > 0) {
      const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
      for (const row of data) {
        settings[row.key] = row.value;
      }
      return NextResponse.json(settings);
    }
  } catch {
    // fall through to defaults
  }
  return NextResponse.json(DEFAULT_SETTINGS);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("logo") as File | null;
      const settingsJson = formData.get("settings") as string | null;

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = path.extname(file.name) || ".png";
        const filename = `logo-${Date.now()}${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);
        const logoUrl = `/uploads/${filename}`;

        try {
          const db = createAdminClient();
          await db
            .from("site_settings")
            .upsert({ key: "logo_url", value: logoUrl, updated_at: new Date().toISOString() });
        } catch {
          // save locally even if DB fails
        }
      }

      if (settingsJson) {
        const updates = JSON.parse(settingsJson) as Record<string, string>;
        try {
          const db = createAdminClient();
          const rows = Object.entries(updates).map(([key, value]) => ({
            key,
            value,
            updated_at: new Date().toISOString(),
          }));
          if (rows.length > 0) {
            await db.from("site_settings").upsert(rows);
          }
        } catch {
          // ignore DB errors
        }
      }
    } else {
      const updates = await request.json();
      try {
        const db = createAdminClient();
        const rows = Object.entries(updates).map(([key, value]) => ({
          key,
          value: String(value),
          updated_at: new Date().toISOString(),
        }));
        if (rows.length > 0) {
          await db.from("site_settings").upsert(rows);
        }
      } catch {
        // ignore DB errors
      }
    }

    const res = await GET(request);
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update settings", detail: String(err) },
      { status: 500 }
    );
  }
}
