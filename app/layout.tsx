import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DIMER - Daily NBA Passing Network Game",
  description: "Guess the mystery NBA team from their starting 5 assist network.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0E1016] text-[#EDEFF4]">
        {children}
      </body>
    </html>
  );
}
