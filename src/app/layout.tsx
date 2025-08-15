import type { Metadata } from "next";
import "./globals.css";

// Metadata statici di base - i metadata dinamici sono nel layout [locale]
export const metadata: Metadata = {
  title: "GeoGrowth",
  description: "Component maturity tracking application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}