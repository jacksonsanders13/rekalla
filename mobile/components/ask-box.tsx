/** A basic "ask about your calendar" box for the Home screen. */
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../lib/theme";
import { a11y, a11yFont } from "../lib/a11y";
import { useAssistant } from "../hooks/v2";
import { RekallaAvatar } from "./rekalla-avatar";
import { SpeechBubble } from "./speech-bubble";

const EXAMPLES = [
  "What's my next appointment?",
  "When is my next bill due?",
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
        },
        onError: () => setAnswer("Sorry, I had trouble just now. Please try again."),
      },
    );
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

      {!asked && !ask.isPending ? (
        <View style={styles.chips}>
          {EXAMPLES.map((e) => (
            <Pressable key={e} onPress={() => send(e)} style={styles.chip} accessibilityRole="button">
              <Text style={styles.chipText}>{e}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {asked ? <Text style={styles.q}>You asked: {asked}</Text> : null}
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
  chips: { gap: a11y.space(2) },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: colors.elev1,
    borderRadius: 999,
    paddingHorizontal: a11y.space(4),
    paddingVertical: a11y.space(2),
  },
  chipText: { color: colors.label2, fontSize: a11yFont.body - 3 },
  q: { color: colors.label3, fontSize: a11yFont.body - 3 },
});
