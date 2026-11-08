import type { Metadata } from "next";
import { Manrope, Noto_Sans_Khmer } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-latin",
  subsets: ["latin"],
  display: "swap",
});
const notoKhmer = Noto_Sans_Khmer({
  variable: "--font-khmer",
  subsets: ["khmer"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KhmerStay — ផ្ទះស្នាក់នៅខ្មែរ",
    template: "%s · KhmerStay",
  },
  description:
    "Local demo workspace for KhmerStay property owners and platform administrators.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="km"
      className={`${manrope.variable} ${notoKhmer.variable} font-sans`}
    >
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
