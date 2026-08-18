"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { AssistantResponse } from "@/lib/v2-types";

export interface ChatConversation {
  id: string;
  title: string;
  updated_at: string;
}

export interface StoredMessage {
  id: string;
  role: "me" | "rekalla";
  content: string;
  image_url: string | null;
  meta: AssistantResponse | null;
  created_at: string;
}

// chat_* tables aren't in the generated Database type yet; access untyped.
function db() {
  return createClient() as unknown as { from: (t: string) => any };
}

const listKey = (userId: string) => ["chats", userId];

export function useConversations(userId: string) {
  return useQuery({
    queryKey: listKey(userId),
    queryFn: async (): Promise<ChatConversation[]> => {
      const { data, error } = await db()
        .from("chat_conversations")
        .select("id, title, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChatConversation[];
    },
  });
}

/** Load one conversation's messages, oldest first, for reopening a chat. */
export async function loadMessages(conversationId: string): Promise<StoredMessage[]> {
  const { data, error } = await db()
    .from("chat_messages")
    .select("id, role, content, image_url, meta, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StoredMessage[];
}

export function useCreateConversation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string): Promise<string> => {
      const { data, error } = await db()
        .from("chat_conversations")
        .insert({ user_id: userId, title: title.slice(0, 80) || "New chat" })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey(userId) }),
  });
}

export function useAppendMessage(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: {
      conversationId: string;
      role: "me" | "rekalla";
      content: string;
      image_url?: string | null;
      meta?: AssistantResponse | null;
    }) => {
      const client = db();
      const { error } = await client.from("chat_messages").insert({
        conversation_id: m.conversationId,
        user_id: userId,
        role: m.role,
        content: m.content,
        image_url: m.image_url ?? null,
        meta: m.meta ?? null,
      });
      if (error) throw error;
      // Bump the conversation so it sorts to the top of the history.
      await client
        .from("chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", m.conversationId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey(userId) }),
  });
}

export function useDeleteConversation(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await db()
        .from("chat_conversations")
        .delete()
        .eq("id", conversationId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey(userId) }),
  });
}
