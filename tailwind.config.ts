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
        // iOS dark-mode surfaces, matching the mobile app token for token.
        base: "#000000",
        elev: {
          1: "#1c1c1e", // cards
          2: "#2c2c2e", // nested / pressed surfaces
          3: "#3a3a3c", // filled-control borders
        },
        // Text hierarchy on dark (iOS label colours).
        label: {
          DEFAULT: "#ffffff",
          2: "#d1d1d6",
          3: "#8e8e93",
          4: "#636366",
        },
        // Accent: iOS system blue, the same one the mobile app uses.
        accent: {
          DEFAULT: "#0a84ff",
          2: "#0071e3",
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
        // Quicksand is the brand face; the platform stack catches the gap
        // while it loads and anywhere it fails.
        sans: [
          "var(--font-quicksand)",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
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
