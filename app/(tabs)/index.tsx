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

function MessageBubble({ msg }: { msg: Message }) {
  const colors = useColors();
  const isUser = msg.role === "user";
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  // Fix: pass full model name to getProvider (no slicing that breaks Gemini 2.0 Flash)
  const provider = msg.model ? getProvider(msg.model) : "groq";
  const providerColor = provider === "openai" ? "#10A37F" : provider === "gemini" ? "#4285F4" : "#F97316";

  return (
    <View style={[styles.bubbleRow, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.accent + "33" }]}>
          <MaterialCommunityIcons name="robot-excited" size={18} color={colors.accent} />
        </View>
      )}
      <View style={{ maxWidth: "78%" }}>
        <View style={[styles.bubble, {
          backgroundColor: isUser ? colors.primary : colors.card,
          borderColor: isUser ? colors.primary : colors.border,
        }]}>
          <Text style={[styles.bubbleText, { color: isUser ? colors.primaryForeground : colors.foreground }]}>
            {msg.content}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
          {!isUser && msg.model && (
            <Text style={{ color: providerColor }}>{msg.model} · </Text>
          )}
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
        <MaterialCommunityIcons name="robot-excited" size={18} color={colors.accent} />
      </View>
      <View style={[styles.bubble, styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={[styles.typingText, { color: colors.mutedForeground }]}>Thinking...</Text>
      </View>
    </View>
  );
}

function parseCommand(text: string): { type: 'memory' | 'search' | 'normal'; value: string } {
  const lower = text.toLowerCase().trim();
  const memPrefixes = ["yaad rakh ", "remember ", "save this: ", "note karo "];
  for (const p of memPrefixes) {
    if (lower.startsWith(p)) return { type: 'memory', value: text.slice(p.length).trim() };
  }
  if (lower.startsWith("/search ")) return { type: 'search', value: text.slice(8).trim() };
  if (lower.startsWith("search karo ")) return { type: 'search', value: text.slice(12).trim() };
  return { type: 'normal', value: text };
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { messages, addMessage, clearMessages, settings, addMemory, memory, firebaseReady } = useApp();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Thinking...");
  const flatRef = useRef<FlatList>(null);

  const currentModel = MODELS.find(m => m.id === settings.selectedModel) ?? MODELS[0];
  const provider = currentModel.provider;
  const providerColor = provider === "OpenAI" ? "#10A37F" : provider === "Gemini" ? "#4285F4" : "#F97316";

  const displayMessages = [...messages].reverse();

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const cmd = parseCommand(text);

    if (cmd.type === 'memory') {
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

    if (cmd.type === 'search') {
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

    const activeKey = provider === "OpenAI" ? settings.openaiKey
      : provider === "Gemini" ? settings.geminiKey
      : settings.groqKey;

    if (!activeKey) {
      Alert.alert(
        `${provider} API Key Missing`,
        `Settings tab mein apna ${provider} API key daalo.\n${
          provider === "Groq" ? "groq.com/keys — bilkul free hai" :
          provider === "OpenAI" ? "platform.openai.com/api-keys" :
          "aistudio.google.com/app/apikey"
        }`,
        [{ text: "OK" }],
      );
      return;
    }

    addMessage({ role: "user", content: text });
    setLoading(true);
    setLoadingMsg("Thinking...");

    try {
      const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
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
      { text: "Clear", style: "destructive", onPress: () => {
        clearMessages();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }},
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, {
        paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
      }]}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="robot-excited" size={26} color={colors.accent} />
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Sultan Agent</Text>
            <View style={styles.modelRow}>
              <View style={[styles.providerDot, { backgroundColor: providerColor }]} />
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                {currentModel.name} · {currentModel.provider}
              </Text>
              {firebaseReady && (
                <View style={[styles.fbDot, { backgroundColor: "#22C55E" }]} />
              )}
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={handleClear} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <FlatList
          ref={flatRef}
          data={displayMessages}
          inverted
          keyExtractor={m => m.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          ListHeaderComponent={loading ? (
            <View style={styles.bubbleRow}>
              <View style={[styles.avatar, { backgroundColor: colors.accent + "33" }]}>
                <MaterialCommunityIcons name="robot-excited" size={18} color={colors.accent} />
              </View>
              <View style={[styles.bubble, styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[styles.typingText, { color: colors.mutedForeground }]}>{loadingMsg}</Text>
              </View>
            </View>
          ) : null}
          contentContainerStyle={[styles.listContent, { paddingBottom: 8 }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="robot-excited-outline" size={64} color={colors.accent + "55"} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sultan Agent Ready</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Code, engineering, SMM, business — sab kuch poocho
              </Text>
              <Text style={[styles.emptyHint, { color: colors.mutedForeground, marginTop: 12 }]}>
                {"💡"} "Yaad rakh [baat]" — Firebase memory mein save{"
"}
                {"🔍"} "/search [query]" — Web search karo
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.card,
              color: colors.foreground,
              borderColor: colors.border,
            }]}
            value={input}
            onChangeText={setInput}
            placeholder={`Message Sultan Agent...`}
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={4000}
            onSubmitEditing={Platform.OS === "web" ? handleSend : undefined}
            blurOnSubmit={Platform.OS === "web"}
          />
          <Pressable
            onPress={handleSend}
            disabled={loading || !input.trim()}
            style={[styles.sendBtn, {
              backgroundColor: (loading || !input.trim()) ? colors.border : colors.primary,
            }]}
          >
            <Ionicons name="send" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  providerDot: { width: 6, height: 6, borderRadius: 3 },
  fbDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },
  headerSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 8 },
  listContent: { paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, borderWidth: StyleSheet.hairlineWidth },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  typingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  bubbleText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  timeText: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4, marginHorizontal: 4 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40 },
  emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32, lineHeight: 22 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 8, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, fontFamily: "Inter_400Regular", maxHeight: 120 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
