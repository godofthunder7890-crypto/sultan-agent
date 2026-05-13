import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const TG_API = (token: string) => `https://api.telegram.org/bot${token}`;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

type TgMessage = {
  id: number;
  chatId: number;
  chatName: string;
  text: string;
  from: string;
  date: number;
  isBot: boolean;
};

type BotInfo = {
  username: string;
  firstName: string;
  id: number;
};

async function tgFetch(token: string, method: string, body?: object) {
  const res = await fetch(`${TG_API(token)}/${method}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default function TelegramScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useApp();

  const token = settings.telegramBotToken ?? "";
  const defaultChatId = settings.telegramChatId ?? "";
  const aiEnabled = settings.telegramAiReply ?? false;

  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [messages, setMessages] = useState<TgMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(defaultChatId);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [tab, setTab] = useState<"chat" | "send" | "info">("chat");
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offsetRef = useRef(0);
  const flatRef = useRef<FlatList>(null);

  // Connect / verify bot token
  const connectBot = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await tgFetch(token, "getMe");
      if (data.ok) {
        setBotInfo({ username: data.result.username, firstName: data.result.first_name, id: data.result.id });
        setConnected(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setConnected(false);
        Alert.alert("Invalid Token", "Bot token galat hai. @BotFather se check karo.");
      }
    } catch {
      setConnected(false);
      Alert.alert("Error", "Internet connection check karo.");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) connectBot();
  }, []);

  // Poll for new messages
  const pollUpdates = useCallback(async () => {
    if (!token || !connected) return;
    try {
      const data = await tgFetch(token, "getUpdates", { offset: offsetRef.current, timeout: 5, limit: 20 });
      if (!data.ok || !data.result?.length) return;

      const newMsgs: TgMessage[] = [];
      for (const update of data.result) {
        offsetRef.current = update.update_id + 1;
        const msg = update.message || update.channel_post;
        if (!msg?.text) continue;

        const tgMsg: TgMessage = {
          id: update.update_id,
          chatId: msg.chat.id,
          chatName: msg.chat.title || msg.chat.username || msg.chat.first_name || String(msg.chat.id),
          text: msg.text,
          from: msg.from?.first_name || msg.chat.title || "Unknown",
          date: msg.date,
          isBot: false,
        };
        newMsgs.push(tgMsg);

        // AI auto-reply
        if (aiEnabled && settings.groqKey && msg.text && !msg.text.startsWith("/")) {
          const groqRes = await fetch(GROQ_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${settings.groqKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: `You are Sultan Agent, a powerful AI assistant for Sultan. Reply in the same language as the user. Be helpful and concise.` },
                { role: "user", content: msg.text },
              ],
              max_tokens: 500,
              temperature: 0.7,
            }),
          }).then((r) => r.json()).catch(() => null);

          const reply = groqRes?.choices?.[0]?.message?.content;
          if (reply) {
            await tgFetch(token, "sendMessage", { chat_id: msg.chat.id, text: reply });
            newMsgs.push({
              id: Date.now(),
              chatId: msg.chat.id,
              chatName: tgMsg.chatName,
              text: reply,
              from: botInfo?.firstName || "Sultan Agent",
              date: Math.floor(Date.now() / 1000),
              isBot: true,
            });
          }
        }
      }
      if (newMsgs.length > 0) {
        setMessages((prev) => [...prev, ...newMsgs].slice(-100));
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {}
  }, [token, connected, aiEnabled, settings.groqKey, botInfo]);

  useEffect(() => {
    if (!connected) return;
    const run = () => {
      pollUpdates().finally(() => {
        pollingRef.current = setTimeout(run, 3000);
      });
    };
    run();
    return () => { if (pollingRef.current) clearTimeout(pollingRef.current); };
  }, [connected, pollUpdates]);

  async function sendMessage() {
    const target = chatId.trim() || defaultChatId;
    const text = input.trim();
    if (!token || !target || !text) {
      Alert.alert("Missing info", "Chat ID aur message dono chahiye.");
      return;
    }
    setSending(true);
    try {
      const data = await tgFetch(token, "sendMessage", { chat_id: target, text });
      if (data.ok) {
        setMessages((prev) => [...prev, {
          id: Date.now(), chatId: Number(target), chatName: target,
          text, from: botInfo?.firstName || "Bot", date: Math.floor(Date.now() / 1000), isBot: true,
        }]);
        setInput("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        Alert.alert("Error", data.description || "Message send nahi hua. Chat ID check karo.");
      }
    } catch {
      Alert.alert("Error", "Internet check karo.");
    }
    setSending(false);
  }

  const TAB_COLOR = "#2AABEE";

  if (!token) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 32 }]}>
        <MaterialCommunityIcons name="send-circle" size={64} color={TAB_COLOR + "60"} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Telegram Bot Setup</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Settings tab mein Telegram Bot Token add karo. @BotFather se token milega.
        </Text>
        <Pressable
          onPress={() => Linking.openURL("https://t.me/BotFather")}
          style={[styles.setupBtn, { backgroundColor: TAB_COLOR }]}
        >
          <MaterialCommunityIcons name="send" size={18} color="#fff" />
          <Text style={styles.setupBtnText}>@BotFather Open Karo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12), borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="send-circle" size={26} color={TAB_COLOR} />
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Telegram</Text>
            {connected && botInfo ? (
              <Text style={[styles.headerSub, { color: TAB_COLOR }]}>@{botInfo.username} • Online</Text>
            ) : (
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Connecting...</Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusDot, { backgroundColor: connected ? "#22C55E" : "#EF4444" }]} />
          {!connected && (
            <Pressable onPress={connectBot} disabled={loading} style={[styles.reconnectBtn, { borderColor: TAB_COLOR + "50" }]}>
              {loading ? <ActivityIndicator size="small" color={TAB_COLOR} /> : <Text style={[styles.reconnectText, { color: TAB_COLOR }]}>Connect</Text>}
            </Pressable>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(["chat", "send", "info"] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tabItem, tab === t && { borderBottomColor: TAB_COLOR, borderBottomWidth: 2 }]}>
            <Text style={[styles.tabText, { color: tab === t ? TAB_COLOR : colors.mutedForeground }]}>
              {t === "chat" ? "📨 Updates" : t === "send" ? "✉️ Send" : "🤖 Bot Info"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Chat Tab */}
      {tab === "chat" && (
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m.id.toString()}
            contentContainerStyle={[styles.chatList, { paddingBottom: insets.bottom + 16 }]}
            renderItem={({ item }) => (
              <View style={[styles.msgRow, { justifyContent: item.isBot ? "flex-end" : "flex-start" }]}>
                <View style={[styles.msgBubble, {
                  backgroundColor: item.isBot ? TAB_COLOR + "22" : colors.card,
                  borderColor: item.isBot ? TAB_COLOR + "50" : colors.border,
                  borderWidth: 1,
                }]}>
                  <Text style={[styles.msgFrom, { color: item.isBot ? TAB_COLOR : colors.mutedForeground }]}>
                    {item.isBot ? `🤖 ${item.from}` : `👤 ${item.from}`}
                    <Text style={{ fontWeight: "400" }}> · {item.chatName}</Text>
                  </Text>
                  <Text style={[styles.msgText, { color: colors.foreground }]}>{item.text}</Text>
                  <Text style={[styles.msgTime, { color: colors.mutedForeground }]}>
                    {new Date(item.date * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <MaterialCommunityIcons name="message-outline" size={48} color={colors.mutedForeground + "60"} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {connected ? "Koi message nahi aaya abhi.\nBot ko Telegram pe message karo!" : "Bot se connect karo pehle."}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />

          {/* AI Auto-reply toggle */}
          <View style={[styles.aiBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
            <MaterialCommunityIcons name="robot" size={18} color={aiEnabled ? "#22C55E" : colors.mutedForeground} />
            <Text style={[styles.aiLabel, { color: aiEnabled ? colors.foreground : colors.mutedForeground }]}>
              AI Auto-Reply {aiEnabled ? "ON" : "OFF"}
            </Text>
            <Switch
              value={aiEnabled}
              onValueChange={(v) => { updateSettings({ telegramAiReply: v }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              trackColor={{ false: colors.border, true: "#22C55E40" }}
              thumbColor={aiEnabled ? "#22C55E" : colors.mutedForeground}
            />
          </View>
        </View>
      )}

      {/* Send Tab */}
      {tab === "send" && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={[styles.sendContainer, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={[styles.sendLabel, { color: colors.mutedForeground }]}>CHAT ID / USERNAME</Text>
            <TextInput
              style={[styles.sendInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              value={chatId}
              onChangeText={setChatId}
              placeholder="e.g. @mychannel or -1001234567890"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.sendHint, { color: colors.mutedForeground }]}>
              Channel ke liye: @channelname ya -100xxxxxxxxxx{"\n"}
              Personal chat ke liye: apna Telegram User ID daalo
            </Text>

            <Text style={[styles.sendLabel, { color: colors.mutedForeground, marginTop: 16 }]}>MESSAGE</Text>
            <TextInput
              style={[styles.sendTextArea, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              value={input}
              onChangeText={setInput}
              placeholder="Yahan message likho..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Pressable
              onPress={sendMessage}
              disabled={sending || !connected}
              style={[styles.sendBtn2, { backgroundColor: connected ? TAB_COLOR : colors.muted }]}
            >
              {sending
                ? <ActivityIndicator color="#fff" />
                : <>
                    <MaterialCommunityIcons name="send" size={18} color="#fff" />
                    <Text style={styles.sendBtnText}>Send Message</Text>
                  </>}
            </Pressable>

            {/* Quick channels */}
            {defaultChatId ? (
              <Pressable
                onPress={() => { setChatId(defaultChatId); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.quickChip, { borderColor: TAB_COLOR + "50", backgroundColor: TAB_COLOR + "10" }]}
              >
                <MaterialCommunityIcons name="star" size={14} color={TAB_COLOR} />
                <Text style={[styles.quickChipText, { color: TAB_COLOR }]}>Default: {defaultChatId}</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Bot Info Tab */}
      {tab === "info" && (
        <ScrollView contentContainerStyle={[styles.infoContainer, { paddingBottom: insets.bottom + 24 }]}>
          {connected && botInfo ? (
            <>
              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.botAvatar, { backgroundColor: TAB_COLOR + "20" }]}>
                  <MaterialCommunityIcons name="robot" size={40} color={TAB_COLOR} />
                </View>
                <Text style={[styles.botName, { color: colors.foreground }]}>{botInfo.firstName}</Text>
                <Text style={[styles.botUsername, { color: TAB_COLOR }]}>@{botInfo.username}</Text>
                <Text style={[styles.botId, { color: colors.mutedForeground }]}>ID: {botInfo.id}</Text>
                <Pressable
                  onPress={() => Linking.openURL(`https://t.me/${botInfo.username}`)}
                  style={[styles.openTgBtn, { backgroundColor: TAB_COLOR }]}
                >
                  <Text style={styles.openTgText}>Telegram pe Open Karo</Text>
                </Pressable>
              </View>

              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>Stats</Text>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Messages received</Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{messages.filter((m) => !m.isBot).length}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>AI replies sent</Text>
                  <Text style={[styles.statValue, { color: "#22C55E" }]}>{messages.filter((m) => m.isBot).length}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>AI Auto-Reply</Text>
                  <Text style={[styles.statValue, { color: aiEnabled ? "#22C55E" : "#EF4444" }]}>{aiEnabled ? "ON" : "OFF"}</Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>Instructions</Text>
                <Text style={[styles.instrText, { color: colors.mutedForeground }]}>
                  1. Bot ko apne Telegram channel/group mein add karo as Admin{"\n\n"}
                  2. "Chat ID" find karne ke liye: @userinfobot ko message karo{"\n\n"}
                  3. AI Auto-Reply ON karo — koi bhi message kare, Sultan Agent automatically reply karega{"\n\n"}
                  4. Send tab se seedha kisi ko bhi message bhej sakte ho
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyChat}>
              <ActivityIndicator color={TAB_COLOR} size="large" />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, marginTop: 12 }]}>Connecting to bot...</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  reconnectBtn: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  reconnectText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  chatList: { padding: 12, gap: 8, flexGrow: 1 },
  msgRow: { flexDirection: "row" },
  msgBubble: { maxWidth: "85%", borderRadius: 16, padding: 12, gap: 3 },
  msgFrom: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  msgText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  msgTime: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "right" },
  aiBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  aiLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 16 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  setupBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, marginTop: 20 },
  setupBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  sendContainer: { padding: 16, gap: 4 },
  sendLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 6 },
  sendInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  sendHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 6 },
  sendTextArea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 120 },
  sendBtn2: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, paddingVertical: 14, marginTop: 16 },
  sendBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  quickChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginTop: 12, alignSelf: "flex-start" },
  quickChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoContainer: { padding: 16, gap: 12 },
  infoCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, alignItems: "center", gap: 6 },
  botAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  botName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  botUsername: { fontSize: 16, fontFamily: "Inter_500Medium" },
  botId: { fontSize: 12, fontFamily: "Inter_400Regular" },
  openTgBtn: { marginTop: 12, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  openTgText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  infoCardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", alignSelf: "flex-start", marginBottom: 8 },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", paddingVertical: 6 },
  statLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  instrText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 22, alignSelf: "flex-start" },
});
