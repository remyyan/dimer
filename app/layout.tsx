import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://dimer.me"),
  title: "DIMER - Daily NBA Passing Network Game",
  description:
    "Guess the mystery NBA team from their starting 5 assist network in 4 tries.",
  applicationName: "DIMER",
  keywords: [
    "NBA",
    "basketball",
    "Wordle",
    "puzzle",
    "passing network",
    "assists",
    "daily game",
  ],
  alternates: {
    canonical: "https://dimer.me",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/icon.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/icon.png?v=2",
  },
  openGraph: {
    title: "DIMER - Daily NBA Passing Network Game",
    description:
      "Guess the mystery NBA team from their starting 5 assist network in 4 tries.",
    url: "https://dimer.me",
    type: "website",
    siteName: "DIMER",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "DIMER - Daily NBA Passing Network Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DIMER - Daily NBA Passing Network Game",
    description:
      "Guess the mystery NBA team from their starting 5 assist network in 4 tries.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${mono.variable}`}
    >
      <body className="min-h-full flex flex-col bg-black text-neutral-200 font-sans selection:bg-neutral-800 selection:text-white">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
