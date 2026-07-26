import type { Metadata } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: {
    default: "2dcite — Independent Citation Review",
    template: "%s · 2dcite",
  },
  description:
    "Match attorneys and judges with qualified law students for independent human-in-the-loop citation review. Certificate of Citation Review for risk mitigation — liability remains with the licensed attorney or judge.",
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
        {children}
      </body>
    </html>
  );
}
