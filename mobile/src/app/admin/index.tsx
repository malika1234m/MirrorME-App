import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Colors, Typography, Spacing, Radius } from "@constants/colors";
import { adminService } from "@services/adminService";

type Tab = "pending" | "all" | "users";

interface Brand {
  id: string; brandName: string; category: string; logoUrl: string | null;
  isVerified: boolean; verificationStatus: string; tier: string;
  user: { email: string; username: string };
  _count: { products: number; follows: number };
}

interface Stats {
  users: number; brands: number; pendingVerification: number; products: number; posts: number;
}

export default function AdminScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [stats, setStats] = useState<Stats | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [statsRes, brandsRes] = await Promise.all([
        adminService.getStats(),
        adminService.listBrands(tab === "pending" ? "pending" : undefined),
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (brandsRes.data) setBrands(brandsRes.data as Brand[]);
    } catch {
      Alert.alert("Error", "Could not load admin data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tab]);

  useEffect(() => { setIsLoading(true); load(); }, [tab]);

  const handleVerify = async (brand: Brand) => {
    Alert.alert(
      `Verify "${brand.brandName}"?`,
      "This will give them a verified badge and PRO tier, and rank them higher in match results.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Verify",
          onPress: async () => {
            setActionLoading(brand.id);
            try {
              await adminService.verifyBrand(brand.id);
              await load();
            } catch { Alert.alert("Error", "Could not verify brand"); }
            finally { setActionLoading(null); }
          },
        },
      ]
    );
  };

  const handleReject = (brand: Brand) => {
    Alert.alert(
      `Reject "${brand.brandName}"?`,
      "The brand will be notified their request was declined.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            setActionLoading(brand.id);
            try {
              await adminService.rejectBrand(brand.id);
              await load();
            } catch { Alert.alert("Error", "Could not reject brand"); }
            finally { setActionLoading(null); }
          },
        },
      ]
    );
  };

  const handleRevoke = (brand: Brand) => {
    Alert.alert(
      `Revoke verification for "${brand.brandName}"?`,
      "They will lose their verified badge and PRO status.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            setActionLoading(brand.id);
            try {
              await adminService.revokeBrand(brand.id);
              await load();
            } catch { Alert.alert("Error", "Could not revoke"); }
            finally { setActionLoading(null); }
          },
        },
      ]
    );
  };

  const statusColor = (s: string) => {
    if (s === "verified") return Colors.primary;
    if (s === "pending") return Colors.warning;
    if (s === "rejected") return Colors.error;
    return Colors.text.tertiary;
  };

  const statusLabel = (s: string) => {
    if (s === "verified") return "Verified";
    if (s === "pending") return "Pending Review";
    if (s === "rejected") return "Rejected";
    return "Not requested";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>MirrorME Admin</Text>
          <Text style={styles.subtitle}>Brand verification & management</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      {/* Stats row */}
      {stats && (
        <View style={styles.statsRow}>
          <StatChip label="Users" value={stats.users} icon="people-outline" />
          <StatChip label="Brands" value={stats.brands} icon="storefront-outline" />
          <StatChip label="Pending" value={stats.pendingVerification} icon="time-outline" highlight={stats.pendingVerification > 0} />
          <StatChip label="Posts" value={stats.posts} icon="images-outline" />
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { key: "pending", label: "Pending", icon: "time-outline" },
          { key: "all", label: "All Brands", icon: "storefront-outline" },
        ] as { key: Tab; label: string; icon: string }[]).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.8}
          >
            {tab === t.key && (
              <LinearGradient colors={Colors.gradient.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            )}
            <Ionicons name={t.icon as any} size={14} color={tab === t.key ? Colors.background : Colors.text.tertiary} />
            <Text style={[styles.tabBtnText, tab === t.key && styles.tabBtnTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: Spacing.lg, gap: 12, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); load(); }} tintColor={Colors.primary} progressBackgroundColor={Colors.card} />
          }
        >
          {brands.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name={tab === "pending" ? "checkmark-circle-outline" : "storefront-outline"} size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyTitle}>{tab === "pending" ? "No pending requests" : "No brands yet"}</Text>
              <Text style={styles.emptySub}>{tab === "pending" ? "All brands have been reviewed" : "Brands will appear here once registered"}</Text>
            </View>
          ) : (
            brands.map((brand) => (
              <View key={brand.id} style={styles.brandCard}>
                {/* Brand info */}
                <View style={styles.brandTop}>
                  <View style={styles.brandLogo}>
                    {brand.logoUrl ? (
                      <Image source={{ uri: brand.logoUrl }} style={styles.logoImg} contentFit="cover" />
                    ) : (
                      <Text style={styles.logoLetter}>{brand.brandName[0]}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.brandName}>{brand.brandName}</Text>
                      {brand.isVerified && <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />}
                    </View>
                    <Text style={styles.brandCategory}>{brand.category}</Text>
                    <Text style={styles.brandEmail}>{brand.user.email}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor(brand.verificationStatus)}20` }]}>
                    <Text style={[styles.statusText, { color: statusColor(brand.verificationStatus) }]}>
                      {statusLabel(brand.verificationStatus)}
                    </Text>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.brandStats}>
                  <Text style={styles.brandStat}>{brand._count.products} products</Text>
                  <Text style={styles.statDot}>·</Text>
                  <Text style={styles.brandStat}>{brand._count.follows} followers</Text>
                  <Text style={styles.statDot}>·</Text>
                  <Text style={styles.brandStat}>{brand.tier} tier</Text>
                </View>

                {/* Action buttons */}
                <View style={styles.actions}>
                  {actionLoading === brand.id ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : brand.isVerified ? (
                    <>
                      <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => router.push(`/business/${brand.id}` as any)}
                      >
                        <Ionicons name="eye-outline" size={14} color={Colors.text.secondary} />
                        <Text style={styles.viewBtnText}>View Page</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.revokeBtn} onPress={() => handleRevoke(brand)}>
                        <Text style={styles.revokeBtnText}>Revoke</Text>
                      </TouchableOpacity>
                    </>
                  ) : brand.verificationStatus === "pending" ? (
                    <>
                      <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() => router.push(`/business/${brand.id}` as any)}
                      >
                        <Ionicons name="eye-outline" size={14} color={Colors.text.secondary} />
                        <Text style={styles.viewBtnText}>View Page</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(brand)}>
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.verifyBtn} onPress={() => handleVerify(brand)}>
                        <LinearGradient colors={Colors.gradient.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                        <Ionicons name="checkmark" size={14} color={Colors.background} />
                        <Text style={styles.verifyBtnText}>Verify</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => router.push(`/business/${brand.id}` as any)}
                    >
                      <Ionicons name="eye-outline" size={14} color={Colors.text.secondary} />
                      <Text style={styles.viewBtnText}>View Page</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const StatChip = ({ label, value, icon, highlight }: { label: string; value: number; icon: string; highlight?: boolean }) => (
  <View style={[styles.statChip, highlight && styles.statChipHighlight]}>
    <Ionicons name={icon as any} size={14} color={highlight ? Colors.warning : Colors.primary} />
    <Text style={[styles.statChipValue, highlight && { color: Colors.warning }]}>{value}</Text>
    <Text style={styles.statChipLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  title: { ...Typography.title3, color: Colors.text.primary },
  subtitle: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 1 },
  adminBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.primarySubtle, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: `${Colors.primary}30`, marginLeft: "auto",
  },
  adminBadgeText: { color: Colors.primary, fontSize: 11, fontWeight: "700" },
  statsRow: {
    flexDirection: "row", paddingHorizontal: Spacing.lg,
    paddingVertical: 12, gap: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  statChip: {
    flex: 1, alignItems: "center", gap: 3,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    paddingVertical: 10, borderWidth: 1, borderColor: Colors.border,
  },
  statChipHighlight: { borderColor: `${Colors.warning}40`, backgroundColor: `${Colors.warning}10` },
  statChipValue: { ...Typography.title3, color: Colors.primary },
  statChipLabel: { fontSize: 9, color: Colors.text.tertiary, fontWeight: "600" },
  tabs: {
    flexDirection: "row", marginHorizontal: Spacing.lg, marginVertical: 10,
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: 3, borderWidth: 1, borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 8, borderRadius: Radius.lg, overflow: "hidden",
  },
  tabBtnActive: {},
  tabBtnText: { ...Typography.label, color: Colors.text.tertiary },
  tabBtnTextActive: { color: Colors.background, fontWeight: "700" },
  brandCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: 10,
  },
  brandTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  brandLogo: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primarySubtle, borderWidth: 1, borderColor: `${Colors.primary}30`,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  logoImg: { width: "100%", height: "100%" },
  logoLetter: { color: Colors.primary, fontSize: 20, fontWeight: "900" },
  brandName: { ...Typography.labelLarge, color: Colors.text.primary },
  brandCategory: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
  brandEmail: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 1 },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "700" },
  brandStats: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandStat: { ...Typography.caption, color: Colors.text.tertiary },
  statDot: { color: Colors.text.tertiary },
  actions: { flexDirection: "row", gap: 8, alignItems: "center" },
  viewBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  viewBtnText: { ...Typography.caption, color: Colors.text.secondary, fontWeight: "600" },
  verifyBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, overflow: "hidden",
  },
  verifyBtnText: { color: Colors.background, fontSize: 12, fontWeight: "700" },
  rejectBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: `${Colors.error}15`, borderWidth: 1, borderColor: `${Colors.error}30`,
  },
  rejectBtnText: { color: Colors.error, fontSize: 12, fontWeight: "700" },
  revokeBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  revokeBtnText: { color: Colors.text.tertiary, fontSize: 12, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { ...Typography.title3, color: Colors.text.secondary },
  emptySub: { ...Typography.body, color: Colors.text.tertiary, textAlign: "center" },
});
