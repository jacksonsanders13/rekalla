import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rekalla",
    template: "%s · Rekalla",
  },
  description:
    "A warm, simple AI assistant for older adults — it knows your family, your week, and your appointments, and helps keep you safe.",
  appleWebApp: {
    capable: true,
    title: "Rekalla",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
