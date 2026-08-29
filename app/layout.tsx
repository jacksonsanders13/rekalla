import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Literata } from "next/font/google";
import "./globals.css";

// Two serifs, the way editorial work pairs them: a high-contrast display face
// for headings, and a sturdy text face underneath that stays readable at body
// sizes on a black screen. Both are free stand-ins for the licensed faces
// (Parlour Pro on display, Quil Display on text). To swap in the real ones,
// put the files in public/fonts and use next/font/local here instead.
const serif = Literata({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const displaySerif = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
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
    <html lang="en" className={`${serif.variable} ${displaySerif.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
