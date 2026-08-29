import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
  authors: [{ name: "DIMER" }],
  openGraph: {
    title: "DIMER - Daily NBA Passing Network Game",
    description:
      "Guess the mystery NBA team from their starting 5 assist network in 4 tries.",
    type: "website",
    siteName: "DIMER",
  },
  twitter: {
    card: "summary_large_image",
    title: "DIMER - Daily NBA Passing Network Game",
    description:
      "Guess the mystery NBA team from their starting 5 assist network in 4 tries.",
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
      </body>
    </html>
  );
}
