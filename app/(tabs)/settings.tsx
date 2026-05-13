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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function Row({ label, value, onPress, icon, color, last }: { label: string; value?: string; onPress?: () => void; icon?: string; color?: string; last?: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        { opacity: pressed && onPress ? 0.7 : 1 },
      ]}
    >
      {icon && (
        <MaterialCommunityIcons name={icon as never} size={20} color={color ?? colors.accent} style={{ marginRight: 10 }} />
      )}
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: color ?? colors.mutedForeground }]} numberOfLines={1}>{value}</Text> : null}
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />}
    </Pressable>
  );
}

function KeyInput({ label, value, onChange, placeholder, icon }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; icon: string }) {
  const colors = useColors();
  const [show, setShow] = useState(false);
  return (
    <View style={[styles.keyRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <MaterialCommunityIcons name={icon as never} size={18} color={colors.accent} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.keyLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <TextInput
          style={[styles.keyInput, { color: colors.foreground }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
      </View>
      <Pressable onPress={() => setShow((s) => !s)}>
        <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, models, clearMessages, projects, orders, pushToGitHub } = useApp();

  async function handleSyncAll() {
    const allData = { projects, orders, settings: { selectedModel: settings.selectedModel, githubOwner: settings.githubOwner, githubRepo: settings.githubRepo, userName: settings.userName } };
    const ok = await pushToGitHub(allData, "data/sultan-agent-backup.json");
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Synced!", `All data pushed to github.com/${settings.githubOwner}/${settings.githubRepo}`);
    } else {
      Alert.alert("Error", "Check GitHub token, owner, and repo name below");
    }
  }

  function handleClearAll() {
    Alert.alert("Clear All Data", "This will delete all messages. Projects and orders will remain.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => { clearMessages(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12), backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <Section title="PROFILE">
          <View style={[styles.keyRow, { borderBottomWidth: 0 }]}>
            <MaterialCommunityIcons name="account-circle" size={18} color={colors.accent} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.keyLabel, { color: colors.mutedForeground }]}>Your Name</Text>
              <TextInput
                style={[styles.keyInput, { color: colors.foreground }]}
                value={settings.userName}
                onChangeText={(v) => updateSettings({ userName: v })}
                placeholder="Sultan"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>
        </Section>

        {/* AI Model */}
        <Section title="AI MODEL">
          {models.map((m, i) => (
            <Pressable
              key={m.id}
              onPress={() => { updateSettings({ selectedModel: m.id }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.modelRow, i < models.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.modelName, { color: colors.foreground }]}>{m.name}</Text>
                <Text style={[styles.modelProvider, { color: colors.mutedForeground }]}>{m.provider}</Text>
              </View>
              {settings.selectedModel === m.id && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </Section>

        {/* API Keys */}
        <Section title="API KEYS">
          <KeyInput label="Groq API Key" value={settings.groqKey ?? ""} onChange={(v) => updateSettings({ groqKey: v })} placeholder="gsk_..." icon="lightning-bolt" />
          <KeyInput label="ElevenLabs API Key" value={settings.elevenlabsApiKey ?? ""} onChange={(v) => updateSettings({ elevenlabsApiKey: v })} placeholder="sk_..." icon="microphone" />
          <View style={[styles.keyRow, { borderBottomWidth: 0 }]}>
            <MaterialCommunityIcons name={"account-voice" as never} size={18} color={colors.accent} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.keyLabel, { color: colors.mutedForeground }]}>ElevenLabs Voice ID</Text>
              <TextInput
                style={[styles.keyInput, { color: colors.foreground }]}
                value={settings.elevenlabsVoiceId ?? ""}
                onChangeText={(v) => updateSettings({ elevenlabsVoiceId: v })}
                placeholder="21m00Tcm4TlvDq8ikWAM"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
              />
            </View>
          </View>
        </Section>

        {/* GitHub */}
        <Section title="GITHUB SYNC">
          <KeyInput label="GitHub Token" value={settings.githubToken} onChange={(v) => updateSettings({ githubToken: v })} placeholder="ghp_..." icon="github" />
          <KeyInput label="GitHub Username" value={settings.githubOwner} onChange={(v) => updateSettings({ githubOwner: v })} placeholder="your-username" icon="account" />
          <View style={[styles.keyRow, { borderBottomWidth: 0 }]}>
            <MaterialCommunityIcons name="source-repository" size={18} color={colors.accent} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.keyLabel, { color: colors.mutedForeground }]}>Repository</Text>
              <TextInput
                style={[styles.keyInput, { color: colors.foreground }]}
                value={settings.githubRepo}
                onChangeText={(v) => updateSettings({ githubRepo: v })}
                placeholder="sultan-agent"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>
        </Section>

        {/* Actions */}
        <Section title="ACTIONS">
          <Row icon="cloud-sync" label="Sync All to GitHub" color={colors.primary} onPress={handleSyncAll} />
          {settings.githubOwner && settings.githubRepo && (
            <Row icon="github" label="Open GitHub Repo" color={colors.accent} onPress={() => Linking.openURL(`https://github.com/${settings.githubOwner}/${settings.githubRepo}`)} />
          )}
          <Row icon="delete-outline" label="Clear Chat History" color={colors.destructive} onPress={handleClearAll} last />
        </Section>

        {/* Info */}
        <Section title="ABOUT">
          <Row label="Sultan Agent" value="v1.0.0" icon="robot-excited" last />
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  scroll: { padding: 16, gap: 8 },
  section: { gap: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, paddingHorizontal: 4 },
  sectionCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 14, gap: 4 },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  rowValue: { fontSize: 14, fontFamily: "Inter_400Regular", maxWidth: 160 },
  keyRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  keyLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  keyInput: { fontSize: 14, fontFamily: "Inter_400Regular", paddingVertical: 2 },
  modelRow: { flexDirection: "row", alignItems: "center", padding: 14 },
  modelName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  modelProvider: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
