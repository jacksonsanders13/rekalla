"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Mic,
  Square,
  ArrowUp,
  ImagePlus,
  Phone,
  ShieldAlert,
  Mail,
  X,
  Menu,
  SquarePen,
  Sparkles,
  CalendarDays,
  Users,
  Car,
  PenLine,
  Image as ImageIcon,
  ShieldCheck,
  Check,
  CalendarPlus,
  BookmarkPlus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import {
  isVoiceInputSupported,
  speak,
  startDictation,
  stopSpeaking,
} from "@/lib/assistant-client";
import {
  useAssistant,
  useConfirmProposedAction,
  useProfileV2,
  useCompleteOnboarding,
} from "@/hooks/use-assistant-v2";
import {
  useCreateConversation,
  useAppendMessage,
  loadMessages,
} from "@/hooks/use-chats";
import { ChatSidebar } from "./chat-sidebar";
import {
  ONBOARDING_INTRO,
  ONBOARDING_DONE,
  ONBOARDING_STEPS,
} from "@/lib/onboarding";
import type {
  AssistantResponse,
  EmergencyContact,
  PersonalizationProfile,
  ProposedAction,
} from "@/lib/v2-types";

interface Turn {
  role: "me" | "rekalla";
  text: string;
  image?: string;
  meta?: AssistantResponse;
}

const CAPABILITIES = [
  { Icon: CalendarDays, text: "Tell you what's on your calendar this week" },
  { Icon: Users, text: "Remember your family — names, birthdays, and details" },
  { Icon: Car, text: "Tell you who's driving you or when your appointments are" },
  { Icon: PenLine, text: "Help you write a note or message to your family" },
  { Icon: ImageIcon, text: "Read a photo out loud — a letter, a card, or a bill" },
  { Icon: ShieldCheck, text: "Help keep you safe from scams and emergencies" },
];

export function AssistantView({
  userId,
  onboarded,
}: {
  userId: string;
  onboarded: boolean;
}) {
  const ask = useAssistant();
  const createChat = useCreateConversation(userId);
  const appendMsg = useAppendMessage(userId);
  const { data: profile } = useProfileV2(userId);
  const completeOnboarding = useCompleteOnboarding(userId);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [listening, setListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Onboarding: obStep is the current question index, or -1 once finished.
  const [obStep, setObStep] = useState(onboarded ? -1 : 0);
  const [obDraft, setObDraft] = useState<PersonalizationProfile | null>(null);
  const seededRef = useRef(false);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const voiceSupported = isVoiceInputSupported();
  const onboarding = obStep >= 0;

  // First run: open the chat with Rekalla's greeting + the first question.
  useEffect(() => {
    if (onboarded || seededRef.current || !profile) return;
    seededRef.current = true;
    setObDraft(profile);
    setTurns([
      { role: "rekalla", text: ONBOARDING_INTRO },
      { role: "rekalla", text: ONBOARDING_STEPS[0].ask },
    ]);
  }, [profile, onboarded]);

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

  // Fold the person's answer into the profile draft and ask the next question;
  // no model call, so onboarding always works.
  function onboardingReply(message: string) {
    if (!obDraft) return;
    setTurns((t) => [...t, { role: "me", text: message }]);
    setInput("");
    const nextDraft = ONBOARDING_STEPS[obStep].apply(obDraft, message);
    setObDraft(nextDraft);
    const next = obStep + 1;
    if (next < ONBOARDING_STEPS.length) {
      setObStep(next);
      setTurns((t) => [...t, { role: "rekalla", text: ONBOARDING_STEPS[next].ask }]);
    } else {
      finishOnboarding(nextDraft);
    }
  }

  function finishOnboarding(draft: PersonalizationProfile | null) {
    setObStep(-1);
    if (draft) completeOnboarding.mutate(draft);
    setTurns((t) => [...t, { role: "rekalla", text: ONBOARDING_DONE }]);
    speak(ONBOARDING_DONE);
  }

  async function send() {
    const message = input.trim();

    // First-run onboarding intercepts the composer (typed answers only).
    if (onboarding) {
      if (!message) return;
      onboardingReply(message);
      return;
    }

    if ((!message && !image) || ask.isPending) return;
    const img = image ?? undefined;
    setTurns((t) => [...t, { role: "me", text: message, image: img }]);
    setInput("");
    setImage(null);

    // Make sure this chat is saved, then record the person's message.
    let convoId = activeId;
    try {
      if (!convoId) {
        convoId = await createChat.mutateAsync(message || "Photo");
        setActiveId(convoId);
      }
      appendMsg.mutate({ conversationId: convoId, role: "me", content: message, image_url: img ?? null });
    } catch {
      // If saving fails we still let the conversation happen in the moment.
      convoId = null;
    }

    ask.mutate(
      { user_message: message || "What is in this photo?", image_data_url: img },
      {
        onSuccess: (res) => {
          setTurns((t) => [...t, { role: "rekalla", text: res.reply, meta: res }]);
          speak(res.reply);
          if (convoId) {
            appendMsg.mutate({ conversationId: convoId, role: "rekalla", content: res.reply, meta: res });
          }
        },
        onError: () =>
          setTurns((t) => [
            ...t,
            { role: "rekalla", text: "I'm having a little trouble right now. Please try again in a moment." },
          ]),
      },
    );
  }

  function newChat() {
    stopSpeaking();
    setTurns([]);
    setActiveId(null);
    setInput("");
    setImage(null);
    setSidebarOpen(false);
    taRef.current?.focus();
  }

  async function openChat(id: string) {
    stopSpeaking();
    setSidebarOpen(false);
    try {
      const msgs = await loadMessages(id);
      setTurns(
        msgs.map((m) => ({
          role: m.role,
          text: m.content,
          image: m.image_url ?? undefined,
          meta: m.meta ?? undefined,
        })),
      );
      setActiveId(id);
    } catch {
      // Leave the current chat in place if it couldn't load.
    }
  }

  function onChatDeleted(id: string) {
    if (id === activeId) newChat();
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
      <ChatSidebar
        userId={userId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeId={activeId}
        onSelect={openChat}
        onNewChat={newChat}
        onDeleted={onChatDeleted}
      />

      {/* Top bar: history + new chat, like ChatGPT (hidden during setup) */}
      {!onboarding && (
        <div className="mb-2 flex items-center justify-between">
          <IconButton label="Your chats" onClick={() => setSidebarOpen(true)}>
            <Menu className="size-6" aria-hidden="true" />
          </IconButton>
          <IconButton label="New chat" onClick={newChat}>
            <SquarePen className="size-6" aria-hidden="true" />
          </IconButton>
        </div>
      )}

      {/* Conversation */}
      <div
        className={cn("flex-1", empty && "flex items-center justify-center")}
        aria-live="polite"
        aria-label="Conversation with Rekalla"
      >
        {empty ? (
          <Welcome />
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
            placeholder={onboarding ? "Type your answer…" : "Ask Rekalla anything…"}
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
        {onboarding && (
          <p className="mt-2 text-center text-sm text-label-4">
            <button
              type="button"
              onClick={() => finishOnboarding(obDraft)}
              className="underline underline-offset-4 hover:text-label-2"
            >
              Skip setup for now
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function Welcome() {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div className="flex animate-fade-up flex-col items-center text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-label">How can I help?</h1>

      <button
        type="button"
        onClick={() => setShowHelp(true)}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-elev-1/70 px-5 py-2.5 text-lg font-medium text-label-2 backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-label focus:outline-none focus:ring-[3px] focus:ring-accent/50"
      >
        <Sparkles className="size-5 text-accent" aria-hidden="true" />
        What can you do?
      </button>

      <Dialog
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title="What Rekalla can do"
        description="Just ask in your own words — by voice or typing."
      >
        <ul className="space-y-4">
          {CAPABILITIES.map(({ Icon, text }) => (
            <li key={text} className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-elev-2 text-accent">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <span className="pt-1.5 text-xl leading-relaxed text-label">{text}</span>
            </li>
          ))}
        </ul>
      </Dialog>
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
      {turn.meta?.proposed_action && turn.meta.proposed_action.kind !== "none" && (
        <ProposeCard action={turn.meta.proposed_action} />
      )}
    </div>
  );
}

/** Confirm-first save card. The elder taps Yes; only then do we write. */
function ProposeCard({ action }: { action: ProposedAction }) {
  const confirm = useConfirmProposedAction();
  const [state, setState] = useState<"idle" | "saved" | "dismissed">("idle");
  const isReminder = action.kind === "add_reminder";
  const Icon = isReminder ? CalendarPlus : BookmarkPlus;
  const savedLabel = isReminder ? "Added to your schedule" : "Saved to your memory vault";

  if (state === "dismissed") return null;

  if (state === "saved") {
    return (
      <div className="ml-[52px] flex items-center gap-2.5 rounded-2xl bg-tint-green/10 px-5 py-3.5 text-lg font-semibold text-label">
        <Check className="size-6 shrink-0 text-tint-green" aria-hidden="true" />
        {savedLabel}
      </div>
    );
  }

  return (
    <div className="ml-[52px] space-y-3 rounded-2xl border border-accent/30 bg-accent/[0.07] p-5">
      <p className="flex items-start gap-2.5 text-xl font-semibold text-label">
        <Icon className="mt-0.5 size-6 shrink-0 text-accent" aria-hidden="true" />
        {action.confirm_prompt ??
          (isReminder ? "Add this to your schedule?" : "Save this to remember it?")}
      </p>
      {confirm.isError && (
        <p role="alert" className="text-lg text-tint-red">
          Sorry, that didn&apos;t save. Please try again.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={confirm.isPending}
          onClick={() => confirm.mutate(action, { onSuccess: () => setState("saved") })}
          className="inline-flex min-h-[56px] items-center gap-2 rounded-2xl bg-gradient-to-br from-accent to-accent-2 px-6 text-lg font-bold text-white shadow-[0_4px_20px_rgba(139,124,255,0.4)] transition-all hover:brightness-110 disabled:opacity-70"
        >
          {confirm.isPending ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="size-6" aria-hidden="true" />
          )}
          Yes, save it
        </button>
        <button
          type="button"
          disabled={confirm.isPending}
          onClick={() => setState("dismissed")}
          className="inline-flex min-h-[56px] items-center rounded-2xl bg-elev-2 px-6 text-lg font-semibold text-label transition-colors hover:bg-elev-3"
        >
          No thanks
        </button>
      </div>
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
