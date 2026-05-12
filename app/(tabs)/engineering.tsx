import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, type Project } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const STATUS_COLORS: Record<Project["status"], string> = {
  planning: "#F59E0B",
  active: "#22C55E",
  completed: "#38BDF8",
  "on-hold": "#EF4444",
};

const STATUS_LABELS: Record<Project["status"], string> = {
  planning: "Planning",
  active: "Active",
  completed: "Completed",
  "on-hold": "On Hold",
};

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <MaterialCommunityIcons
        name={icon as never}
        size={22}
        color={color}
        style={{ marginBottom: 4 }}
      />
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function ProjectCard({
  project,
  onDelete,
  onStatusChange,
}: {
  project: Project;
  onDelete: () => void;
  onStatusChange: (status: Project["status"]) => void;
}) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[project.status];

  function handlePress() {
    Alert.alert(project.name, `Client: ${project.client}\n${project.description}`, [
      { text: "Close", style: "cancel" },
      {
        text: "Change Status",
        onPress: () => {
          const statuses: Project["status"][] = [
            "planning",
            "active",
            "completed",
            "on-hold",
          ];
          const next =
            statuses[(statuses.indexOf(project.status) + 1) % statuses.length];
          onStatusChange(next);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete();
        },
      },
    ]);
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.projectCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.projectTop}>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.projectName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {project.name}
          </Text>
          <Text
            style={[styles.projectClient, { color: colors.mutedForeground }]}
          >
            {project.client}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColor + "22" },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[project.status]}
          </Text>
        </View>
      </View>
      {project.description ? (
        <Text
          style={[styles.projectDesc, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {project.description}
        </Text>
      ) : null}
      <View style={styles.projectBottom}>
        <Text style={[styles.projectAmount, { color: colors.primary }]}>
          PKR {project.amount.toLocaleString()}
        </Text>
        <Text style={[styles.projectDate, { color: colors.mutedForeground }]}>
          {project.date}
        </Text>
      </View>
    </Pressable>
  );
}

export default function EngineeringScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { projects, addProject, updateProject, deleteProject, pushToGitHub } =
    useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    client: "",
    description: "",
    amount: "",
    status: "active" as Project["status"],
  });

  const totalRevenue = projects.reduce((sum, p) => sum + p.amount, 0);
  const activeCount = projects.filter((p) => p.status === "active").length;
  const completedCount = projects.filter(
    (p) => p.status === "completed"
  ).length;

  function handleAdd() {
    if (!form.name || !form.client) {
      Alert.alert("Error", "Name and client are required");
      return;
    }
    addProject({
      name: form.name,
      client: form.client,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      status: form.status,
    });
    setForm({
      name: "",
      client: "",
      description: "",
      amount: "",
      status: "active",
    });
    setShowAdd(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleSync() {
    const ok = await pushToGitHub(projects, "data/engineering.json");
    Alert.alert(ok ? "Synced!" : "Error", ok ? "Pushed to GitHub" : "Check GitHub settings");
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          MA Engineering
        </Text>
        <View style={styles.headerActions}>
          <Pressable onPress={handleSync} style={styles.headerBtn}>
            <Ionicons name="cloud-upload-outline" size={20} color={colors.accent} />
          </Pressable>
          <Pressable
            onPress={() => setShowAdd(true)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={22} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <StatCard
          label="Total Projects"
          value={String(projects.length)}
          icon="briefcase-outline"
          color={colors.accent}
        />
        <StatCard
          label="Active"
          value={String(activeCount)}
          icon="lightning-bolt"
          color={colors.success}
        />
        <StatCard
          label="Revenue"
          value={`PKR ${(totalRevenue / 1000).toFixed(0)}K`}
          icon="cash"
          color={colors.primary}
        />
        <StatCard
          label="Done"
          value={String(completedCount)}
          icon="check-circle"
          color={colors.warning}
        />
      </View>

      {/* Projects List */}
      <FlatList
        data={projects}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onDelete={() => deleteProject(item.id)}
            onStatusChange={(s) => updateProject(item.id, { status: s })}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom:
              insets.bottom + (Platform.OS === "web" ? 34 : 16),
          },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={56}
              color={colors.mutedForeground + "66"}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No Projects Yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add your first MA Engineering project
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, { color: colors.foreground }]}
              >
                New Project
              </Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(
                [
                  ["Project Name *", "name", "MA Electrical Wiring"],
                  ["Client Name *", "client", "ABC Corporation"],
                  ["Description", "description", "Brief details..."],
                  ["Amount (PKR)", "amount", "50000"],
                ] as [string, string, string][]
              ).map(([label, key, placeholder]) => (
                <View key={key} style={styles.field}>
                  <Text
                    style={[styles.fieldLabel, { color: colors.mutedForeground }]}
                  >
                    {label}
                  </Text>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      {
                        backgroundColor: colors.input,
                        color: colors.foreground,
                        borderColor: colors.border,
                      },
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    value={form[key as keyof typeof form] as string}
                    onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                    keyboardType={key === "amount" ? "numeric" : "default"}
                    multiline={key === "description"}
                  />
                </View>
              ))}
              {/* Status selector */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Status
                </Text>
                <View style={styles.statusRow}>
                  {(
                    ["planning", "active", "completed", "on-hold"] as Project["status"][]
                  ).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setForm((f) => ({ ...f, status: s }))}
                      style={[
                        styles.statusOption,
                        {
                          backgroundColor:
                            form.status === s
                              ? STATUS_COLORS[s] + "33"
                              : colors.input,
                          borderColor:
                            form.status === s
                              ? STATUS_COLORS[s]
                              : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            form.status === s
                              ? STATUS_COLORS[s]
                              : colors.mutedForeground,
                          fontSize: 12,
                          fontFamily: "Inter_500Medium",
                        }}
                      >
                        {STATUS_LABELS[s]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
            <Pressable
              onPress={handleAdd}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            >
              <Text
                style={[styles.submitText, { color: colors.primaryForeground }]}
              >
                Add Project
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerBtn: { padding: 8 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", padding: 12, gap: 8 },
  statCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  listContent: { padding: 12, gap: 10 },
  projectCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  projectTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  projectName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  projectClient: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  projectDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  projectBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  projectAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  projectDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  field: { gap: 6, marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  fieldInput: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  submitBtn: { borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8 },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
