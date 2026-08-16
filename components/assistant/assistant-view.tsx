"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, Phone, ShieldAlert, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  isVoiceInputSupported,
  speak,
  startDictation,
  stopSpeaking,
} from "@/lib/assistant-client";
import { useAssistant } from "@/hooks/use-assistant-v2";
import type { AssistantResponse, EmergencyContact } from "@/lib/v2-types";

interface Turn {
  role: "me" | "rekalla";
  text: string;
  meta?: AssistantResponse;
}

const SUGGESTIONS = [
  "What's on my calendar this week?",
  "Who's driving me Thursday?",
  "Who's my cardiologist again?",
];

export function AssistantView() {
  const ask = useAssistant();
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const voiceSupported = isVoiceInputSupported();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, ask.isPending]);

  function send(text: string) {
    const message = text.trim();
    if (!message || ask.isPending) return;
    setTurns((t) => [...t, { role: "me", text: message }]);
    setInput("");
    ask.mutate(
      { user_message: message },
      {
        onSuccess: (res) => {
          setTurns((t) => [...t, { role: "rekalla", text: res.reply, meta: res }]);
          speak(res.reply);
        },
        onError: () =>
          setTurns((t) => [
            ...t,
            { role: "rekalla", text: "I'm having trouble right now. Please try again in a moment." },
          ]),
      },
    );
  }

  function toggleMic() {
    stopSpeaking();
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const handle = startDictation(
      (text) => setInput((prev) => (prev ? `${prev} ${text}` : text)),
      () => {
        setListening(false);
        recRef.current = null;
      },
    );
    if (handle) {
      recRef.current = handle;
      setListening(true);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-label">Ask Rekalla</h1>

      <div className="space-y-5" aria-live="polite">
        {turns.length === 0 ? (
          <div className="space-y-5">
            <p className="text-xl leading-relaxed text-label">
              Ask me about your week, your family, or your appointments. Use the
              microphone and talk, or type below.
            </p>
            <ul className="space-y-3">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full justify-start text-left text-lg"
                    onClick={() => send(s)}
                  >
                    {s}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          turns.map((turn, i) => <TurnBubble key={i} turn={turn} />)
        )}
        {ask.isPending && (
          <p className="text-lg italic text-label-3">Rekalla is thinking…</p>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="sticky bottom-24 space-y-3 rounded-2xl border border-white/10 bg-elev-1 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="ask" className="sr-only">
          Type your question for Rekalla
        </label>
        <Textarea
          id="ask"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          rows={2}
          className="text-xl"
        />
        <div className="flex items-center gap-3">
          {voiceSupported && (
            <Button
              type="button"
              variant={listening ? "danger" : "secondary"}
              size="lg"
              onClick={toggleMic}
              aria-pressed={listening}
              aria-label={listening ? "Stop listening" : "Speak your question"}
              className="min-w-16"
            >
              {listening ? <MicOff className="size-6" /> : <Mic className="size-6" />}
              <span>{listening ? "Stop" : "Speak"}</span>
            </Button>
          )}
          <Button type="submit" size="lg" className="flex-1 text-lg" disabled={ask.isPending}>
            <Send className="size-6" aria-hidden="true" />
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

function TurnBubble({ turn }: { turn: Turn }) {
  const mine = turn.role === "me";
  return (
    <div className={cn("flex flex-col gap-3", mine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[92%] rounded-2xl p-4 text-xl leading-relaxed",
          mine ? "bg-white text-black" : "bg-elev-1 text-label",
        )}
      >
        {turn.text}
      </div>
      {turn.meta && <TierUI res={turn.meta} />}
    </div>
  );
}

/** Server-classified tier drives the UI; the client never re-derives it. */
function TierUI({ res }: { res: AssistantResponse }) {
  if (res.tier === "tier1_medical") {
    const contact = topContact(res.emergency_contacts);
    return (
      <div
        role="alert"
        className="w-full space-y-3 rounded-2xl border-2 border-tint-red bg-elev-1 p-4"
      >
        <p className="flex items-center gap-2 text-xl font-bold text-label">
          <ShieldAlert className="size-6 text-tint-red" aria-hidden="true" />
          If this is an emergency, call 911 now.
        </p>
        <CallLink
          href="tel:911"
          ariaLabel="Call 9 1 1 emergency services now"
          className="bg-tint-red text-white hover:brightness-110"
        >
          <Phone className="size-6" aria-hidden="true" /> Call 911
        </CallLink>
        {contact?.phone && (
          <CallLink
            href={`tel:${contact.phone}`}
            ariaLabel={`Call ${contact.name ?? "family"}`}
            className="bg-elev-2 text-label hover:bg-elev-3"
          >
            Call {contact.name ?? "family"}
          </CallLink>
        )}
      </div>
    );
  }

  if (res.tier === "tier2_financial") {
    const contact = topContact(res.emergency_contacts);
    return (
      <div
        role="alert"
        className="w-full space-y-3 rounded-2xl border-2 border-tint-orange bg-elev-1 p-4"
      >
        <p className="flex items-center gap-2 text-xl font-bold text-label">
          <ShieldAlert className="size-6 text-tint-orange" aria-hidden="true" />
          This could be a scam. Please don&apos;t send money or gift cards. Talk to{" "}
          {contact?.name ?? "your family"} first.
        </p>
        {contact?.phone && (
          <CallLink
            href={`tel:${contact.phone}`}
            ariaLabel={`Call ${contact.name ?? "family"} now`}
            className="bg-white text-black hover:bg-white/90"
          >
            <Phone className="size-6" aria-hidden="true" /> Call {contact.name ?? "family"} now
          </CallLink>
        )}
      </div>
    );
  }

  if (res.suggested_action && res.suggested_action.type !== "none") {
    const name = res.suggested_action.contact_name ?? "someone";
    return (
      <Button variant="secondary" size="lg" className="text-lg">
        <Mail className="size-6" aria-hidden="true" /> Send {name} a note
      </Button>
    );
  }
  return null;
}

function topContact(list?: EmergencyContact[]): EmergencyContact | undefined {
  if (!list || list.length === 0) return undefined;
  return [...list].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))[0];
}

/** A tel: link styled like a large button (avoids nesting a button in an anchor). */
function CallLink({
  href,
  ariaLabel,
  className,
  children,
}: {
  href: string;
  ariaLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex min-h-14 w-full select-none items-center justify-center gap-2 rounded-2xl px-7 text-xl font-semibold transition-all focus:outline-none focus:ring-[3px] focus:ring-white/25",
        className,
      )}
    >
      {children}
    </a>
  );
}
