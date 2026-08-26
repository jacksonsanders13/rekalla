/**
 * Client wrapper for the `assistant` Edge Function.
 *
 * The model API key is NEVER here. This only calls our own Edge Function via
 * supabase.functions.invoke, which forwards the user's JWT. All scoping, tier
 * classification, and escalation happen server-side.
 */
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
