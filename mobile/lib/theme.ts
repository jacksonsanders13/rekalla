/**
 * Design tokens — the same dark Apple-style system as the web app.
 * (elev = surface elevations, label = text hierarchy, tint = iOS accents)
 */
export const colors = {
  base: "#000000",
  elev1: "#1c1c1e",
  elev2: "#2c2c2e",
  elev3: "#3a3a3c",
  label: "#ffffff",
  label2: "#d1d1d6",
  label3: "#8e8e93",
  label4: "#636366",
  green: "#30d158",
  blue: "#0a84ff",
  teal: "#64d2ff",
  orange: "#ff9f0a",
  pink: "#ff375f",
  purple: "#bf5af2",
  yellow: "#ffd60a",
  red: "#ff453a",
} as const;

export const radius = {
  md: 14,
  lg: 20,
  xl: 26,
} as const;

/** Type scale sized for older adults (matches the web app). */
export const font = {
  xs: 13,
  sm: 15,
  base: 17,
  lg: 19,
  xl: 22,
  x2: 26,
  x3: 34,
} as const;

export const spacing = (n: number) => n * 4;
