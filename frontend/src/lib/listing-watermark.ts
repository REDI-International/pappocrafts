import sharp from "sharp";

const WATERMARK_LOGO_URL = "https://papposhop.org/pappocrafts-logo.png";
const FALLBACK_MIME = "image/jpeg";

function normalizeOutputMime(inputMime: string): string {
  if (inputMime === "image/png") return "image/png";
  if (inputMime === "image/webp") return "image/webp";
  return FALLBACK_MIME;
}

function applyOutputFormat(image: sharp.Sharp, mime: string): sharp.Sharp {
  if (mime === "image/png") return image.png({ compressionLevel: 9 });
  if (mime === "image/webp") return image.webp({ quality: 88 });
  return image.jpeg({ quality: 88, mozjpeg: true });
}

function formatSuffixForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function outputExtensionForWatermarkMime(mime: string): string {
  return `.${formatSuffixForMime(mime)}`;
}

export async function applyPappoListingWatermark(
  source: ArrayBufferLike,
  inputMime: string
): Promise<{ bytes: Buffer; mime: string }> {
  const outputMime = normalizeOutputMime(inputMime);
  const sourceBuffer = Buffer.from(new Uint8Array(source));
  const baseImage = sharp(sourceBuffer, { failOn: "none" });
  const meta = await baseImage.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width <= 0 || height <= 0) {
    throw new Error("Could not read uploaded image dimensions.");
  }

  const markWidth = Math.max(64, Math.round(width * 0.22));
  const logoResponse = await fetch(WATERMARK_LOGO_URL);
  if (!logoResponse.ok) {
    throw new Error(`Failed to fetch watermark logo (${logoResponse.status}).`);
  }
  const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
  const logoMeta = await sharp(logoBuffer).metadata();
  const logoWidth = logoMeta.width ?? markWidth;
  const logoHeight = logoMeta.height ?? Math.max(1, Math.round(markWidth * 0.3));
  const resizedHeight = Math.max(1, Math.round((markWidth / logoWidth) * logoHeight));

  const margin = Math.max(10, Math.round(width * 0.02));
  const watermarkLayer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(logoBuffer)
          .resize({ width: markWidth, height: resizedHeight, fit: "inside" })
          .ensureAlpha()
          .modulate({ brightness: 1 })
          .png()
          .toBuffer(),
        top: Math.max(0, height - resizedHeight - margin),
        left: Math.max(0, width - markWidth - margin),
      },
    ])
    .png()
    .toBuffer();

  const rendered = applyOutputFormat(
    sharp(sourceBuffer, { failOn: "none" }).composite([
      {
        input: watermarkLayer,
      },
    ]),
    outputMime
  );
  const bytes = await rendered.toBuffer();
  return { bytes, mime: outputMime };
}

/**
 * Backward-compatible helper used by existing upload routes.
 */
export function getUploadContentType(inputMime: string): string {
  return normalizeOutputMime(inputMime);
}

/**
 * Backward-compatible helper used by existing upload routes.
 */
export function watermarkOutputMimeForUpload(inputMime: string): string {
  return normalizeOutputMime(inputMime);
}

/**
 * Backward-compatible helper used by existing upload routes.
 */
export async function watermarkListingImage(
  source: ArrayBuffer | Buffer,
  inputMime: string
): Promise<Buffer> {
  const asArrayBuffer =
    source instanceof ArrayBuffer
      ? source
      : source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const normalizedArrayBuffer =
    asArrayBuffer instanceof ArrayBuffer ? asArrayBuffer : new Uint8Array(asArrayBuffer).buffer;
  const { bytes } = await applyPappoListingWatermark(normalizedArrayBuffer, inputMime);
  return bytes;
}

/**
 * Backward-compatible helper used by existing upload routes.
 */
export async function applyListingWatermark(
  source: ArrayBuffer | Buffer,
  inputMime = FALLBACK_MIME
): Promise<Buffer> {
  return watermarkListingImage(source, inputMime);
}
