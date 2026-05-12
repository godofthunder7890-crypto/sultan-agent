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

import { useApp, type SmmOrder } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const STATUS_COLORS: Record<SmmOrder["status"], string> = {
  pending: "#F59E0B",
  processing: "#38BDF8",
  completed: "#22C55E",
  cancelled: "#EF4444",
};

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function OrderCard({
  order,
  onDelete,
  onStatusChange,
}: {
  order: SmmOrder;
  onDelete: () => void;
  onStatusChange: (s: SmmOrder["status"]) => void;
}) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[order.status];
  const total = order.quantity * order.unitPrice;

  function handlePress() {
    Alert.alert(
      order.service,
      `Panel: ${order.panel}\nQty: ${order.quantity.toLocaleString()}\nUnit: PKR ${order.unitPrice}\nTotal: PKR ${total.toLocaleString()}`,
      [
        { text: "Close", style: "cancel" },
        {
          text: "Next Status",
          onPress: () => {
            const statuses: SmmOrder["status"][] = ["pending", "processing", "completed", "cancelled"];
            const next = statuses[(statuses.indexOf(order.status) + 1) % statuses.length];
            onStatusChange(next);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.orderCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.orderTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.orderService, { color: colors.foreground }]} numberOfLines={1}>
            {order.service}
          </Text>
          <Text style={[styles.orderPanel, { color: colors.mutedForeground }]}>{order.panel}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor + "22" }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.orderBottom}>
        <Text style={[styles.orderQty, { color: colors.mutedForeground }]}>
          {order.quantity.toLocaleString()} units
        </Text>
        <Text style={[styles.orderTotal, { color: colors.primary }]}>
          PKR {total.toLocaleString()}
        </Text>
      </View>
    </Pressable>
  );
}

export default function SmmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, addOrder, updateOrder, deleteOrder, pushToGitHub } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ panel: "", service: "", quantity: "", unitPrice: "", status: "pending" as SmmOrder["status"] });

  const totalRevenue = orders.reduce((s, o) => s + o.quantity * o.unitPrice, 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const completed = orders.filter((o) => o.status === "completed").length;

  function handleAdd() {
    if (!form.panel || !form.service) { Alert.alert("Error", "Panel and service required"); return; }
    addOrder({ panel: form.panel, service: form.service, quantity: parseInt(form.quantity) || 0, unitPrice: parseFloat(form.unitPrice) || 0, status: form.status });
    setForm({ panel: "", service: "", quantity: "", unitPrice: "", status: "pending" });
    setShowAdd(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleSync() {
    const ok = await pushToGitHub(orders, "data/smm-orders.json");
    Alert.alert(ok ? "Synced!" : "Error", ok ? "Pushed to GitHub" : "Configure GitHub in Settings");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12), backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>SMM Dashboard</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={handleSync} style={styles.iconBtn}>
            <Ionicons name="cloud-upload-outline" size={20} color={colors.accent} />
          </Pressable>
          <Pressable onPress={() => setShowAdd(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={22} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </View>

      <View style={styles.stats}>
        <StatCard label="Orders" value={String(orders.length)} color={colors.accent} />
        <StatCard label="Pending" value={String(pending)} color={colors.warning} />
        <StatCard label="Completed" value={String(completed)} color={colors.success} />
        <StatCard label="Revenue" value={`${(totalRevenue / 1000).toFixed(0)}K`} color={colors.primary} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onDelete={() => deleteOrder(item.id)}
            onStatusChange={(s) => updateOrder(item.id, { status: s })}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="chart-line" size={56} color={colors.mutedForeground + "55"} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Orders Yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Track your SMM panel orders here</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Order</Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {([["Panel Name *", "panel", "SMMGlobe"], ["Service *", "service", "Instagram Followers"], ["Quantity", "quantity", "1000"], ["Unit Price (PKR)", "unitPrice", "0.5"]] as [string, string, string][]).map(([label, key, ph]) => (
                <View key={key} style={styles.field}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]} placeholder={ph} placeholderTextColor={colors.mutedForeground} value={form[key as keyof typeof form] as string} onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))} keyboardType={["quantity", "unitPrice"].includes(key) ? "numeric" : "default"} />
                </View>
              ))}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Status</Text>
                <View style={styles.statusRow}>
                  {(["pending", "processing", "completed", "cancelled"] as SmmOrder["status"][]).map((s) => (
                    <Pressable key={s} onPress={() => setForm((f) => ({ ...f, status: s }))} style={[styles.statusChip, { backgroundColor: form.status === s ? STATUS_COLORS[s] + "33" : colors.input, borderColor: form.status === s ? STATUS_COLORS[s] : colors.border }]}>
                      <Text style={{ color: form.status === s ? STATUS_COLORS[s] : colors.mutedForeground, fontSize: 12, fontFamily: "Inter_500Medium" }}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
            <Pressable onPress={handleAdd} style={[styles.submit, { backgroundColor: colors.primary }]}>
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Add Order</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 8 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", padding: 12, gap: 8 },
  statCard: { flex: 1, padding: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", gap: 2 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  list: { padding: 12, gap: 10 },
  orderCard: { padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
  orderTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  orderService: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  orderPanel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  orderBottom: { flexDirection: "row", justifyContent: "space-between" },
  orderQty: { fontSize: 13, fontFamily: "Inter_400Regular" },
  orderTotal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  overlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  field: { gap: 6, marginBottom: 12 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  submit: { borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8 },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
