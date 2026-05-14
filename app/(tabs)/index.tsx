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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, type Message, MODELS } from "@/context/AppContext";
import { callAI, webSearch, getProvider } from "@/lib/ai";
import { useColors } from "@/hooks/useColors";

const SYSTEM_PROMPT = `You are Sultan Agent — a supremely powerful personal AI for Sultan, CEO of MA Engineering. You are like an ultra-smart assistant — fast, direct, and expert in everything.

Your capabilities:
- Write, debug, review, and explain any code in any language
- Analyze business data, quotations, and project plans for MA Engineering
- Give SMM panel insights, pricing strategies, and profit analysis
- Answer any technical or business question with expert-level depth
- Think step by step, be concise but thorough

Memory System: When Sultan says "yaad rakh" or "remember", the app automatically saves it to Firebase. Acknowledge it naturally.
Web Search: When search results are provided, summarize them clearly and cite sources.

Always respond in the same language Sultan uses (Urdu/English/mix). Be direct, powerful, and deliver real value every time.`;

const QUICK_ACTIONS = [
  { label: "Code likhwa", icon: "code-tags", prompt: "Mujhe ek ", color: "#38BDF8" },
  { label: "SMM Analysis", icon: "chart-line", prompt: "SMM panel ke liye pricing strategy batao: ", color: "#818CF8" },
  { label: "MA Engineering", icon: "domain", prompt: "MA Engineering ke liye ek project quotation banao: ", color: "#22C55E" },
  { label: "Web Search", icon: "web", prompt: "/search ", color: "#F97316" },
  { label: "Yaad rakh", icon: "brain", prompt: "yaad rakh ", color: "#EC4899" },
  { label: "Business Idea", icon: "lightbulb-on", prompt: "Ek naya business idea suggest karo Pakistan mein: ", color: "#EAB308" },
];

function MessageBubble({ msg, onCopy }: { msg: Message; onCopy: (text: string) => void }) {
  const colors = useColors();
  const isUser = msg.role === "user";
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const provider = msg.model ? getProvider(msg.model) : "groq";
  const providerColor = provider === "openai" ? "#10A37F" : provider === "gemini" ? "#4285F4" : "#F97316";

  return (
    <View style={[styles.bubbleRow, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.accent + "33" }]}>
          <MaterialCommunityIcons name="robot-excited" size={18} color={colors.accent} />
        </View>
      )}
      <View style={{ maxWidth: "80%" }}>
        <Pressable
          onLongPress={() => {
            onCopy(msg.content);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.aiBubble,
            {
              backgroundColor: isUser ? colors.primary : colors.card,
              borderColor: isUser ? colors.primary + "00" : colors.border,
            },
          ]}
        >
          <Text style={[styles.bubbleText, { color: isUser ? colors.primaryForeground : colors.foreground }]}>
            {msg.content}
          </Text>
        </Pressable>
        <View style={[styles.timeRow, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
          {!isUser && msg.model && (
            <Text style={[styles.modelTag, { color: providerColor }]}>{msg.model}</Text>
          )}
          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{time}</Text>
          {!isUser && (
            <Pressable onPress={() => { onCopy(msg.content); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={12} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>
      {isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary + "33" }]}>
          <MaterialCommunityIcons name="account" size={18} color={colors.primary} />
        </View>
      )}
    </View>
  );
}

function TypingIndicator({ msg }: { msg: string }) {
  const colors = useColors();
  return (
    <View style={styles.bubbleRow}>
      <View style={[styles.avatar, { backgroundColor: colors.accent + "33" }]}>
        <MaterialCommunityIcons name="robot-excited" size={18} color={colors.accent} />
      </View>
      <View style={[styles.bubble, styles.aiBubble, styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={[styles.typingText, { color: colors.mutedForeground }]}>{msg}</Text>
      </View>
    </View>
  );
}

function parseCommand(text: string): { type: "memory" | "search" | "normal"; value: string } {
  const lower = text.toLowerCase().trim();
  const memPrefixes = ["yaad rakh ", "remember ", "save this: ", "note karo "];
  for (const p of memPrefixes) {
    if (lower.startsWith(p)) return { type: "memory", value: text.slice(p.length).trim() };
  }
  if (lower.startsWith("/search ")) return { type: "search", value: text.slice(8).trim() };
  if (lower.startsWith("search karo ")) return { type: "search", value: text.slice(12).trim() };
  return { type: "normal", value: text };
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { messages, addMessage, clearMessages, settings, addMemory, memory, firebaseReady } = useApp();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Thinking...");
  const [copied, setCopied] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const currentModel = MODELS.find((m) => m.id === settings.selectedModel) ?? MODELS[0];
  const provider = currentModel.provider;
  const providerColor = provider === "OpenAI" ? "#10A37F" : provider === "Gemini" ? "#4285F4" : "#F97316";

  const displayMessages = [...messages].reverse();
  const showQuickActions = messages.length === 0 && !loading;

  function handleCopy(text: string) {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert("Copied!", "Message clipboard mein copy ho gaya.");
  }

  function handleQuickAction(prompt: string) {
    setInput(prompt);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const cmd = parseCommand(text);

    if (cmd.type === "memory") {
      addMessage({ role: "user", content: text });
      setLoading(true);
      setLoadingMsg("Yaad kar raha hoon...");
      await addMemory(cmd.value, []);
      addMessage({
        role: "assistant",
        content: `Yaad kar liya! Firebase mein save ho gaya:\n\n"${cmd.value}"\n\nAbhi tak ${memory.length + 1} cheezein yaad hain.`,
        model: "Sultan-Memory",
      });
      setLoading(false);
      return;
    }

    if (cmd.type === "search") {
      addMessage({ role: "user", content: text });
      setLoading(true);
      setLoadingMsg("Web search kar raha hoon...");
      const results = await webSearch(cmd.value, settings.serperKey);
      setLoadingMsg("Summarize kar raha hoon...");
      try {
        const aiSummary = await callAI(
          [{ role: "user", content: `Web search results for "${cmd.value}":\n\n${results}\n\nIn results ko summarize karo clearly.` }],
          settings.selectedModel,
          { groqKey: settings.groqKey, openaiKey: settings.openaiKey, geminiKey: settings.geminiKey, serperKey: settings.serperKey },
          SYSTEM_PROMPT,
        );
        addMessage({ role: "assistant", content: aiSummary, model: settings.selectedModel });
      } catch {
        addMessage({ role: "assistant", content: `Search results:\n\n${results}`, model: "Web-Search" });
      }
      setLoading(false);
      return;
    }

    const activeKey =
      provider === "OpenAI" ? settings.openaiKey : provider === "Gemini" ? settings.geminiKey : settings.groqKey;

    if (!activeKey) {
      Alert.alert(
        `${provider} API Key Missing`,
        `Settings tab mein apna ${provider} API key daalo.\n${
          provider === "Groq"
            ? "groq.com/keys — bilkul free hai"
            : provider === "OpenAI"
              ? "platform.openai.com/api-keys"
              : "aistudio.google.com/app/apikey"
        }`,
        [{ text: "OK" }],
      );
      return;
    }

    addMessage({ role: "user", content: text });
    setLoading(true);
    setLoadingMsg("Thinking...");

    try {
      const history = messages.slice(-20).map((m) => ({ role: m.role, content: m.content }));
      const reply = await callAI(
        [...history, { role: "user", content: text }],
        settings.selectedModel,
        { groqKey: settings.groqKey, openaiKey: settings.openaiKey, geminiKey: settings.geminiKey, serperKey: settings.serperKey },
        SYSTEM_PROMPT,
      );
      addMessage({ role: "assistant", content: reply, model: settings.selectedModel });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      addMessage({ role: "assistant", content: `Kuch galat hua: ${msg}` });
    }
    setLoading(false);
  }

  function handleClear() {
    Alert.alert("Clear Chat", "Saare messages delete honge?", [
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
          <View style={[styles.logoCircle, { backgroundColor: colors.accent + "22" }]}>
            <MaterialCommunityIcons name="robot-excited" size={22} color={colors.accent} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Sultan Agent</Text>
            <View style={styles.modelRow}>
              <View style={[styles.providerDot, { backgroundColor: providerColor }]} />
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                {currentModel.name}
              </Text>
              {firebaseReady && (
                <>
                  <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}> · </Text>
                  <View style={[styles.fbBadge, { backgroundColor: "#22C55E20" }]}>
                    <View style={[styles.fbDot]} />
                    <Text style={styles.fbText}>Firebase</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={handleClear} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="trash-outline" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={displayMessages}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble msg={item} onCopy={handleCopy} />}
          ListHeaderComponent={loading ? <TypingIndicator msg={loadingMsg} /> : null}
          contentContainerStyle={[styles.listContent, { paddingBottom: 8 }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyLogoWrap, { backgroundColor: colors.accent + "15" }]}>
                <MaterialCommunityIcons name="robot-excited-outline" size={52} color={colors.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sultan Agent</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Code, engineering, SMM, business — sab kuch poocho
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Quick Action Buttons */}
        {showQuickActions && (
          <View style={styles.quickActionsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsScroll}
            >
              {QUICK_ACTIONS.map((action) => (
                <Pressable
                  key={action.label}
                  onPress={() => handleQuickAction(action.prompt)}
                  style={({ pressed }) => [
                    styles.quickBtn,
                    {
                      backgroundColor: action.color + "15",
                      borderColor: action.color + "40",
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={action.icon as never} size={15} color={action.color} />
                  <Text style={[styles.quickBtnText, { color: action.color }]}>{action.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 8 : 8),
            },
          ]}
        >
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={input}
              onChangeText={setInput}
              placeholder="Sultan Agent se poocho..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={4000}
              onSubmitEditing={Platform.OS === "web" ? handleSend : undefined}
              blurOnSubmit={Platform.OS === "web"}
            />
            <Pressable
              onPress={handleSend}
              disabled={loading || !input.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: loading || !input.trim() ? colors.border : colors.primary,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Ionicons name="arrow-up" size={18} color={colors.primaryForeground} />
              )}
            </Pressable>
          </View>
          <Text style={[styles.inputHint, { color: colors.mutedForeground }]}>
            Long press message to copy · /search [query] · yaad rakh [baat]
          </Text>
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
  logoCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  modelRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  providerDot: { width: 6, height: 6, borderRadius: 3 },
  headerSubtitle: { fontSize: 11, fontFamily: "Inter_400Regular" },
  fbBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 6, paddingVertical: 1 },
  fbDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#22C55E" },
  fbText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#22C55E" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth },
  listContent: { paddingHorizontal: 12, paddingTop: 12, gap: 4 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 6 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  bubble: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: StyleSheet.hairlineWidth },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderBottomLeftRadius: 4 },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, paddingHorizontal: 16 },
  typingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3, marginHorizontal: 4 },
  modelTag: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  timeText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  copyBtn: { padding: 2 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12, paddingBottom: 20 },
  emptyLogoWrap: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },
  quickActionsWrap: { paddingVertical: 8 },
  quickActionsScroll: { paddingHorizontal: 12, gap: 8 },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputBar: { paddingHorizontal: 12, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, gap: 6 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
    paddingVertical: 6,
  },
  sendBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  inputHint: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", paddingBottom: 2 },
});
