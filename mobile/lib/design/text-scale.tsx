/**
 * The in-app text size setting.
 *
 * iOS Dynamic Type already scales every size in the app, and this multiplies
 * on top of it, for someone who has already turned the system size up as far
 * as it goes and still wants more. Kept separate from the practice state so
 * that a plain piece of text does not have to know what a practice session
 * is.
 */
import { createContext, useContext, type ReactNode } from "react";

const TextScaleContext = createContext(1);

export const TEXT_SCALE_CHOICES = [
  { label: "Normal", value: 1 },
  { label: "Large", value: 1.15 },
  { label: "Largest", value: 1.3 },
] as const;

export function TextScaleProvider({
  scale,
  children,
}: {
  scale: number;
  children: ReactNode;
}) {
  return (
    <TextScaleContext.Provider value={scale}>{children}</TextScaleContext.Provider>
  );
}

export function useTextScale(): number {
  return useContext(TextScaleContext);
}
