/**
 * Client wrapper for the `assistant` Edge Function + spoken output.
 *
 * The model API key is NEVER here — this only calls our own Edge Function via
 * supabase.functions.invoke, which forwards the user's JWT. All scoping, tier
 * classification, and escalation happen server-side.
 */
import * as Speech from "expo-speech";
import { supabase } from "./supabase";
import type { AssistantRequest, AssistantResponse } from "./v2-types";

export async function askAssistant(
  req: AssistantRequest,
): Promise<AssistantResponse> {
  const { data, error } = await supabase.functions.invoke<AssistantResponse>(
    "assistant",
    { body: req },
  );
  if (error) throw error;
  if (!data) throw new Error("empty assistant response");
  return data;
}

/** Speak a reply aloud. Older adults benefit from spoken output (Part D). */
export function speak(text: string) {
  Speech.stop();
  Speech.speak(text, { rate: 0.95, pitch: 1.0 });
}

export function stopSpeaking() {
  Speech.stop();
}
