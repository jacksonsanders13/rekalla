/**
 * The tap you feel.
 *
 * Two signals, and the absence of a third is the important part:
 *
 *   - `feltTap` fires when an answer is chosen, whatever it turns out to be.
 *     It acknowledges the tap, not the outcome, so it cannot be read as a
 *     verdict arriving before the answer does.
 *   - `feltRight` fires on a correct answer, and is the only celebratory one.
 *   - **Nothing fires on a wrong answer.** A buzz is a judgement, and this app
 *     does not pass judgement on somebody for not recalling the thing they
 *     came here because they cannot recall. The screen already says the answer
 *     warmly; a vibration would undo that in a way words could not repair.
 *
 * Every call is guarded and swallowed. A phone with no motor, a simulator, or
 * the browser should all behave exactly as if the haptics simply did not
 * happen, because next to the practice itself they do not matter.
 */
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const AVAILABLE = Platform.OS !== "web";

/** Acknowledges a choice. Neutral: it says nothing about the answer. */
export async function feltTap(enabled: boolean): Promise<void> {
  if (!enabled || !AVAILABLE) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // A phone without a taptic engine is not a problem to report.
  }
}

/** The one celebratory signal. Correct answers only. */
export async function feltRight(enabled: boolean): Promise<void> {
  if (!enabled || !AVAILABLE) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // As above.
  }
}
