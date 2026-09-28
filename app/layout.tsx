import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

// Quicksand: rounded geometric letterforms that match the mascot's shapes and
// stay legible at the larger sizes this app sets. 700 is the heaviest weight
// loaded on purpose, since nothing in the design goes above it.
const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rekalla",
    template: "%s · Rekalla",
  },
  description:
    "Gentle reminders, daily routines, and caregiver coordination that help older adults live independently with confidence.",
  appleWebApp: {
    capable: true,
    title: "Rekalla",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={quicksand.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
