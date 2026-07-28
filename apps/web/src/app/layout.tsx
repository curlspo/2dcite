import type { Metadata } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";
import { SkipLink } from "@/components/a11y/SkipLink";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default:
      "2dcite — Human in the Loop independent review of legal citations",
    template: "%s · 2dcite",
  },
  description:
    "Human in the Loop independent review of legal citations by qualified, vetted law students. For attorneys and judges. Certificate of Citation Review; not legal advice. Liability remains with the licensed professional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${sourceSerif.variable} min-h-screen antialiased`}
      >
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
