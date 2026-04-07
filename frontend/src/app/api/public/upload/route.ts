import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyListingWatermark, getUploadContentType } from "@/lib/listing-watermark";

const BUCKET = "product-images";
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function fileExtension(file: File): string {
  const nameExt = file.name.match(/\.[^.]+$/)?.[0]?.toLowerCase();
  if (nameExt) return nameExt;
  if (file.type === "image/jpeg") return ".jpg";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";
  if (file.type === "image/heic") return ".heic";
  if (file.type === "image/heif") return ".heif";
  return ".jpg";
}

/**
 * Anonymous upload endpoint for listing forms (product/service).
 * Returns a public URL stored in the shared image bucket.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: "Image too large (max 10MB)." }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image format. Use JPEG, PNG, WebP, GIF, HEIC, or HEIF." },
        { status: 400 }
      );
    }

    const baseName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || "listing-image";
    const ext = fileExtension(file);
    const datePrefix = new Date().toISOString().slice(0, 10);
    const filePath = `public-listings/${datePrefix}/${baseName}-${crypto.randomUUID()}${ext}`;

    const supabase = createAdminClient();
    const originalBytes = await file.arrayBuffer();
    const bytes = await applyListingWatermark(originalBytes);
    const contentType = getUploadContentType(file.type);
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, bytes, {
      contentType,
      upsert: false,
    });
    if (uploadError) {
      return NextResponse.json(
        { error: "Upload to storage failed.", detail: uploadError.message },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    return NextResponse.json({ error: "Image upload failed.", detail: String(err) }, { status: 500 });
  }
}
