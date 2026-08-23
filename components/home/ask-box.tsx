"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { useAssistant } from "@/hooks/use-assistant-v2";
import { speak } from "@/lib/assistant-client";

const EXAMPLES = [
  "What's my next appointment?",
  "Whose birthday is coming up?",
  "What's on my calendar this week?",
];

export function AskBox() {
  const ask = useAssistant();
  const [input, setInput] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  function send(text: string) {
    const q = text.trim();
    if (!q || ask.isPending) return;
    setAsked(q);
    setInput("");
    setAnswer(null);
    ask.mutate(
      { user_message: q },
      {
        onSuccess: (res) => {
          setAnswer(res.reply);
          speak(res.reply);
        },
        onError: () => setAnswer("Sorry, I had trouble just now. Please try again."),
      },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-[24px] border border-white/10 bg-elev-1 py-2 pl-5 pr-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask about your calendar…"
          aria-label="Ask Rekalla about your calendar"
          className="flex-1 bg-transparent py-2 text-lg text-label placeholder:text-label-4 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={ask.isPending || !input.trim()}
          aria-label="Ask"
          className="flex size-12 items-center justify-center rounded-full bg-accent text-white transition disabled:bg-elev-3 disabled:text-label-4"
        >
          <ArrowUp className="size-6" aria-hidden="true" />
        </button>
      </div>

      {!asked && !ask.isPending && (
        <div className="flex flex-col items-start gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => send(e)}
              className="rounded-full bg-elev-1 px-4 py-2 text-base text-label-2 hover:bg-elev-2"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {asked && <p className="text-base font-semibold text-label-3">{asked}</p>}
      {ask.isPending && <p className="text-lg italic text-label-3">Thinking…</p>}
      {answer && (
        <p className="rounded-2xl bg-elev-1 p-4 text-lg leading-relaxed text-label">{answer}</p>
      )}
    </div>
  );
}
