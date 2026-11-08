import Link from "next/link";
import { Landmark } from "lucide-react";

type BrandProps = { compact?: boolean; inverse?: boolean; href?: string };

export function Brand({
  compact = false,
  inverse = false,
  href = "/",
}: BrandProps) {
  const mark = (
    <span className="inline-flex items-center gap-3">
      <span
        className={`relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[15px] border ${inverse ? "border-white/15 bg-white/10 text-[#f3d69a]" : "border-[#d9c29a] bg-[#f4ead6] text-[#8e652c]"}`}
        aria-hidden="true"
      >
        <Landmark className="size-7" strokeWidth={1.9} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span
            className={`block text-[1.22rem] font-extrabold tracking-[-0.04em] ${inverse ? "text-white" : "text-[#2b2118]"}`}
          >
            Khmer
            <span className={inverse ? "text-[#e4c789]" : "text-[#a97936]"}>
              Stay
            </span>
          </span>
          <span
            className={`khmer mt-1 block text-[0.68rem] font-medium tracking-wide ${inverse ? "text-white/60" : "text-[#756d66]"}`}
          >
            ផ្ទះស្នាក់នៅខ្មែរ
          </span>
        </span>
      )}
    </span>
  );
  return href ? (
    <Link
      href={href}
      aria-label="KhmerStay home"
      className="inline-flex rounded-2xl"
    >
      {mark}
    </Link>
  ) : (
    mark
  );
}
