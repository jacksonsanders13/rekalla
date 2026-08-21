import { useEffect, useRef, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../lib/session";
import { colors, radius } from "../../lib/theme";
import { a11y, a11yFont } from "../../lib/a11y";
import { speak, stopSpeaking } from "../../lib/assistant";
import {
  useAssistant,
  useProfile,
  useCompleteOnboarding,
  useConfirmProposedAction,
} from "../../hooks/v2";
import {
  ONBOARDING_INTRO,
  ONBOARDING_DONE,
  ONBOARDING_STEPS,
} from "../../lib/onboarding";
import {
  useCreateConversation,
  useAppendMessage,
  loadMessages,
} from "../../hooks/chats";
import { BigButton, BigField, MicButton } from "../../components/big-ui";
import { ChatHistory } from "../../components/chat-history";
import type {
  AssistantResponse,
  EmergencyContact,
  PersonalizationProfile,
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
  const { data: profile } = useProfile(userId);
  const complete = useCompleteOnboarding(userId);
  const createChat = useCreateConversation(userId);
  const appendMsg = useAppendMessage(userId);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Onboarding: obStep is the current question index, -1 once finished.
  const [obStep, setObStep] = useState(0);
  const [obDraft, setObDraft] = useState<PersonalizationProfile | null>(null);
  const seededRef = useRef(false);
  const scroller = useRef<ScrollView>(null);
  const onboarding = obStep >= 0 && !!obDraft;

  // First run: open the chat with Rekalla's greeting + the first question.
  useEffect(() => {
    if (seededRef.current || !profile) return;
    seededRef.current = true;
    if (profile.onboarded_at) {
      setObStep(-1);
      return;
    }
    setObDraft(profile);
    setTurns([
      { role: "rekalla", text: ONBOARDING_INTRO },
      { role: "rekalla", text: ONBOARDING_STEPS[0].ask },
    ]);
  }, [profile]);

  function finishOnboarding(draft: PersonalizationProfile | null) {
    setObStep(-1);
    if (draft) complete.mutate(draft);
    setTurns((t) => [...t, { role: "rekalla", text: ONBOARDING_DONE }]);
    speak(ONBOARDING_DONE);
    requestAnimationFrame(() => scroller.current?.scrollToEnd({ animated: true }));
  }

  async function send(text: string) {
    const message = text.trim();

    // First-run onboarding intercepts the composer (typed answers only).
    if (onboarding) {
      if (!message || !obDraft) return;
      setTurns((t) => [...t, { role: "me", text: message }]);
      setInput("");
      const nextDraft = ONBOARDING_STEPS[obStep].apply(obDraft, message);
      setObDraft(nextDraft);
      const next = obStep + 1;
      if (next < ONBOARDING_STEPS.length) {
        setObStep(next);
        setTurns((t) => [...t, { role: "rekalla", text: ONBOARDING_STEPS[next].ask }]);
        requestAnimationFrame(() => scroller.current?.scrollToEnd({ animated: true }));
      } else {
        finishOnboarding(nextDraft);
      }
      return;
    }

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
          speak(res.reply);
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
    stopSpeaking();
    setTurns([]);
    setActiveId(null);
    setInput("");
    setHistoryOpen(false);
  }

  async function openChat(id: string) {
    stopSpeaking();
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
        {!onboarding ? (
          <Pressable
            onPress={() => setHistoryOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Your chats"
            style={styles.headerBtn}
          >
            <Ionicons name="menu" size={30} color={colors.label} />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
        <Text style={styles.headerTitle} accessibilityRole="header">
          Rekalla
        </Text>
        {!onboarding ? (
          <Pressable
            onPress={newChat}
            accessibilityRole="button"
            accessibilityLabel="Start a new chat"
            style={styles.headerBtn}
          >
            <Ionicons name="create-outline" size={28} color={colors.label} />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
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

      <ScrollView
        ref={scroller}
        contentContainerStyle={styles.thread}
        keyboardShouldPersistTaps="handled"
      >
        {turns.length === 0 && obStep < 0 ? (
          <View style={styles.welcome}>
            <Text style={styles.welcomeText}>
              Hello. Ask me about your week, your family, or your appointments.
              Tap the microphone and talk, or type below.
            </Text>
            <View style={styles.suggestions}>
              {[
                "What's on my calendar this week?",
                "Who's driving me Thursday?",
                "Who's my cardiologist again?",
              ].map((s) => (
                <BigButton
                  key={s}
                  label={s}
                  variant="secondary"
                  icon="chatbubble-ellipses"
                  onPress={() => send(s)}
                  style={styles.suggestion}
                />
              ))}
            </View>
          </View>
        ) : (
          turns.map((turn, i) => <TurnBubble key={i} turn={turn} />)
        )}
        {ask.isPending ? (
          <Text style={styles.thinking} accessibilityLiveRegion="polite">
            Rekalla is thinking…
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.composer}>
        <MicButton
          onPress={() => {
            // Interim: focus the field so the iOS keyboard dictation mic is one
            // tap away. On-device STT (expo-av record + transcribe) is a TODO.
            stopSpeaking();
          }}
          accessibilityLabel="Talk to Rekalla. Opens the keyboard so you can dictate."
        />
        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <BigField
              label="Type your question"
              value={input}
              onChangeText={setInput}
              placeholder={onboarding ? "Type your answer…" : "Type or use the mic…"}
              multiline
              onSubmitEditing={() => send(input)}
            />
          </View>
          <BigButton
            label="Send"
            icon="send"
            onPress={() => send(input)}
            accessibilityLabel="Send your answer to Rekalla"
            disabled={ask.isPending}
          />
        </View>
        {onboarding ? (
          <Pressable
            onPress={() => finishOnboarding(obDraft)}
            accessibilityRole="button"
            style={styles.skip}
          >
            <Text style={styles.skipText}>Skip setup for now</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function TurnBubble({ turn }: { turn: Turn }) {
  const mine = turn.role === "me";
  const proposal = turn.meta?.proposed_action;
  return (
    <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine && { color: "#000" }]}>{turn.text}</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: a11y.space(3),
    paddingVertical: a11y.space(2),
  },
  headerBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.label, fontSize: a11yFont.title, fontWeight: "700" },
  thread: { padding: a11y.space(4), gap: a11y.space(4), paddingBottom: a11y.space(8) },
  welcome: { gap: a11y.space(5) },
  welcomeText: {
    color: colors.label,
    fontSize: a11yFont.bodyLg,
    lineHeight: a11y.lineHeight(a11yFont.bodyLg),
  },
  suggestions: { gap: a11y.space(3) },
  suggestion: { justifyContent: "flex-start" },
  thinking: { color: colors.label3, fontSize: a11yFont.body, fontStyle: "italic" },
  bubbleRow: { gap: a11y.space(3) },
  rowMine: { alignItems: "flex-end" },
  rowTheirs: { alignItems: "flex-start" },
  bubble: { maxWidth: "92%", borderRadius: radius.lg, padding: a11y.space(4) },
  bubbleMine: { backgroundColor: colors.label },
  bubbleTheirs: { backgroundColor: colors.elev1 },
  bubbleText: {
    color: colors.label,
    fontSize: a11yFont.bodyLg,
    lineHeight: a11y.lineHeight(a11yFont.bodyLg),
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
    fontSize: a11yFont.body,
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
    fontSize: a11yFont.body,
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
  savedText: { color: colors.label, fontSize: a11yFont.body, fontWeight: "700" },
  composer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    padding: a11y.space(4),
    gap: a11y.space(3),
  },
  inputRow: { flexDirection: "row", gap: a11y.space(3), alignItems: "flex-end" },
  skip: { alignSelf: "center", paddingVertical: a11y.space(2) },
  skipText: { color: colors.label3, fontSize: a11yFont.body - 4, fontWeight: "600" },
});
