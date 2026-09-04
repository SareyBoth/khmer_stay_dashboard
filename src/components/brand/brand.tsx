import Link from "next/link";

type BrandProps = { compact?: boolean; inverse?: boolean; href?: string };

export function Brand({ compact = false, inverse = false, href = "/" }: BrandProps) {
  const mark = (
    <span className="inline-flex items-center gap-3">
      <span className={`relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[15px] border ${inverse ? "border-white/15 bg-white/10 text-[#f3d69a]" : "border-[#d9c29a] bg-[#f4ead6] text-[#8e652c]"}`} aria-hidden="true">
        <svg viewBox="0 0 44 44" className="size-9" fill="none">
          <path d="M8 34V20C8 11.7 14.3 6 22 6s14 5.7 14 14v14" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M14 34V20.5C14 15.3 17.5 12 22 12s8 3.3 8 8.5V34" stroke="currentColor" strokeWidth="2" />
          <path d="m17 23 5-4 5 4v10H17V23Z" fill="currentColor" opacity=".92" />
          <path d="M22 28c-2-2.7-5.2-1.8-5.2.5 0 2.7 3.5 4 5.2 5.2 1.7-1.2 5.2-2.5 5.2-5.2 0-2.3-3.2-3.2-5.2-.5Z" fill="#FFFDF8" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className={`block text-[1.22rem] font-extrabold tracking-[-0.04em] ${inverse ? "text-white" : "text-[#2b2118]"}`}>Khmer<span className={inverse ? "text-[#e4c789]" : "text-[#a97936]"}>Stay</span></span>
          <span className={`khmer mt-1 block text-[0.68rem] font-medium tracking-wide ${inverse ? "text-white/60" : "text-[#756d66]"}`}>ផ្ទះស្នាក់នៅខ្មែរ</span>
        </span>
      )}
    </span>
  );
  return href ? <Link href={href} aria-label="KhmerStay home" className="inline-flex rounded-2xl">{mark}</Link> : mark;
}
