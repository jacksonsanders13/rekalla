import type { Metadata, Viewport } from "next";
import { Literata } from "next/font/google";
import "./globals.css";

// A modern serif with short, solid serifs, standing in for Quil Display until
// its licensed files are in the repo. Swap the import and the variable name
// for a next/font/local declaration pointing at the real files.
const serif = Literata({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rekalla",
    template: "%s · Rekalla",
  },
  description:
    "Snap a photo of a paper calendar, an appointment card, or a bill. Rekalla reads the dates and reminds you.",
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
    <html lang="en" className={serif.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
