/**
 * Which palette the app is wearing.
 *
 * Dark is the home state. Light is a setting, and it is not a nicety: plenty
 * of older eyes read dark text on a light ground more easily than the reverse,
 * cataracts especially, where a bright ground on a dark screen scatters. So
 * the choice belongs to the person using it, and both palettes are held to the
 * same 7:1 floor by contrast.test.ts.
 *
 * Components call `useTheme()` and get a `Palette`. They keep calling the
 * colour `colors`, so the change from a module constant to a hook did not
 * ripple into how any of them are written.
 */
import { createContext, useContext, type ReactNode } from "react";
import { PALETTES, type Palette, type ThemeName } from "./palettes.ts";

export const DEFAULT_THEME: ThemeName = "dark";

const ThemeContext = createContext<Palette>(PALETTES[DEFAULT_THEME]);
const ThemeNameContext = createContext<ThemeName>(DEFAULT_THEME);

export function ThemeProvider({
  name,
  children,
}: {
  name: ThemeName;
  children: ReactNode;
}) {
  return (
    <ThemeNameContext.Provider value={name}>
      <ThemeContext.Provider value={PALETTES[name]}>{children}</ThemeContext.Provider>
    </ThemeNameContext.Provider>
  );
}

/** The palette in force. Named `colors` at the call site, by convention. */
export function useTheme(): Palette {
  return useContext(ThemeContext);
}

/** Which one it is, for the status bar and the setting screen. */
export function useThemeName(): ThemeName {
  return useContext(ThemeNameContext);
}

export const THEME_CHOICES: { name: ThemeName; label: string; hint?: string }[] = [
  { name: "dark", label: "Dark", hint: "The way Rekalla starts" },
  { name: "light", label: "Light" },
];

export type { Palette, ThemeName };
