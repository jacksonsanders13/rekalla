"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, History, SquarePen } from "lucide-react";
import { useAssistant } from "@/hooks/use-assistant-v2";
import { useAppendMessage, useCreateConversation } from "@/hooks/use-chats";
import { ChatSidebar } from "@/components/assistant/chat-sidebar";
import { RekallaAvatar, SpeechBubble } from "@/components/ui/rekalla-avatar";

/**
 * The "ask Rekalla" box on Home. Every exchange is saved as a conversation, so
 * past chats are here to reopen or delete the way any chat app does it.
 */
export function AskBox({ userId }: { userId: string }) {
  const ask = useAssistant();
  const router = useRouter();
  const createChat = useCreateConversation(userId);
  const appendMsg = useAppendMessage(userId);

  const [input, setInput] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  async function send(text: string) {
    const q = text.trim();
    if (!q || ask.isPending) return;
    setAsked(q);
    setInput("");
    setAnswer(null);

    // Save the question first so the chat survives even if the answer fails.
    let convoId = activeId;
    try {
      if (!convoId) {
        convoId = await createChat.mutateAsync(q);
        setActiveId(convoId);
      }
      appendMsg.mutate({ conversationId: convoId, role: "me", content: q });
    } catch {
      convoId = null;
    }

    ask.mutate(
      { user_message: q },
      {
        onSuccess: (res) => {
          setAnswer(res.reply);
          if (convoId) {
            appendMsg.mutate({
              conversationId: convoId,
              role: "rekalla",
              content: res.reply,
              meta: res,
            });
          }
        },
        onError: () => setAnswer("Sorry, I had trouble just now. Please try again."),
      },
    );
  }

  function newChat() {
    setActiveId(null);
    setAsked(null);
    setAnswer(null);
    setInput("");
    setHistoryOpen(false);
  }

  // He waits on you, thinks while he waits on the model, then hands the
  // answer back in the bubble.
  const thinking = ask.isPending;
  const bubble = answer ?? "What can I do for you today?";

  return (
    <div className="space-y-3">
      <div className="flex min-h-[92px] items-center gap-2">
        <RekallaAvatar size={84} pose={thinking ? "think" : "idle"} className="shrink-0" />
        {!thinking && <SpeechBubble>{bubble}</SpeechBubble>}
      </div>

      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-elev-1 py-2 pl-5 pr-2">
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

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="flex min-h-11 items-center gap-2 text-base font-semibold text-label-3 hover:text-label-2"
        >
          <History className="size-5" aria-hidden="true" />
          Your chats
        </button>
        {asked && (
          <button
            type="button"
            onClick={newChat}
            className="flex min-h-11 items-center gap-2 text-base font-semibold text-label-3 hover:text-label-2"
          >
            <SquarePen className="size-5" aria-hidden="true" />
            New chat
          </button>
        )}
      </div>

      {asked && <p className="text-base text-label-3">You asked: {asked}</p>}

      <ChatSidebar
        userId={userId}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        activeId={activeId}
        onSelect={(id) => {
          setHistoryOpen(false);
          router.push(`/assistant?chat=${id}`);
        }}
        onNewChat={newChat}
        onDeleted={(id) => {
          if (id === activeId) newChat();
        }}
      />
    </div>
  );
}
