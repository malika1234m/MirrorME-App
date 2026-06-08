import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, ActivityIndicator, RefreshControl, Share, Alert,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@store/authStore";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { businessService } from "@services/businessService";
import { Business, Product } from "@models/index";
import { ProductCard } from "@components/business/ProductCard";
import { formatCount } from "@utils/formatters";

const CATEGORY_COLORS: Record<string, [string, string]> = {
  Minimalist: ["#C8FF00", "#78D500"],
  Streetwear: ["#FF3CAC", "#8B5CF6"],
  "Old Money": ["#D4AF37", "#B8860B"],
  Sustainable: ["#38a169", "#276749"],
  Luxury: ["#8B5CF6", "#6D28D9"],
  Boho: ["#dd6b20", "#c05621"],
};

export default function BusinessProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuthStore();

  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!id) return;
    try {
      const [bizRes, prodRes] = await Promise.all([
        businessService.getById(id),
        businessService.getProducts(id),
      ]);
      if (bizRes.data) { setBusiness(bizRes.data); setIsFollowing(bizRes.data.isFollowing ?? false); }
      if (prodRes.data) setProducts(prodRes.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [id]);

  const onRefresh = async () => { setIsRefreshing(true); await fetch(); setIsRefreshing(false); };

  const openUrl = async (url: string) => {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const canOpen = await Linking.canOpenURL(normalized);
    if (canOpen) {
      await Linking.openURL(normalized);
    } else {
      Alert.alert("Cannot open link", "This URL doesn't appear to be valid.");
    }
  };

  const handleFollow = async () => {
    if (!business) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await businessService.toggleFollow(business.id); }
    catch { setIsFollowing(prev); }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (error || !business) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={[styles.navBtn, { margin: Spacing.lg }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.errorWrap}>
          <Ionicons name="storefront-outline" size={48} color={Colors.text.tertiary} />
          <Text style={styles.errorText}>{error ?? "Brand not found"}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetch}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const catColors = CATEGORY_COLORS[business.category] ?? Colors.gradient.primary;
  const isOwner = currentUser?.id === business.user.id;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sticky nav */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{business.brandName}</Text>
        {isOwner ? (
          <TouchableOpacity
            style={styles.editNavBtn}
            onPress={() => router.push("/business/edit")}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={15} color={Colors.background} />
            <Text style={styles.editNavBtnText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => Share.share({ message: `Check out ${business.brandName} on MirrorME!` })}
          >
            <Ionicons name="share-social-outline" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} progressBackgroundColor={Colors.card} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Cover */}
        <View style={styles.coverWrap}>
          {business.coverUrl ? (
            <Image source={{ uri: business.coverUrl }} style={styles.cover} contentFit="cover" />
          ) : (
            <LinearGradient colors={[...catColors, Colors.card]} style={styles.cover} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          )}
          <LinearGradient colors={["transparent", Colors.background]} style={styles.coverFade} />
        </View>

        {/* Brand header */}
        <View style={styles.brandHeader}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            {business.logoUrl ? (
              <Image source={{ uri: business.logoUrl }} style={styles.logo} contentFit="cover" />
            ) : (
              <LinearGradient colors={catColors} style={styles.logo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.logoLetter}>{business.brandName[0]}</Text>
              </LinearGradient>
            )}
            {business.isVerified && (
              <View style={styles.verifiedBadge}>
                <LinearGradient colors={Colors.gradient.primary} style={styles.verifiedGrad}>
                  <Ionicons name="checkmark" size={10} color={Colors.background} />
                </LinearGradient>
              </View>
            )}
          </View>

          <View style={styles.brandMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.brandName}>{business.brandName}</Text>
              {business.tier !== "free" && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <View style={styles.catRow}>
              <View style={[styles.catBadge, { borderColor: `${catColors[0]}40` }]}>
                <Text style={[styles.catText, { color: catColors[0] }]}>{business.category}</Text>
              </View>
              {business.location && (
                <View style={styles.locRow}>
                  <Ionicons name="location-outline" size={11} color={Colors.text.tertiary} />
                  <Text style={styles.locText}>{business.location}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <StatItem value={business._count.products} label="Products" />
          <View style={styles.statDivider} />
          <StatItem value={business._count.follows} label="Followers" />
          <View style={styles.statDivider} />
          <StatItem value={products.filter((p) => p.inStock).length} label="In Stock" />
        </View>

        {/* Bio */}
        {business.bio && (
          <Text style={styles.bio}>{business.bio}</Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={handleFollow}
            activeOpacity={0.85}
          >
            {!isFollowing ? (
              <LinearGradient colors={Colors.gradient.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            ) : null}
            <Ionicons
              name={isFollowing ? "checkmark" : "add"}
              size={16}
              color={isFollowing ? Colors.text.primary : Colors.background}
            />
            <Text style={[styles.followBtnText, isFollowing && { color: Colors.text.primary }]}>
              {isFollowing ? "Following" : "Follow Brand"}
            </Text>
          </TouchableOpacity>

          {business.website && (
            <TouchableOpacity
              style={styles.webBtn}
              onPress={() => openUrl(business.website!)}
              activeOpacity={0.85}
            >
              <Ionicons name="globe-outline" size={16} color={Colors.text.secondary} />
              <Text style={styles.webBtnText}>Visit Store</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>
              {products.length > 0 ? `${products.length} Products` : "Products"}
            </Text>
            {isOwner && (
              <TouchableOpacity
                style={styles.addProductBtn}
                onPress={() => router.push("/business/product-new")}
                activeOpacity={0.85}
              >
                <LinearGradient colors={Colors.gradient.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Ionicons name="add" size={16} color={Colors.background} />
                <Text style={styles.addProductText}>Add Product</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.productGrid}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showBrand={false}
                showTryOn
                onPress={() => {
                  if (product.shopLink) openUrl(product.shopLink);
                }}
              />
            ))}
          </View>
          {products.length === 0 && (
            <View style={styles.emptyProducts}>
              <Ionicons name="shirt-outline" size={36} color={Colors.text.tertiary} />
              <Text style={styles.emptyText}>
                {isOwner ? "You haven't added any products yet" : "This brand hasn't uploaded products yet"}
              </Text>
              {isOwner && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => router.push("/business/product-new")}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={Colors.gradient.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  <Ionicons name="add" size={16} color={Colors.background} />
                  <Text style={styles.emptyAddText}>Add Your First Product</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const StatItem = ({ value, label }: { value: number; label: string }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{formatCount(value)}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  nav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  editNavBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  editNavBtnText: { color: Colors.background, fontSize: 13, fontWeight: "700" },
  navTitle: { ...Typography.title3, color: Colors.text.primary, maxWidth: 180 },
  coverWrap: { height: 180, position: "relative" },
  cover: { width: "100%", height: "100%" },
  coverFade: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80 },
  brandHeader: { flexDirection: "row", alignItems: "flex-end", gap: 14, paddingHorizontal: Spacing.lg, marginTop: -30 },
  logoWrap: { position: "relative" },
  logo: {
    width: 80, height: 80, borderRadius: 20,
    borderWidth: 3, borderColor: Colors.background,
    overflow: "hidden", alignItems: "center", justifyContent: "center",
  },
  logoLetter: { color: Colors.background, fontSize: 32, fontWeight: "900" },
  verifiedBadge: { position: "absolute", bottom: 0, right: 0, borderRadius: Radius.full, overflow: "hidden", borderWidth: 2, borderColor: Colors.background },
  verifiedGrad: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  brandMeta: { flex: 1, paddingBottom: 8, gap: 5 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandName: { ...Typography.title2, color: Colors.text.primary },
  proBadge: {
    backgroundColor: Colors.primarySubtle, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.primary}40`,
  },
  proBadgeText: { color: Colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  catRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  catBadge: {
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, backgroundColor: "transparent",
  },
  catText: { fontSize: 11, fontWeight: "700" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locText: { ...Typography.caption, color: Colors.text.tertiary },
  stats: {
    flexDirection: "row", justifyContent: "space-around",
    paddingVertical: 20, marginHorizontal: Spacing.lg,
    borderBottomWidth: 0.5, borderTopWidth: 0.5, borderColor: Colors.border,
    marginTop: 16,
  },
  statItem: { alignItems: "center", gap: 4 },
  statValue: { ...Typography.title3, color: Colors.text.primary },
  statLabel: { ...Typography.caption, color: Colors.text.tertiary },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  bio: { ...Typography.body, color: Colors.text.secondary, lineHeight: 22, paddingHorizontal: Spacing.lg, paddingVertical: 16 },
  actions: { flexDirection: "row", gap: 10, paddingHorizontal: Spacing.lg, paddingBottom: 16 },
  followBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, height: 46, borderRadius: Radius.xl, overflow: "hidden",
  },
  followBtnActive: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  followBtnText: { ...Typography.labelLarge, color: Colors.background, fontWeight: "700" },
  webBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, height: 46, borderRadius: Radius.xl,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  webBtnText: { ...Typography.label, color: Colors.text.secondary },
  section: { paddingHorizontal: Spacing.lg },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { ...Typography.title3, color: Colors.text.primary },
  addProductBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8,
    overflow: "hidden",
  },
  addProductText: { color: Colors.background, fontSize: 13, fontWeight: "700" },
  productGrid: { gap: 12 },
  emptyProducts: { alignItems: "center", paddingVertical: 40, gap: 14 },
  emptyText: { ...Typography.body, color: Colors.text.tertiary, textAlign: "center" },
  emptyAddBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    borderRadius: Radius.xl, paddingHorizontal: 20, paddingVertical: 13,
    overflow: "hidden", marginTop: 4,
  },
  emptyAddText: { color: Colors.background, ...Typography.label, fontWeight: "700" },
  errorWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 40 },
  errorText: { ...Typography.body, color: Colors.text.tertiary, textAlign: "center" },
  retryBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.primary },
  retryText: { color: Colors.primary, ...Typography.label, fontWeight: "700" },
});
