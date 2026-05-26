/**
 * Client-side image compression utility.
 *
 * Uses the browser Canvas API to resize and re-encode images before upload so
 * they stay well under the reverse-proxy body-size limit (typically 4–10 MB).
 * Large high-resolution photos from professional cameras / editing software can
 * easily exceed those limits and cause a "413 Request Entity Too Large" error.
 */

/** Longest edge limit in pixels.  2 400 px is enough for any product photo. */
const MAX_DIMENSION = 2400;

/** Target size threshold.  Files at or below this are sent as-is. */
const TARGET_MAX_BYTES = 4 * 1024 * 1024; // 4 MB

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Compress and optionally resize an image File client-side.
 *
 * - Files already at or below 4 MB are returned unchanged.
 * - Larger files are drawn onto an off-screen Canvas (resized to ≤ 2 400 px on
 *   the longest side) and re-encoded as JPEG, trying quality levels 0.88 →
 *   0.76 → 0.65 until the result is under 4 MB.
 * - If the browser cannot decode the file format (e.g. HEIC on non-Apple
 *   platforms) or Canvas is unavailable (SSR), the original File is returned
 *   so the upload can still be attempted.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  // Already small enough — nothing to do.
  if (file.size <= TARGET_MAX_BYTES) return file;

  // Canvas is only available in the browser.
  if (typeof document === "undefined") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Browser cannot decode this format (e.g. HEIC on non-Apple platforms).
    return file;
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const outW = Math.max(1, Math.round(width * scale));
  const outH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, outW, outH);
  bitmap.close();

  const outputMime = "image/jpeg";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const outName = `${baseName}.jpg`;

  for (const quality of [0.88, 0.76, 0.65]) {
    const blob = await canvasToBlob(canvas, outputMime, quality);
    if (blob && blob.size <= TARGET_MAX_BYTES) {
      return new File([blob], outName, { type: outputMime });
    }
  }

  // Still over limit at lowest quality — send the compressed version anyway;
  // it is still smaller than the raw original.
  const fallback = await canvasToBlob(canvas, outputMime, 0.65);
  return fallback ? new File([fallback], outName, { type: outputMime }) : file;
}
