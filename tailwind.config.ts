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
        // Warm, calming sage green — the brand color.
        sage: {
          50: "#f4f7f5",
          100: "#e4ece7",
          200: "#c9d9cf",
          300: "#a3bfad",
          400: "#78a087",
          500: "#578569",
          600: "#436a53",
          700: "#375544",
          800: "#2e4538",
          900: "#273a30",
          950: "#142019",
        },
        // Warm neutrals for backgrounds and text.
        sand: {
          50: "#faf9f7",
          100: "#f3f1ec",
          200: "#e5e1d8",
          300: "#d3ccbe",
          400: "#b3a996",
          500: "#9a8e78",
          600: "#83765f",
          700: "#6b604e",
          800: "#585042",
          900: "#494338",
          950: "#26221c",
        },
        // Category accents (kept muted so the UI stays calm).
        clay: {
          50: "#fdf4f3",
          100: "#fbe7e4",
          500: "#c96f5e",
          600: "#b25545",
          700: "#954437",
        },
        sky: {
          50: "#f2f7fb",
          100: "#e3eef6",
          500: "#5b8db8",
          600: "#47749c",
          700: "#3c5f80",
        },
        honey: {
          50: "#fdf9ef",
          100: "#f9efd6",
          500: "#c9962e",
          600: "#a97a24",
          700: "#875e20",
        },
        plum: {
          50: "#f9f5fa",
          100: "#f1e9f3",
          500: "#96699f",
          600: "#7d5386",
          700: "#67446e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      fontSize: {
        // Slightly larger scale than Tailwind defaults — designed for
        // older adults without feeling oversized.
        xs: ["0.8125rem", { lineHeight: "1.25rem" }],
        sm: ["0.9375rem", { lineHeight: "1.5rem" }],
        base: ["1.0625rem", { lineHeight: "1.65rem" }],
        lg: ["1.1875rem", { lineHeight: "1.75rem" }],
        xl: ["1.375rem", { lineHeight: "1.85rem" }],
        "2xl": ["1.625rem", { lineHeight: "2.1rem" }],
        "3xl": ["2rem", { lineHeight: "2.5rem" }],
        "4xl": ["2.5rem", { lineHeight: "3rem" }],
        "5xl": ["3.25rem", { lineHeight: "3.75rem" }],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(38, 34, 28, 0.04), 0 4px 16px rgba(38, 34, 28, 0.06)",
        lifted:
          "0 2px 4px rgba(38, 34, 28, 0.05), 0 12px 32px rgba(38, 34, 28, 0.10)",
        ring: "0 0 0 3px rgba(87, 133, 105, 0.25)",
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
