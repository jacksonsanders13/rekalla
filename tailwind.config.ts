import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium near-black surfaces (Linear/Vercel-style), not pure black.
        base: "#0a0a0c",
        elev: {
          1: "#161619", // cards
          2: "#212127", // nested / pressed surfaces
          3: "#2e2e36", // filled-control borders
        },
        // Text hierarchy on dark.
        label: {
          DEFAULT: "#f7f7f8",
          2: "#c7c7cf",
          3: "#8a8a94",
          4: "#5c5c66",
        },
        // Brand accent — a soft violet→indigo, used for the send button + glow.
        accent: {
          DEFAULT: "#8b7cff",
          2: "#6a5bff",
        },
        // iOS system tints, dark-mode variants.
        tint: {
          green: "#30d158",
          blue: "#0a84ff",
          teal: "#64d2ff",
          orange: "#ff9f0a",
          pink: "#ff375f",
          purple: "#bf5af2",
          yellow: "#ffd60a",
          red: "#ff453a",
        },
      },
      fontFamily: {
        // Geist (Vercel's typeface) first for a modern, premium feel; falls
        // back to the platform system stack.
        sans: [
          "var(--font-geist-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        // Larger-than-default scale, sized for older adults.
        xs: ["0.8125rem", { lineHeight: "1.25rem" }],
        sm: ["0.9375rem", { lineHeight: "1.5rem" }],
        base: ["1.0625rem", { lineHeight: "1.6rem" }],
        lg: ["1.1875rem", { lineHeight: "1.75rem" }],
        xl: ["1.375rem", { lineHeight: "1.85rem" }],
        "2xl": ["1.625rem", { lineHeight: "2.1rem" }],
        "3xl": ["2.125rem", { lineHeight: "2.55rem" }],
        "4xl": ["2.75rem", { lineHeight: "3.2rem" }],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.625rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out both",
        "fade-up": "fade-up 0.4s ease-out both",
        "scale-in": "scale-in 0.2s ease-out both",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
