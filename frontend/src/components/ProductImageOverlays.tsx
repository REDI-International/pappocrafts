interface ProductImageOverlaysProps {
  womenLed?: boolean;
  watermarkSize?: "sm" | "md";
  compact?: boolean;
}

export default function ProductImageOverlays({
  womenLed = false,
  watermarkSize = "sm",
  compact = false,
}: ProductImageOverlaysProps) {
  const sizeClass =
    watermarkSize === "md"
      ? "px-3 py-1.5 text-xs"
      : "px-1.5 py-0.5 text-[8px]";
  const womenLabelClass = compact
    ? "px-1.5 py-0.5 text-[8px]"
    : "px-2.5 py-1 text-[10px]";

  return (
    <>
      {womenLed && (
        <span className={`absolute left-2 top-2 z-10 max-w-[85%] rounded-full bg-[#4A9B3F] font-bold uppercase tracking-wide text-white shadow-md ${womenLabelClass}`}>
          {compact ? "Women-led" : "Women Entrepreneurship"}
        </span>
      )}
      <span
        aria-hidden="true"
        className={`absolute bottom-2 right-2 z-10 rounded-full bg-charcoal/65 font-bold tracking-wide text-white shadow-sm backdrop-blur-sm ${sizeClass}`}
      >
        <span className="text-[#8BC34A]">Pappo</span>Shop
      </span>
    </>
  );
}
