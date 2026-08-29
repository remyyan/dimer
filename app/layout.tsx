import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#121213",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "DIMER - Daily NBA Passing Network Game",
  description: "Guess the mystery NBA team from their starting 5 assist network in 4 tries.",
  applicationName: "DIMER",
  keywords: ["NBA", "basketball", "Wordle", "puzzle", "passing network", "assists", "daily game"],
  authors: [{ name: "DIMER" }],
  openGraph: {
    title: "DIMER - Daily NBA Passing Network Game",
    description: "Guess the mystery NBA team from their starting 5 assist network in 4 tries.",
    type: "website",
    siteName: "DIMER",
  },
  twitter: {
    card: "summary_large_image",
    title: "DIMER - Daily NBA Passing Network Game",
    description: "Guess the mystery NBA team from their starting 5 assist network in 4 tries.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased bg-[#121213]">
      <body className="min-h-full flex flex-col bg-[#121213] text-[#ffffff] selection:bg-[#e65c00] selection:text-white">
        {children}
      </body>
    </html>
  );
}
