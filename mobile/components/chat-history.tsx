/** Chat history drawer (modal) — new chat, past chats, delete. */
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../lib/theme";
import { a11y, a11yFont } from "../lib/a11y";
import { BigButton } from "./big-ui";
import {
  useConversations,
  useDeleteConversation,
  type ChatConversation,
} from "../hooks/chats";

export function ChatHistory({
  userId,
  visible,
  onClose,
  activeId,
  onSelect,
  onNewChat,
  onDeleted,
}: {
  userId: string;
  visible: boolean;
  onClose: () => void;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleted: (id: string) => void;
}) {
  const { data: chats, isLoading } = useConversations(userId);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.panel} edges={["top", "left", "bottom"]}>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">Your chats</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
              <Ionicons name="close" size={28} color={colors.label2} />
            </Pressable>
          </View>

          <View style={{ padding: a11y.space(3) }}>
            <BigButton label="New chat" icon="create" onPress={onNewChat} />
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {isLoading ? (
              <Text style={styles.empty}>Loading…</Text>
            ) : !chats || chats.length === 0 ? (
              <Text style={styles.empty}>
                No past chats yet. Ask Rekalla something to get started.
              </Text>
            ) : (
              chats.map((chat) => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  userId={userId}
                  active={chat.id === activeId}
                  onSelect={() => onSelect(chat.id)}
                  onDeleted={onDeleted}
                />
              ))
            )}
          </ScrollView>
        </SafeAreaView>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      </View>
    </Modal>
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
      <View style={[styles.row, styles.rowConfirm]}>
        <Text style={styles.rowTitle}>Delete this chat?</Text>
        <View style={styles.confirmButtons}>
          <Pressable
            onPress={() => del.mutate(chat.id, { onSuccess: () => onDeleted(chat.id) })}
            accessibilityRole="button"
            accessibilityLabel="Delete this chat"
            style={[styles.smallBtn, { backgroundColor: colors.red }]}
          >
            <Text style={styles.smallBtnText}>Delete</Text>
          </Pressable>
          <Pressable
            onPress={() => setConfirming(false)}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={[styles.smallBtn, { backgroundColor: colors.elev3 }]}
          >
            <Text style={styles.smallBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, active && styles.rowActive]}>
      <Pressable onPress={onSelect} accessibilityRole="button" style={styles.rowMain}>
        <Ionicons name="chatbubble-ellipses" size={22} color={colors.label3} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{chat.title}</Text>
          <Text style={styles.rowDate}>{formatDay(chat.updated_at)}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => setConfirming(true)}
        accessibilityRole="button"
        accessibilityLabel={`Delete chat: ${chat.title}`}
        style={styles.trash}
      >
        <Ionicons name="trash" size={22} color={colors.label3} />
      </Pressable>
    </View>
  );
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, flexDirection: "row" },
  panel: { width: "86%", maxWidth: 420, backgroundColor: colors.elev1 },
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: a11y.space(4),
    paddingVertical: a11y.space(3),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  title: { color: colors.label, fontSize: a11yFont.title, fontWeight: "700" },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  list: { padding: a11y.space(3), gap: a11y.space(2) },
  empty: { color: colors.label3, fontSize: a11yFont.body, padding: a11y.space(3) },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    backgroundColor: "transparent",
  },
  rowActive: { backgroundColor: colors.elev2 },
  rowConfirm: { backgroundColor: colors.elev2, padding: a11y.space(3), gap: a11y.space(3), flexWrap: "wrap" },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: a11y.space(3), padding: a11y.space(3), minHeight: 60 },
  rowTitle: { color: colors.label, fontSize: a11yFont.body, fontWeight: "600" },
  rowDate: { color: colors.label3, fontSize: a11yFont.body - 6, marginTop: 2 },
  trash: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  confirmButtons: { flexDirection: "row", gap: a11y.space(2) },
  smallBtn: { minHeight: 44, borderRadius: radius.md, paddingHorizontal: a11y.space(4), alignItems: "center", justifyContent: "center" },
  smallBtnText: { color: colors.label, fontSize: a11yFont.body - 2, fontWeight: "700" },
});
