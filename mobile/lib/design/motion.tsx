/**
 * Motion, and the setting that switches it off.
 *
 * Everything animated in this app is decoration on top of something that is
 * already legible without it. When Reduce Motion is on, the animation does
 * not happen and no information goes with it: the colour change and the words
 * carry the whole message on their own.
 */
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Transitions, in milliseconds. */
export const DURATION = {
  quick: 150,
  settle: 250,
} as const;

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduce(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => setReduce(enabled),
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return reduce;
}
