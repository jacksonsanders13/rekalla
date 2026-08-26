"use client";

import { useEffect, useState } from "react";
import { SquarePen, Trash2, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useConversations,
  useDeleteConversation,
  type ChatConversation,
} from "@/hooks/use-chats";

export function ChatSidebar({
  userId,
  open,
  onClose,
  activeId,
  onSelect,
  onNewChat,
  onDeleted,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleted: (id: string) => void;
}) {
  const { data: chats, isLoading } = useConversations(userId);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your chats"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-elev-1 shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <h2 className="text-2xl font-bold text-label">Your chats</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 items-center justify-center rounded-full text-label-2 hover:bg-white/10 hover:text-label"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={onNewChat}
            className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl bg-accent px-5 text-xl font-bold text-white transition-all hover:brightness-110"
          >
            <SquarePen className="size-6" aria-hidden="true" />
            New chat
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {isLoading ? (
            <p className="px-2 py-4 text-lg text-label-3">Loading…</p>
          ) : !chats || chats.length === 0 ? (
            <p className="px-2 py-4 text-lg text-label-3">
              No past chats yet. Ask Rekalla something to get started.
            </p>
          ) : (
            <ul className="space-y-1">
              {chats.map((chat) => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  userId={userId}
                  active={chat.id === activeId}
                  onSelect={() => onSelect(chat.id)}
                  onDeleted={onDeleted}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

function ChatRow({
  chat,
  userId,
  active,
  onSelect,
  onDeleted,
}: {
  chat: ChatConversation;
  userId: string;
  active: boolean;
  onSelect: () => void;
  onDeleted: (id: string) => void;
}) {
  const del = useDeleteConversation(userId);
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <li className="flex items-center gap-2 rounded-2xl bg-elev-2 p-3">
        <span className="flex-1 px-1 text-lg font-semibold text-label">Delete this chat?</span>
        <button
          type="button"
          onClick={() => del.mutate(chat.id, { onSuccess: () => onDeleted(chat.id) })}
          disabled={del.isPending}
          className="min-h-11 rounded-xl bg-tint-red px-4 text-lg font-bold text-white hover:brightness-110 disabled:opacity-60"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="min-h-11 rounded-xl bg-elev-3 px-4 text-lg font-semibold text-label hover:brightness-110"
        >
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-2xl pr-1 transition-colors",
          active ? "bg-elev-2" : "hover:bg-elev-2",
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex min-h-[60px] flex-1 items-center gap-3 rounded-2xl px-3 text-left"
        >
          <MessageSquare className="size-5 shrink-0 text-label-3" aria-hidden="true" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-lg font-semibold text-label">{chat.title}</span>
            <span className="text-sm text-label-3">{formatDay(chat.updated_at)}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Delete chat: ${chat.title}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-label-3 hover:bg-tint-red/15 hover:text-tint-red"
        >
          <Trash2 className="size-5" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
