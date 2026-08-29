/**
 * The "ask Rekalla" box on Home. Every exchange is saved as a conversation, so
 * past chats are here to reopen or delete the way any chat app does it.
 */
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../lib/theme";
import { a11y, a11yFont } from "../lib/a11y";
import { useAssistant } from "../hooks/v2";
import { useAppendMessage, useCreateConversation } from "../hooks/chats";
import { ChatHistory } from "./chat-history";
import { RekallaAvatar } from "./rekalla-avatar";
import { SpeechBubble } from "./speech-bubble";

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

  // He waves while he waits on you, thinks while he waits on the model, then
  // hands the answer back in the bubble.
  const thinking = ask.isPending;
  const bubble = answer ?? "What can I do for you today?";

  return (
    <View style={styles.wrap}>
      <View style={styles.greeting}>
        <RekallaAvatar size={84} pose={thinking ? "think" : "wave"} />
        {thinking ? null : <SpeechBubble>{bubble}</SpeechBubble>}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your calendar…"
          placeholderTextColor={colors.label4}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
          accessibilityLabel="Ask Rekalla about your calendar"
        />
        <Pressable
          onPress={() => send(input)}
          disabled={ask.isPending || !input.trim()}
          accessibilityRole="button"
          accessibilityLabel="Ask"
          style={[styles.send, (ask.isPending || !input.trim()) && { backgroundColor: colors.elev3 }]}
        >
          <Ionicons name="arrow-up" size={24} color={input.trim() ? "#ffffff" : colors.label4} />
        </Pressable>
      </View>

      <View style={styles.tools}>
        <Pressable
          onPress={() => setHistoryOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Your chats"
          style={styles.tool}
        >
          <Ionicons name="time-outline" size={20} color={colors.label3} />
          <Text style={styles.toolText}>Your chats</Text>
        </Pressable>
        {asked ? (
          <Pressable
            onPress={newChat}
            accessibilityRole="button"
            accessibilityLabel="Start a new chat"
            style={styles.tool}
          >
            <Ionicons name="create-outline" size={20} color={colors.label3} />
            <Text style={styles.toolText}>New chat</Text>
          </Pressable>
        ) : null}
      </View>

      {asked ? <Text style={styles.q}>You asked: {asked}</Text> : null}

      <ChatHistory
        userId={userId}
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        activeId={activeId}
        onSelect={(id) => {
          setHistoryOpen(false);
          router.push(`/(patient)/assistant?chat=${id}`);
        }}
        onNewChat={newChat}
        onDeleted={(id) => {
          if (id === activeId) newChat();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: a11y.space(3) },
  greeting: {
    flexDirection: "row",
    alignItems: "center",
    gap: a11y.space(2),
    minHeight: 92,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: a11y.space(2),
    backgroundColor: colors.elev1,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingLeft: a11y.space(4),
    paddingRight: a11y.space(2),
    paddingVertical: a11y.space(2),
  },
  input: { flex: 1, color: colors.label, fontSize: a11yFont.body, paddingVertical: a11y.space(2) },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  tools: { flexDirection: "row", gap: a11y.space(5) },
  tool: { flexDirection: "row", alignItems: "center", gap: a11y.space(2), minHeight: 44 },
  toolText: { color: colors.label3, fontSize: a11yFont.body - 4, fontWeight: "600" },
  q: { color: colors.label3, fontSize: a11yFont.body - 3 },
});
