import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type ApiKeyConfig = {
  id: keyof typeof API_KEYS_CONFIG;
  label: string;
  subtitle: string;
  placeholder: string;
  icon: string;
  color: string;
  getUrl: string;
  testUrl?: string;
};

const API_KEYS_CONFIG = {
  groqKey: {
    label: "Groq",
    subtitle: "AI Chat + JARVIX Brain (Free)",
    placeholder: "gsk_...",
    icon: "lightning-bolt",
    color: "#F97316",
    getUrl: "https://console.groq.com/keys",
  },
  elevenlabsApiKey: {
    label: "ElevenLabs",
    subtitle: "JARVIX Voice (Ultra Realistic)",
    placeholder: "sk_...",
    icon: "microphone",
    color: "#8B5CF6",
    getUrl: "https://elevenlabs.io/app/speech-synthesis",
  },
  openaiKey: {
    label: "OpenAI",
    subtitle: "GPT-4o (Optional)",
    placeholder: "sk-...",
    icon: "robot",
    color: "#10A37F",
    getUrl: "https://platform.openai.com/api-keys",
  },
  geminiKey: {
    label: "Gemini",
    subtitle: "Google AI (Optional)",
    placeholder: "AIzaSy...",
    icon: "google",
    color: "#4285F4",
    getUrl: "https://aistudio.google.com/app/apikey",
  },
} as const;

type ApiKeyId = keyof typeof API_KEYS_CONFIG;

function ApiKeyCard({
  keyId,
  config,
  value,
  onChange,
  onTest,
  testing,
  testResult,
}: {
  keyId: ApiKeyId;
  config: (typeof API_KEYS_CONFIG)[ApiKeyId];
  value: string;
  onChange: (v: string) => void;
  onTest: () => void;
  testing: boolean;
  testResult: "idle" | "ok" | "fail";
}) {
  const colors = useColors();
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const hasKey = value.trim().length > 10;

  const statusColor =
    testResult === "ok" ? "#22C55E" : testResult === "fail" ? "#EF4444" : hasKey ? "#F59E0B" : "#475569";
  const statusLabel =
    testResult === "ok" ? "Working ✓" : testResult === "fail" ? "Invalid ✗" : hasKey ? "Saved" : "Not set";

  return (
    <View
      style={[
        styles.apiCard,
        { borderColor: focused ? config.color + "60" : colors.border, backgroundColor: colors.card },
      ]}
    >
      {/* Card header */}
      <View style={styles.apiCardHeader}>
        <View style={[styles.apiIconBg, { backgroundColor: config.color + "20" }]}>
          <MaterialCommunityIcons name={config.icon as never} size={18} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.apiLabel, { color: colors.foreground }]}>{config.label}</Text>
          <Text style={[styles.apiSubtitle, { color: colors.mutedForeground }]}>{config.subtitle}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Input */}
      <View
        style={[
          styles.apiInputRow,
          { borderColor: focused ? config.color + "50" : colors.border, backgroundColor: colors.background },
        ]}
      >
        <TextInput
          style={[styles.apiInput, { color: colors.foreground }]}
          value={value}
          onChangeText={onChange}
          placeholder={config.placeholder}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <Pressable onPress={() => setShow((s) => !s)} style={styles.eyeBtn}>
          <Ionicons
            name={show ? "eye-off-outline" : "eye-outline"}
            size={16}
            color={colors.mutedForeground}
          />
        </Pressable>
      </View>

      {/* Actions */}
      <View style={styles.apiActions}>
        <Pressable
          onPress={() => Linking.openURL(config.getUrl)}
          style={[styles.actionBtn, { borderColor: config.color + "40" }]}
        >
          <Ionicons name="open-outline" size={13} color={config.color} />
          <Text style={[styles.actionBtnText, { color: config.color }]}>Get Key</Text>
        </Pressable>

        {hasKey && (
          <Pressable
            onPress={onTest}
            disabled={testing}
            style={[styles.actionBtn, { borderColor: colors.border }]}
          >
            {testing ? (
              <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Testing...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Test Key</Text>
              </>
            )}
          </Pressable>
        )}

        {value.trim().length > 0 && (
          <Pressable
            onPress={() => {
              Alert.alert("Remove Key", `Remove ${config.label} API key?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => onChange("") },
              ]);
            }}
            style={[styles.actionBtn, { borderColor: "#EF444430" }]}
          >
            <Ionicons name="trash-outline" size={13} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Remove</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Section({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon && <MaterialCommunityIcons name={icon as never} size={14} color={colors.mutedForeground} />}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function PlainCard({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.plainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {children}
    </View>
  );
}

function SettingRow({
  label,
  icon,
  value,
  onChange,
  placeholder,
  last,
  isSecret,
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  last?: boolean;
  isSecret?: boolean;
}) {
  const colors = useColors();
  const [show, setShow] = useState(!isSecret);
  return (
    <View
      style={[
        styles.settingRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <MaterialCommunityIcons name={icon as never} size={18} color={colors.accent} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <TextInput
          style={[styles.settingInput, { color: colors.foreground }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={isSecret && !show}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {isSecret && (
        <Pressable onPress={() => setShow((s) => !s)}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={16} color={colors.mutedForeground} />
        </Pressable>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, models, clearMessages, projects, orders, pushToGitHub } = useApp();

  const [testingKey, setTestingKey] = useState<ApiKeyId | null>(null);
  const [testResults, setTestResults] = useState<Record<ApiKeyId, "idle" | "ok" | "fail">>({
    groqKey: "idle",
    elevenlabsApiKey: "idle",
    openaiKey: "idle",
    geminiKey: "idle",
  });

  async function testKey(keyId: ApiKeyId) {
    setTestingKey(keyId);
    const key = (settings as Record<string, unknown>)[keyId] as string ?? "";
    let ok = false;

    try {
      if (keyId === "groqKey") {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        });
        ok = res.ok;
      } else if (keyId === "elevenlabsApiKey") {
        const res = await fetch("https://api.elevenlabs.io/v1/user", {
          headers: { "xi-api-key": key },
        });
        ok = res.ok;
      } else if (keyId === "openaiKey") {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        });
        ok = res.ok;
      } else if (keyId === "geminiKey") {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
        );
        ok = res.ok;
      }
    } catch {
      ok = false;
    }

    setTestResults((prev) => ({ ...prev, [keyId]: ok ? "ok" : "fail" }));
    setTestingKey(null);
    Haptics.notificationAsync(
      ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    );
    Alert.alert(
      ok ? "✅ Key Working!" : "❌ Key Invalid",
      ok ? `${API_KEYS_CONFIG[keyId].label} key verified successfully!` : `${API_KEYS_CONFIG[keyId].label} key seems invalid. Check and try again.`
    );
  }

  async function handleSyncAll() {
    const allData = {
      projects,
      orders,
      settings: {
        selectedModel: settings.selectedModel,
        githubOwner: settings.githubOwner,
        githubRepo: settings.githubRepo,
        userName: settings.userName,
      },
    };
    const ok = await pushToGitHub(allData, "data/sultan-agent-backup.json");
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Synced! ✅", `Data pushed to github.com/${settings.githubOwner}/${settings.githubRepo}`);
    } else {
      Alert.alert("Error", "GitHub token ya repo name check karo.");
    }
  }

  const allKeysSet = (settings.groqKey ?? "").length > 5 && (settings.elevenlabsApiKey ?? "").length > 5;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
        {allKeysSet && (
          <View style={styles.allSetBadge}>
            <Text style={styles.allSetText}>✓ All keys set</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <Section title="PROFILE" icon="account-circle-outline">
          <PlainCard>
            <SettingRow
              label="Your Name"
              icon="account-circle"
              value={settings.userName}
              onChange={(v) => updateSettings({ userName: v })}
              placeholder="Sultan"
              last
            />
          </PlainCard>
        </Section>

        {/* API Keys */}
        <Section title="API KEYS" icon="key-outline">
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            Keys phone mein save hoti hain, kabhi server pe nahi jaatein.
          </Text>
          {(Object.entries(API_KEYS_CONFIG) as [ApiKeyId, (typeof API_KEYS_CONFIG)[ApiKeyId]][]).map(
            ([keyId, config]) => (
              <ApiKeyCard
                key={keyId}
                keyId={keyId}
                config={config}
                value={(settings as Record<string, unknown>)[keyId] as string ?? ""}
                onChange={(v) => updateSettings({ [keyId]: v } as never)}
                onTest={() => testKey(keyId)}
                testing={testingKey === keyId}
                testResult={testResults[keyId]}
              />
            )
          )}
        </Section>

        {/* Telegram */}
        <Section title="TELEGRAM BOT" icon="send-circle-outline">
          <PlainCard>
            <SettingRow
              label="Bot Token"
              icon="lock-outline"
              value={settings.telegramBotToken ?? ""}
              onChange={(v) => updateSettings({ telegramBotToken: v })}
              placeholder="123456789:ABCdef..."
              isSecret
            />
            <SettingRow
              label="Default Chat ID"
              icon="chat-outline"
              value={settings.telegramChatId ?? ""}
              onChange={(v) => updateSettings({ telegramChatId: v })}
              placeholder="@channel ya -100xxxxxxxxxx"
              last
            />
          </PlainCard>
          <Pressable
            onPress={() => Linking.openURL("https://t.me/BotFather")}
            style={[styles.hintLink, { borderColor: "#2AABEE40" }]}
          >
            <MaterialCommunityIcons name="send" size={13} color="#2AABEE" />
            <Text style={[styles.hintLinkText, { color: "#2AABEE" }]}>
              @BotFather se naya bot banao aur token copy karo
            </Text>
            <Ionicons name="open-outline" size={13} color="#2AABEE" />
          </Pressable>
        </Section>

        {/* JARVIX Voice */}
        <Section title="JARVIX VOICE" icon="waveform">
          <PlainCard>
            <SettingRow
              label="ElevenLabs Voice ID"
              icon="account-voice"
              value={settings.elevenlabsVoiceId ?? ""}
              onChange={(v) => updateSettings({ elevenlabsVoiceId: v })}
              placeholder="21m00Tcm4TlvDq8ikWAM"
            />
            <SettingRow
              label="Default Personality"
              icon="robot-excited"
              value={settings.jarvixPersonality ?? "JARVIS"}
              onChange={(v) => updateSettings({ jarvixPersonality: v })}
              placeholder="JARVIS / HACKER / FRIENDLY / ANIME / PRO"
              last
            />
          </PlainCard>
          <Pressable
            onPress={() => Linking.openURL("https://elevenlabs.io/app/voice-library")}
            style={[styles.hintLink, { borderColor: "#8B5CF640" }]}
          >
            <MaterialCommunityIcons name="microphone" size={13} color="#8B5CF6" />
            <Text style={[styles.hintLinkText, { color: "#8B5CF6" }]}>
              ElevenLabs Voice Library se Voice ID copy karo
            </Text>
            <Ionicons name="open-outline" size={13} color="#8B5CF6" />
          </Pressable>
        </Section>

        {/* AI Model */}
        <Section title="AI MODEL" icon="brain">
          <PlainCard>
            {models.map((m, i) => (
              <Pressable
                key={m.id}
                onPress={() => {
                  updateSettings({ selectedModel: m.id });
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.modelRow,
                  i < models.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modelName, { color: colors.foreground }]}>{m.name}</Text>
                  <Text style={[styles.modelProvider, { color: colors.mutedForeground }]}>{m.provider}</Text>
                </View>
                {settings.selectedModel === m.id ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                ) : (
                  <View style={[styles.radioEmpty, { borderColor: colors.border }]} />
                )}
              </Pressable>
            ))}
          </PlainCard>
        </Section>

        {/* GitHub */}
        <Section title="GITHUB SYNC" icon="github">
          <PlainCard>
            <SettingRow
              label="GitHub Token"
              icon="lock-outline"
              value={settings.githubToken}
              onChange={(v) => updateSettings({ githubToken: v })}
              placeholder="ghp_..."
              isSecret
            />
            <SettingRow
              label="GitHub Username"
              icon="account"
              value={settings.githubOwner}
              onChange={(v) => updateSettings({ githubOwner: v })}
              placeholder="your-username"
            />
            <SettingRow
              label="Repository"
              icon="source-repository"
              value={settings.githubRepo}
              onChange={(v) => updateSettings({ githubRepo: v })}
              placeholder="sultan-agent"
              last
            />
          </PlainCard>
        </Section>

        {/* Actions */}
        <Section title="ACTIONS" icon="cog-outline">
          <PlainCard>
            <Pressable
              onPress={handleSyncAll}
              style={[styles.actionRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            >
              <MaterialCommunityIcons name="cloud-sync" size={20} color={colors.primary} />
              <Text style={[styles.actionRowText, { color: colors.foreground }]}>Sync Data to GitHub</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>
            {settings.githubOwner && settings.githubRepo && (
              <Pressable
                onPress={() =>
                  Linking.openURL(`https://github.com/${settings.githubOwner}/${settings.githubRepo}`)
                }
                style={[styles.actionRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
              >
                <MaterialCommunityIcons name="github" size={20} color={colors.accent} />
                <Text style={[styles.actionRowText, { color: colors.foreground }]}>Open GitHub Repo</Text>
                <Ionicons name="open-outline" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
            <Pressable
              onPress={() =>
                Alert.alert("Clear Chat History", "Saare messages delete honge. Projects safe rahenge.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear",
                    style: "destructive",
                    onPress: () => {
                      clearMessages();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    },
                  },
                ])
              }
              style={styles.actionRow}
            >
              <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
              <Text style={[styles.actionRowText, { color: "#EF4444" }]}>Clear Chat History</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>
          </PlainCard>
        </Section>

        {/* About */}
        <Section title="ABOUT" icon="information-outline">
          <PlainCard>
            <View style={styles.aboutRow}>
              <MaterialCommunityIcons name="robot-excited" size={20} color={colors.accent} />
              <Text style={[styles.actionRowText, { color: colors.foreground }]}>Sultan Agent</Text>
              <Text style={[styles.versionText, { color: colors.mutedForeground }]}>v1.1.0</Text>
            </View>
          </PlainCard>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", flex: 1 },
  allSetBadge: {
    backgroundColor: "#22C55E20",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  allSetText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#22C55E" },
  scroll: { padding: 16, gap: 4 },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, textTransform: "uppercase" },
  sectionHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10, paddingHorizontal: 2, lineHeight: 17 },

  plainCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },

  apiCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  apiCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  apiIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  apiLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  apiSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  apiInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  apiInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, paddingVertical: 10 },
  eyeBtn: { padding: 6 },

  apiActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  settingLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  settingInput: { fontSize: 14, fontFamily: "Inter_400Regular", paddingVertical: 2 },

  hintLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintLinkText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },

  modelRow: { flexDirection: "row", alignItems: "center", padding: 14 },
  modelName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  modelProvider: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  radioEmpty: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },

  actionRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  actionRowText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },

  aboutRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  versionText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
