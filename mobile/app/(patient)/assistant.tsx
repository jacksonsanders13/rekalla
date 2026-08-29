import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors, radius, fonts } from "../../lib/theme";
import { a11y, a11yFont } from "../../lib/a11y";
import { useAssistant, useConfirmProposedAction } from "../../hooks/v2";
import {
  useCreateConversation,
  useAppendMessage,
  loadMessages,
} from "../../hooks/chats";
import { BigButton } from "../../components/big-ui";
import { ChatHistory } from "../../components/chat-history";
import { RekallaAvatar } from "../../components/rekalla-avatar";
import type {
  AssistantResponse,
  EmergencyContact,
  ProposedAction,
} from "../../lib/v2-types";

interface Turn {
  role: "me" | "rekalla";
  text: string;
  meta?: AssistantResponse;
}

export default function AssistantScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const ask = useAssistant();
  const createChat = useCreateConversation(userId);
  const appendMsg = useAppendMessage(userId);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const scroller = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Opened from a past chat on Home: load that conversation once.
  const { chat } = useLocalSearchParams<{ chat?: string }>();
  const openedRef = useRef(false);
  useEffect(() => {
    if (!chat || openedRef.current) return;
    openedRef.current = true;
    openChat(String(chat));
  }, [chat]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || ask.isPending) return;
    setTurns((t) => [...t, { role: "me", text: message }]);
    setInput("");

    // Make sure this chat is saved, then record the person's message.
    let convoId = activeId;
    try {
      if (!convoId) {
        convoId = await createChat.mutateAsync(message);
        setActiveId(convoId);
      }
      appendMsg.mutate({ conversationId: convoId, role: "me", content: message });
    } catch {
      convoId = null;
    }

    ask.mutate(
      { user_message: message },
      {
        onSuccess: (res) => {
          setTurns((t) => [...t, { role: "rekalla", text: res.reply, meta: res }]);
          if (convoId) {
            appendMsg.mutate({ conversationId: convoId, role: "rekalla", content: res.reply, meta: res });
          }
          requestAnimationFrame(() => scroller.current?.scrollToEnd({ animated: true }));
        },
        onError: () => {
          setTurns((t) => [
            ...t,
            {
              role: "rekalla",
              text: "I'm having trouble right now. Please try again in a moment.",
            },
          ]);
        },
      },
    );
  }

  function newChat() {
    setTurns([]);
    setActiveId(null);
    setInput("");
    setHistoryOpen(false);
  }

  async function openChat(id: string) {
    setHistoryOpen(false);
    try {
      const msgs = await loadMessages(id);
      setTurns(msgs.map((m) => ({ role: m.role, text: m.content, meta: m.meta ?? undefined })));
      setActiveId(id);
    } catch {
      // Leave the current chat in place if it couldn't load.
    }
  }

  function onChatDeleted(id: string) {
    if (id === activeId) newChat();
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setHistoryOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Your chats"
          style={styles.headerBtn}
        >
          <Ionicons name="menu" size={30} color={colors.label} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Rekalla
        </Text>
        <Pressable
          onPress={newChat}
          accessibilityRole="button"
          accessibilityLabel="Start a new chat"
          style={styles.headerBtn}
        >
          <Ionicons name="create-outline" size={28} color={colors.label} />
        </Pressable>
      </View>

      <ChatHistory
        userId={userId}
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        activeId={activeId}
        onSelect={openChat}
        onNewChat={newChat}
        onDeleted={onChatDeleted}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        ref={scroller}
        style={styles.flex}
        contentContainerStyle={styles.thread}
        keyboardShouldPersistTaps="handled"
      >
        {turns.length === 0 ? (
          <View style={styles.welcome}>
            <RekallaAvatar size={104} />
            <Text style={styles.welcomeText}>
              Ask me about anything you've scanned.
            </Text>
          </View>
        ) : (
          turns.map((turn, i) => <TurnBubble key={i} turn={turn} />)
        )}
        {ask.isPending ? (
          <View style={styles.bubbleLine} accessibilityLiveRegion="polite">
            <RekallaAvatar size={36} pose="think" />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.composerWrap}>
        <View style={styles.composer}>
          <Pressable
            onPress={() => inputRef.current?.focus()}
            accessibilityRole="button"
            accessibilityLabel="Voice input. Opens the keyboard so you can dictate"
            style={styles.micBtn}
          >
            <Ionicons name="mic-outline" size={24} color={colors.label2} />
          </Pressable>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Rekalla anything…"
            placeholderTextColor={colors.label4}
            multiline
            accessibilityLabel="Type your message to Rekalla"
          />
          <Pressable
            onPress={() => send(input)}
            disabled={ask.isPending || !input.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={[styles.sendBtn, (ask.isPending || !input.trim()) && styles.sendBtnOff]}
          >
            <Ionicons
              name="arrow-up"
              size={26}
              color={input.trim() ? "#ffffff" : colors.label4}
            />
          </Pressable>
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TurnBubble({ turn }: { turn: Turn }) {
  const mine = turn.role === "me";
  const proposal = turn.meta?.proposed_action;
  return (
    <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
      <View style={styles.bubbleLine}>
        {mine ? null : <RekallaAvatar size={36} />}
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={styles.bubbleText}>{turn.text}</Text>
        </View>
      </View>
      {turn.meta ? <TierUI res={turn.meta} /> : null}
      {proposal && proposal.kind !== "none" ? <ProposeCard action={proposal} /> : null}
    </View>
  );
}

/** Confirm-first save card. The elder taps Yes; only then do we write. */
function ProposeCard({ action }: { action: ProposedAction }) {
  const confirm = useConfirmProposedAction();
  const [state, setState] = useState<"idle" | "saved" | "dismissed">("idle");
  const isReminder = action.kind === "add_reminder";

  if (state === "dismissed") return null;

  if (state === "saved") {
    return (
      <View style={styles.savedCard}>
        <Ionicons name="checkmark-circle" size={a11yFont.body} color={colors.green} />
        <Text style={styles.savedText}>
          {isReminder ? "Added to your schedule" : "Saved to your memory vault"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.proposeCard}>
      <Text style={styles.proposeText}>
        {action.confirm_prompt ??
          (isReminder ? "Add this to your schedule?" : "Save this to remember it?")}
      </Text>
      <View style={styles.proposeButtons}>
        <BigButton
          label={confirm.isPending ? "Saving…" : "Yes, save it"}
          icon="checkmark"
          onPress={() => confirm.mutate(action, { onSuccess: () => setState("saved") })}
          disabled={confirm.isPending}
        />
        <BigButton
          label="No thanks"
          icon="close"
          variant="secondary"
          onPress={() => setState("dismissed")}
        />
      </View>
    </View>
  );
}

/**
 * Tier-driven UI. The tier comes from the server; the client never re-derives
 * it. Tier 1 shows the 911 button FIRST; tier 2 surfaces the top family contact
 * and offers NO transaction help; tier 3/4 stay calm.
 */
function TierUI({ res }: { res: AssistantResponse }) {
  if (res.tier === "tier1_medical") {
    const contact = topContact(res.emergency_contacts);
    return (
      <View style={styles.tierBox} accessibilityLiveRegion="assertive">
        <Text style={styles.tierHeading}>
          <Ionicons name="warning" size={a11yFont.body} color={colors.red} /> If this is an
          emergency, call 911 now.
        </Text>
        <BigButton
          label="Call 911"
          icon="call"
          variant="emergency"
          accessibilityLabel="Call 9 1 1 emergency services now"
          onPress={() => Linking.openURL("tel:911")}
        />
        {contact ? (
          <BigButton
            label={`Call ${contact.name ?? "family"}`}
            icon="person"
            variant="secondary"
            accessibilityLabel={`Call ${contact.name ?? "your family contact"}`}
            onPress={() => contact.phone && Linking.openURL(`tel:${contact.phone}`)}
          />
        ) : null}
      </View>
    );
  }

  if (res.tier === "tier2_financial") {
    const contact = topContact(res.emergency_contacts);
    return (
      <View style={styles.tierBox} accessibilityLiveRegion="assertive">
        <Text style={styles.tierHeading}>
          <Ionicons name="shield-checkmark" size={a11yFont.body} color={colors.orange} /> This
          could be a scam. Please don't send money or gift cards. Talk to
          {contact?.name ? ` ${contact.name}` : " your family"} first.
        </Text>
        {contact ? (
          <BigButton
            label={`Call ${contact.name ?? "family"} now`}
            icon="call"
            variant="primary"
            accessibilityLabel={`Call ${contact.name ?? "your top family contact"} now`}
            onPress={() => contact.phone && Linking.openURL(`tel:${contact.phone}`)}
          />
        ) : null}
      </View>
    );
  }

  // tier3_emotional / tier4_out_of_scope: calm, optional action only.
  if (res.suggested_action && res.suggested_action.type !== "none") {
    const name = res.suggested_action.contact_name ?? "someone";
    return (
      <View style={styles.calmAction}>
        <BigButton
          label={`Send ${name} a note`}
          icon="mail"
          variant="secondary"
          accessibilityLabel={`Send ${name} a message`}
          onPress={() => {
            /* Step 3/4: open the compose sheet; elder confirms before send. */
          }}
        />
      </View>
    );
  }
  return null;
}

function topContact(list?: EmergencyContact[]): EmergencyContact | undefined {
  if (!list || list.length === 0) return undefined;
  return [...list].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))[0];
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.base },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: a11y.space(3),
    paddingVertical: a11y.space(2),
  },
  headerBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.label, fontSize: a11yFont.bodyLg, fontFamily: fonts.bold, fontWeight: "700" },
  thread: { padding: a11y.space(4), gap: a11y.space(3), paddingBottom: a11y.space(6) },
  welcome: { gap: a11y.space(5), paddingTop: a11y.space(6), alignItems: "center" },
  welcomeText: {
    color: colors.label2,
    fontSize: a11yFont.body, fontFamily: fonts.regular,
    lineHeight: a11y.lineHeight(a11yFont.body),
    textAlign: "center",
  },
  thinking: { color: colors.label3, fontSize: a11yFont.body, fontFamily: fonts.regular, fontStyle: "italic" },
  bubbleRow: { gap: a11y.space(2) },
  bubbleLine: { flexDirection: "row", alignItems: "flex-end", gap: a11y.space(2) },
  rowMine: { alignItems: "flex-end" },
  rowTheirs: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "84%",
    borderRadius: 22,
    paddingHorizontal: a11y.space(4),
    paddingVertical: a11y.space(3),
  },
  bubbleMine: { backgroundColor: colors.blue, borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: colors.elev2, borderBottomLeftRadius: 6 },
  bubbleText: {
    color: colors.label,
    fontSize: a11yFont.body, fontFamily: fonts.regular,
    lineHeight: a11y.lineHeight(a11yFont.body),
  },
  tierBox: {
    width: "100%",
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.red,
    padding: a11y.space(4),
    gap: a11y.space(3),
  },
  tierHeading: {
    color: colors.label,
    fontSize: a11yFont.body, fontFamily: fonts.bold,
    fontWeight: "700",
    lineHeight: a11y.lineHeight(a11yFont.body),
  },
  calmAction: { width: "100%" },
  proposeCard: {
    width: "100%",
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.blue,
    padding: a11y.space(4),
    gap: a11y.space(3),
  },
  proposeText: {
    color: colors.label,
    fontSize: a11yFont.body, fontFamily: fonts.bold,
    fontWeight: "700",
    lineHeight: a11y.lineHeight(a11yFont.body),
  },
  proposeButtons: { gap: a11y.space(3) },
  savedCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: a11y.space(2),
    backgroundColor: colors.elev1,
    borderRadius: radius.lg,
    padding: a11y.space(4),
  },
  savedText: { color: colors.label, fontSize: a11yFont.body, fontFamily: fonts.bold, fontWeight: "700" },
  composerWrap: {
    paddingHorizontal: a11y.space(3),
    paddingTop: a11y.space(2),
    paddingBottom: a11y.space(2),
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: a11y.space(2),
    backgroundColor: colors.elev1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingLeft: a11y.space(2),
    paddingRight: a11y.space(2),
    paddingVertical: a11y.space(2),
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: colors.label,
    fontSize: a11yFont.body, fontFamily: fonts.regular,
    lineHeight: a11y.lineHeight(a11yFont.body),
    maxHeight: 130,
    paddingTop: a11y.space(2),
    paddingBottom: a11y.space(2),
  },
  sendBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { backgroundColor: colors.elev3 },
});
