"use client";

/**
 * Web client for the `assistant` Edge Function + browser speech.
 *
 * The model key is NEVER here — we call our own Edge Function via
 * supabase.functions.invoke (forwards the user's JWT). Web gets REAL voice
 * input via the Web Speech API (SpeechRecognition), plus spoken output via
 * SpeechSynthesis.
 */
import { createClient } from "@/lib/supabase/client";
import type { AssistantRequest, AssistantResponse } from "@/lib/v2-types";

export async function askAssistant(req: AssistantRequest): Promise<AssistantResponse> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke<AssistantResponse>("assistant", {
    body: req,
  });
  if (error) throw error;
  if (!data) throw new Error("empty assistant response");
  return data;
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// Minimal typing for the vendor-prefixed SpeechRecognition API.
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};

export function isVoiceInputSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

/** Start dictation; resolves the final transcript. Caller shows the mic state. */
export function startDictation(
  onFinal: (text: string) => void,
  onEnd: () => void,
): { stop: () => void } | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
      .SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.onresult = (e) => {
    const transcript = e.results?.[0]?.[0]?.transcript ?? "";
    if (transcript) onFinal(transcript);
  };
  rec.onend = onEnd;
  rec.onerror = onEnd;
  rec.start();
  return { stop: () => rec.stop() };
}
