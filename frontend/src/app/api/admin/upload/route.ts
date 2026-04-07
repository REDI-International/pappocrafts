import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  watermarkListingImage,
  watermarkOutputMimeForUpload,
} from "@/lib/listing-watermark";

const BUCKET = "product-images";

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await validateSession(token);
  if (!session || (session.role !== "superadmin" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, WebP, GIF, or SVG." }, { status: 400 });
    }

    const ext = file.name.match(/\.[^.]+$/)?.[0] || ".png";
    const safeName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 60);
    const filePath = `${safeName}-${Date.now()}${ext}`;

    const supabase = createAdminClient();

    const bytes = await file.arrayBuffer();
    const watermarked = await watermarkListingImage(Buffer.from(bytes), file.type);
    const uploadMime = watermarkOutputMimeForUpload(file.type);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, watermarked, {
        contentType: uploadMime,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Upload to storage failed", detail: uploadError.message },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    return NextResponse.json({ error: "Upload failed", detail: String(err) }, { status: 500 });
  }
}
