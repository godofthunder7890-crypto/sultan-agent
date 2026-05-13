import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, type Message } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? "";

const SYSTEM_PROMPT = `You are Sultan Agent — a supremely powerful personal AI for Sultan, CEO of MA Engineering. You are like Replit Agent, but smarter, faster, and built exclusively for Sultan.

Your capabilities:
- Write, debug, review, and explain any code in any language
- Analyze business data, quotations, and project plans for MA Engineering  
- Give SMM panel insights, pricing strategies, and profit analysis
- Answer any technical or business question with expert-level depth
- Think step by step, be concise but thorough

Always respond in the same language Sultan uses (Urdu/English/mix). Be direct, powerful, and deliver real value every time.`;

async function callGroq(
  messages: { role: string; content: string }[],
  model: string,
  groqKey: string
) {
  const key = groqKey || GROQ_API_KEY;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content as string;
}

function MessageBubble({ msg }: { msg: Message }) {
  const colors = useColors();
  const isUser = msg.role === "user";
  const time = new Date(msg.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: isUser ? "flex-end" : "flex-start" },
      ]}
    >
      {!isUser && (
        <View
          style={[styles.avatar, { backgroundColor: colors.accent + "33" }]}
        >
          <MaterialCommunityIcons
            name="robot-excited"
            size={18}
            color={colors.accent}
          />
        </View>
      )}
      <View style={{ maxWidth: "78%" }}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isUser ? colors.primary : colors.card,
              borderColor: isUser ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isUser ? colors.primaryForeground : colors.foreground },
            ]}
          >
            {msg.content}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
          {isUser ? "" : `${msg.model ?? "Sultan Agent"} · `}
          {time}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  const colors = useColors();
  return (
    <View style={styles.bubbleRow}>
      <View style={[styles.avatar, { backgroundColor: colors.accent + "33" }]}>
        <MaterialCommunityIcons
          name="robot-excited"
          size={18}
          color={colors.accent}
        />
      </View>
      <View
        style={[
          styles.bubble,
          styles.typingBubble,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={[styles.typingText, { color: colors.mutedForeground }]}>
          Thinking...
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { messages, addMessage, clearMessages, settings } = useApp();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const displayMessages = [...messages].reverse();

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const groqKey = settings.groqKey || GROQ_API_KEY;
    if (!groqKey) {
      Alert.alert(
        "API Key Missing",
        "Settings tab mein apna Groq API Key daalo. groq.com pe free mein milti hai.",
        [{ text: "OK" }]
      );
      return;
    }

    setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    addMessage({ role: "user", content: text });

    setLoading(true);
    try {
      const history = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reply = await callGroq(
        [...history, { role: "user", content: text }],
        settings.selectedModel,
        groqKey
      );
      addMessage({
        role: "assistant",
        content: reply,
        model: settings.selectedModel.split("-").slice(0, 3).join("-"),
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      addMessage({
        role: "assistant",
        content: `Error: ${msg}. Check your API key in Settings.`,
      });
    }
    setLoading(false);
  }

  function handleClear() {
    Alert.alert("Clear Chat", "Delete all messages?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          clearMessages();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="robot-excited"
            size={26}
            color={colors.accent}
          />
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Sultan Agent
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.mutedForeground }]}
            >
              {settings.selectedModel.split("-").slice(0, 3).join(" ")}
            </Text>
          </View>
        </View>
        <Pressable onPress={handleClear} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={displayMessages}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          ListHeaderComponent={loading ? <TypingIndicator /> : null}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 8 },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="robot-excited-outline"
                size={64}
                color={colors.accent + "55"}
              />
              <Text
                style={[styles.emptyTitle, { color: colors.foreground }]}
              >
                Sultan Agent Ready
              </Text>
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                Ask me anything — code, engineering, SMM, business
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />

        {/* Input */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8),
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Ask Sultan Agent anything..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleSend}
            disabled={loading || !input.trim()}
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  loading || !input.trim()
                    ? colors.muted
                    : colors.primary,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons
                name="arrow-up"
                size={20}
                color={
                  loading || !input.trim()
                    ? colors.mutedForeground
                    : colors.primaryForeground
                }
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  headerSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  clearBtn: { padding: 8 },
  listContent: { padding: 16, gap: 12, flexGrow: 1 },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  typingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  timeText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
    marginHorizontal: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
