import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, Radius } from "@constants/colors";

const MOCK_NOTIFICATIONS = [
  { id: "1", icon: "heart" as const, color: Colors.accent, text: "Someone liked your outfit post", time: "2m ago" },
  { id: "2", icon: "chatbubble" as const, color: Colors.accentBlue, text: "New comment on your post", time: "14m ago" },
  { id: "3", icon: "star" as const, color: Colors.warning, text: "Your outfit was rated 9/10", time: "1h ago" },
  { id: "4", icon: "person-add" as const, color: Colors.primary, text: "Someone started following you", time: "3h ago" },
  { id: "5", icon: "storefront" as const, color: Colors.primary, text: "Studio NOMO matches your style", time: "5h ago" },
];

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Coming soon banner */}
      <View style={styles.banner}>
        <LinearGradient colors={[Colors.primarySubtle, "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <Ionicons name="sparkles" size={16} color={Colors.primary} />
        <Text style={styles.bannerText}>Real-time notifications coming soon — here's a preview</Text>
      </View>

      {/* Mock notification list */}
      <View style={styles.list}>
        {MOCK_NOTIFICATIONS.map((n, i) => (
          <View key={n.id} style={[styles.row, i < MOCK_NOTIFICATIONS.length - 1 && styles.rowBorder]}>
            <View style={[styles.iconWrap, { backgroundColor: `${n.color}20` }]}>
              <Ionicons name={n.icon} size={18} color={n.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifText}>{n.text}</Text>
              <Text style={styles.notifTime}>{n.time}</Text>
            </View>
            <View style={styles.unreadDot} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  title: { ...Typography.title3, color: Colors.text.primary },
  banner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    margin: Spacing.lg, padding: Spacing.lg,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: `${Colors.primary}25`, overflow: "hidden",
  },
  bannerText: { flex: 1, ...Typography.caption, color: Colors.primary },
  list: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  notifText: { ...Typography.label, color: Colors.text.primary, lineHeight: 20 },
  notifTime: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 3 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
