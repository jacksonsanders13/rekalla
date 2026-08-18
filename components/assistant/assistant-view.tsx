"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Mic, Square, ArrowUp, ImagePlus, Phone, ShieldAlert, Mail, X } from "lucide-react";
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
  image?: string;
  meta?: AssistantResponse;
}

const SUGGESTIONS = [
  "What's on my calendar this week?",
  "When is my son's birthday?",
  "Who can drive me on Thursday?",
  "Help me write a note to my daughter.",
];

export function AssistantView() {
  const ask = useAssistant();
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const voiceSupported = isVoiceInputSupported();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, ask.isPending]);

  // Auto-grow the textarea like ChatGPT/Claude.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

  function send() {
    const message = input.trim();
    if ((!message && !image) || ask.isPending) return;
    const img = image ?? undefined;
    setTurns((t) => [...t, { role: "me", text: message, image: img }]);
    setInput("");
    setImage(null);
    ask.mutate(
      { user_message: message || "What is in this photo?", image_data_url: img },
      {
        onSuccess: (res) => {
          setTurns((t) => [...t, { role: "rekalla", text: res.reply, meta: res }]);
          speak(res.reply);
        },
        onError: () =>
          setTurns((t) => [
            ...t,
            { role: "rekalla", text: "I'm having a little trouble right now. Please try again in a moment." },
          ]),
      },
    );
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
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

  const empty = turns.length === 0;

  return (
    <div className="flex min-h-[calc(100dvh-13rem)] flex-col">
      {/* Conversation */}
      <div className="flex-1" aria-live="polite" aria-label="Conversation with Rekalla">
        {empty ? (
          <Welcome onPick={send} setInput={setInput} suggestions={SUGGESTIONS} />
        ) : (
          <div className="space-y-8 pb-6">
            {turns.map((turn, i) => (
              <MessageRow key={i} turn={turn} />
            ))}
            {ask.isPending && <ThinkingRow />}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer — sticky above the tab bar */}
      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 -mx-4 px-4">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-base to-transparent" />
        <div className="rounded-[28px] border border-white/10 bg-elev-1/80 p-3 shadow-[0_8px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {image && (
            <div className="mb-3 flex items-center gap-3 px-1">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Attached" className="size-16 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  aria-label="Remove photo"
                  className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-elev-3 text-label ring-2 ring-base hover:bg-white hover:text-black"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <span className="text-lg text-label-2">Photo attached</span>
            </div>
          )}

          <label htmlFor="ask" className="sr-only">
            Type your question for Rekalla
          </label>
          <textarea
            id="ask"
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask Rekalla anything…"
            className="block max-h-52 w-full resize-none bg-transparent px-3 py-2 text-xl leading-relaxed text-label placeholder:text-label-4 focus:outline-none"
          />

          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickImage}
                className="hidden"
              />
              <IconButton
                label="Add a photo"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="size-6" aria-hidden="true" />
              </IconButton>
              {voiceSupported && (
                <IconButton
                  label={listening ? "Stop listening" : "Speak your question"}
                  onClick={toggleMic}
                  active={listening}
                >
                  {listening ? (
                    <Square className="size-5 fill-current" aria-hidden="true" />
                  ) : (
                    <Mic className="size-6" aria-hidden="true" />
                  )}
                </IconButton>
              )}
            </div>

            <button
              type="button"
              onClick={send}
              disabled={ask.isPending || (!input.trim() && !image)}
              aria-label="Send"
              className={cn(
                "flex size-14 items-center justify-center rounded-full transition-all",
                "bg-gradient-to-br from-accent to-accent-2 text-white shadow-[0_4px_24px_rgba(139,124,255,0.5)] hover:brightness-110",
                "disabled:from-elev-3 disabled:to-elev-3 disabled:text-label-4 disabled:shadow-none",
              )}
            >
              <ArrowUp className="size-7" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-sm text-label-4">
          Rekalla knows about your life and family. It won&apos;t give medical or money advice.
        </p>
      </div>
    </div>
  );
}

function Welcome({
  onPick,
  setInput,
  suggestions,
}: {
  onPick: () => void;
  setInput: (v: string) => void;
  suggestions: string[];
}) {
  return (
    <div className="relative flex animate-fade-up flex-col items-center pt-10 text-center">
      {/* Ambient violet glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/20 blur-[90px]"
      />
      <div className="relative flex size-20 items-center justify-center rounded-3xl bg-elev-1 ring-1 ring-white/10 shadow-[0_0_40px_rgba(139,124,255,0.25)]">
        <Image src="/logo.svg" alt="" width={56} height={56} className="rounded-2xl" priority />
      </div>
      <h1 className="relative mt-6 text-4xl font-bold tracking-tight text-label">Hello there</h1>
      <p className="relative mt-3 max-w-md text-xl leading-relaxed text-label-2">
        I&apos;m Rekalla. Ask me about your week, your family, or your
        appointments — just talk or type.
      </p>

      <div className="relative mt-10 grid w-full gap-3 text-left">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setInput(s);
              // let state flush, then send
              setTimeout(onPick, 0);
            }}
            className="group flex min-h-[64px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-elev-1/70 px-5 py-4 text-left text-xl font-medium text-label backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-elev-2 focus:outline-none focus:ring-[3px] focus:ring-accent/50"
          >
            <span>{s}</span>
            <ArrowUp className="size-5 shrink-0 rotate-45 text-label-4 transition-all group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-elev-1 ring-1 ring-white/10">
      <Image src="/logo.svg" alt="" width={26} height={26} className="rounded-md" />
    </div>
  );
}

function MessageRow({ turn }: { turn: Turn }) {
  if (turn.role === "me") {
    return (
      <div className="flex animate-fade-up flex-col items-end gap-2">
        {turn.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={turn.image} alt="You shared a photo" className="max-h-64 rounded-2xl object-cover" />
        )}
        {turn.text && (
          <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-elev-2 px-5 py-3.5 text-xl leading-relaxed text-label">
            {turn.text}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="animate-fade-up space-y-3">
      <div className="flex items-start gap-3">
        <Avatar />
        <div className="min-w-0 flex-1 pt-1 text-xl leading-relaxed text-label">
          {turn.text}
        </div>
      </div>
      {turn.meta && <TierUI res={turn.meta} />}
    </div>
  );
}

function ThinkingRow() {
  return (
    <div className="flex items-center gap-3">
      <Avatar />
      <div className="flex items-center gap-1.5 pt-1" aria-label="Rekalla is thinking">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2.5 animate-bounce rounded-full bg-label-3"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Server-classified tier drives the UI; the client never re-derives it. */
function TierUI({ res }: { res: AssistantResponse }) {
  if (res.tier === "tier1_medical") {
    const contact = topContact(res.emergency_contacts);
    return (
      <div role="alert" className="ml-[52px] space-y-3 rounded-2xl border-2 border-tint-red bg-tint-red/10 p-5">
        <p className="flex items-center gap-2.5 text-xl font-bold text-label">
          <ShieldAlert className="size-6 shrink-0 text-tint-red" aria-hidden="true" />
          If this is an emergency, call 911 now.
        </p>
        <CallLink href="tel:911" ariaLabel="Call 9 1 1 emergency services now" className="bg-tint-red text-white hover:brightness-110">
          <Phone className="size-6" aria-hidden="true" /> Call 911
        </CallLink>
        {contact?.phone && (
          <CallLink href={`tel:${contact.phone}`} ariaLabel={`Call ${contact.name ?? "family"}`} className="bg-elev-2 text-label hover:bg-elev-3">
            Call {contact.name ?? "family"}
          </CallLink>
        )}
      </div>
    );
  }
  if (res.tier === "tier2_financial") {
    const contact = topContact(res.emergency_contacts);
    return (
      <div role="alert" className="ml-[52px] space-y-3 rounded-2xl border-2 border-tint-orange bg-tint-orange/10 p-5">
        <p className="flex items-center gap-2.5 text-xl font-bold text-label">
          <ShieldAlert className="size-6 shrink-0 text-tint-orange" aria-hidden="true" />
          This could be a scam. Please don&apos;t send money or gift cards. Talk to {contact?.name ?? "your family"} first.
        </p>
        {contact?.phone && (
          <CallLink href={`tel:${contact.phone}`} ariaLabel={`Call ${contact.name ?? "family"} now`} className="bg-white text-black hover:bg-white/90">
            <Phone className="size-6" aria-hidden="true" /> Call {contact.name ?? "family"} now
          </CallLink>
        )}
      </div>
    );
  }
  if (res.suggested_action && res.suggested_action.type !== "none") {
    const name = res.suggested_action.contact_name ?? "someone";
    return (
      <button className="ml-[52px] inline-flex min-h-[56px] items-center gap-2 rounded-2xl bg-elev-2 px-6 text-lg font-semibold text-label hover:bg-elev-3">
        <Mail className="size-6" aria-hidden="true" /> Send {name} a note
      </button>
    );
  }
  return null;
}

function IconButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-12 items-center justify-center rounded-full transition-colors",
        active ? "bg-tint-red text-white" : "text-label-2 hover:bg-white/10 hover:text-label",
      )}
    >
      {children}
    </button>
  );
}

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
        "inline-flex min-h-14 w-full select-none items-center justify-center gap-2 rounded-2xl px-7 text-xl font-semibold transition-all focus:outline-none focus:ring-[3px] focus:ring-white/40",
        className,
      )}
    >
      {children}
    </a>
  );
}

function topContact(list?: EmergencyContact[]): EmergencyContact | undefined {
  if (!list || list.length === 0) return undefined;
  return [...list].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))[0];
}
