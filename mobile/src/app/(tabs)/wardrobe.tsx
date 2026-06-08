import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, TextInput, FlatList,
  RefreshControl, Animated,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { useWardrobeStore } from "@store/wardrobeStore";
import { wardrobeService } from "@services/wardrobeService";
import { Product } from "@models/index";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - Spacing.lg * 2 - Spacing.md) / 2;

// Proper category → clothingType mapping for the API
const CATEGORIES = [
  { label: "All",       value: undefined },
  { label: "Tops",      value: "top" },
  { label: "Bottoms",   value: "bottom" },
  { label: "Dresses",   value: "dress" },
  { label: "Outerwear", value: "outer" },
  { label: "Shoes",     value: "shoe" },
];

/* ─────────────────────────────────────────────
   Toast component
───────────────────────────────────────────── */
function useToast() {
  const opacity = useRef(new Animated.Value(0)).current;
  const [msg, setMsg] = useState("");

  const show = (text: string) => {
    setMsg(text);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const node = msg ? (
    <Animated.View style={[toastStyles.wrap, { opacity }]} pointerEvents="none">
      <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
      <Text style={toastStyles.text}>{msg}</Text>
    </Animated.View>
  ) : null;

  return { show, node };
}

const toastStyles = StyleSheet.create({
  wrap: {
    position: "absolute", bottom: 110, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: Colors.cardElevated, borderRadius: Radius.full,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8, zIndex: 99,
  },
  text: { color: Colors.text.primary, ...Typography.label },
});

/* ─────────────────────────────────────────────
   Skeleton card
   useNativeDriver MUST be false — backgroundColor
   is not supported by the native animation driver.
───────────────────────────────────────────── */
function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

const SkeletonCard = () => {
  const anim = useShimmer();
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.surface, Colors.card] });
  return (
    <View style={[skStyles.card, { width: CARD_W }]}>
      <Animated.View style={[skStyles.img, { backgroundColor: bg }]} />
      <View style={skStyles.info}>
        <Animated.View style={[skStyles.line, { width: "50%", backgroundColor: bg }]} />
        <Animated.View style={[skStyles.line, { width: "80%", backgroundColor: bg }]} />
        <Animated.View style={[skStyles.btn, { backgroundColor: bg }]} />
      </View>
    </View>
  );
};
const skStyles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  img: { height: CARD_W * 1.2 },
  info: { padding: Spacing.md, gap: 8 },
  line: { height: 10, borderRadius: 5 },
  btn: { height: 32, borderRadius: Radius.lg, marginTop: 2 },
});

/* ─────────────────────────────────────────────
   Main screen
───────────────────────────────────────────── */
export default function WardrobeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, load: loadWardrobe, toggle, isInWardrobe, isLoading: wardrobeLoading } = useWardrobeStore();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"browse" | "mine">("browse");
  const [selectedCat, setSelectedCat] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogHasMore, setCatalogHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest values accessible in callbacks without stale closures
  const searchRef = useRef(search);
  const catRef = useRef(selectedCat);
  searchRef.current = search;
  catRef.current = selectedCat;

  const fetchCatalog = useCallback(async (q?: string, cat?: string, page = 1) => {
    setCatalogLoading(true);
    try {
      const res = await wardrobeService.getCatalog({ category: cat, search: q || undefined, page });
      if (res.data) {
        setCatalog((prev) => page === 1 ? res.data! : [...prev, ...res.data!]);
        setCatalogHasMore((res.data?.length ?? 0) === 20);
        setCatalogPage(page);
      }
    } catch {
      if (page === 1) setCatalog([]);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadWardrobe();
    fetchCatalog();
  }, []);

  // Reset and reload when category changes
  useEffect(() => {
    setCatalog([]);
    setCatalogPage(1);
    setCatalogHasMore(true);
    fetchCatalog(searchRef.current, selectedCat, 1);
  }, [selectedCat]);

  // Debounce search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchCatalog(search, catRef.current);
    }, 380);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadWardrobe(), fetchCatalog(searchRef.current, catRef.current)]);
    setRefreshing(false);
  }, []);

  const handleToggle = async (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nowIn = await toggle(product.id);
    if (nowIn) {
      loadWardrobe();
      toast.show("Added to wardrobe");
    } else {
      toast.show("Removed from wardrobe");
    }
  };

  const handleTryOn = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/wardrobe/try-on" as any,
      params: {
        productId: product.id,
        imageUrl: product.imageUrl,
        title: product.title,
        clothingType: product.clothingTypes[0] || "top",
        sizes: JSON.stringify(product.sizes),
      },
    });
  };

  const openMirror = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (items.length === 0) {
      setActiveTab("browse");
      toast.show("Save items first, then open Mirror");
      return;
    }
    handleTryOn(items[0]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Digital Wardrobe</Text>
          <Text style={styles.subtitle}>Try clothes on before you buy</Text>
        </View>
        <TouchableOpacity style={styles.mirrorBtn} onPress={openMirror} activeOpacity={0.85}>
          <LinearGradient
            colors={Colors.gradient.primary}
            style={styles.mirrorBtnInner}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name="camera" size={17} color={Colors.background} />
            <Text style={styles.mirrorBtnText}>Open Mirror</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Tab selector ── */}
      <View style={styles.tabRow}>
        {(["browse", "mine"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => { setActiveTab(tab); Haptics.selectionAsync(); }}
            activeOpacity={0.8}
          >
            {tab === "mine" && items.length > 0 && (
              <View style={[styles.badge, activeTab === "mine" && styles.badgeDark]}>
                <Text style={[styles.badgeText, activeTab === "mine" && styles.badgeTextDark]}>
                  {items.length}
                </Text>
              </View>
            )}
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === "browse" ? "Browse Catalog" : "My Wardrobe"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Browse filters ── */}
      {activeTab === "browse" && (
        <>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color={Colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search styles, brands…"
              placeholderTextColor={Colors.text.tertiary}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={Colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={styles.catContent}
          >
            {CATEGORIES.map(({ label, value }) => {
              const active = selectedCat === value;
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.catChip, active && styles.catChipActive]}
                  onPress={() => { setSelectedCat(value); Haptics.selectionAsync(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* ── Content ── */}
      {activeTab === "mine" && items.length === 0 && !wardrobeLoading ? (
        <View style={{ flex: 1, paddingBottom: insets.bottom + 80 }}>
          <EmptyWardrobe onBrowse={() => setActiveTab("browse")} />
        </View>
      ) : (
        <FlatList
          key={activeTab}
          data={activeTab === "mine" ? items : catalog}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          onEndReached={() => {
            if (activeTab === "browse" && catalogHasMore && !catalogLoading) {
              fetchCatalog(searchRef.current, catRef.current, catalogPage + 1);
            }
          }}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            activeTab === "browse" && !catalogLoading && catalog.length > 0 ? (
              <View style={styles.howItWorks}>
                <Ionicons name="sparkles" size={14} color={Colors.primary} />
                <Text style={styles.howText}>
                  Tap <Text style={{ color: Colors.primary, fontWeight: "700" }}>shirt icon</Text> to save · tap{" "}
                  <Text style={{ color: Colors.primary, fontWeight: "700" }}>Try On</Text> to see it on you
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            catalogLoading || wardrobeLoading ? (
              <View style={styles.skeletonGrid}>
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </View>
            ) : (
              <EmptySearch />
            )
          }
          renderItem={({ item }) => (
            <WardrobeCard
              product={item}
              inWardrobe={isInWardrobe(item.id)}
              onToggle={() => handleToggle(item)}
              onTryOn={() => handleTryOn(item)}
            />
          )}
        />
      )}

      {/* Toast */}
      {toast.node}
    </View>
  );
}

/* ─────────────────────────────────────────────
   Wardrobe product card
───────────────────────────────────────────── */
const WardrobeCard = ({
  product, inWardrobe, onToggle, onTryOn,
}: {
  product: Product; inWardrobe: boolean; onToggle: () => void; onTryOn: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggleWithAnim = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    onToggle();
  };

  return (
    <View style={cardStyles.card}>
      {/* Image */}
      <View style={cardStyles.imgWrap}>
        <Image source={{ uri: product.imageUrl }} style={cardStyles.img} contentFit="cover" />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.72)"]} style={cardStyles.grad} />

        {/* Wardrobe save button */}
        <Animated.View style={[cardStyles.saveWrap, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[cardStyles.saveBtn, inWardrobe && cardStyles.saveBtnActive]}
            onPress={handleToggleWithAnim}
            activeOpacity={0.8}
          >
            <Ionicons
              name={inWardrobe ? "shirt" : "shirt-outline"}
              size={15}
              color={inWardrobe ? Colors.background : Colors.white}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Sizes strip */}
        {product.sizes.length > 0 && (
          <View style={cardStyles.sizesRow}>
            {product.sizes.slice(0, 4).map((s) => (
              <View key={s} style={cardStyles.sizeChip}>
                <Text style={cardStyles.sizeText}>{s}</Text>
              </View>
            ))}
            {product.sizes.length > 4 && (
              <View style={cardStyles.sizeChip}>
                <Text style={cardStyles.sizeText}>+{product.sizes.length - 4}</Text>
              </View>
            )}
          </View>
        )}

        {/* Out of stock */}
        {!product.inStock && (
          <View style={cardStyles.oosBadge}>
            <Text style={cardStyles.oosText}>Out of stock</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={cardStyles.info}>
        <Text style={cardStyles.brand} numberOfLines={1}>{product.business.brandName}</Text>
        <Text style={cardStyles.title} numberOfLines={2}>{product.title}</Text>
        {product.price != null && (
          <Text style={cardStyles.price}>
            {product.currency === "USD" ? "$" : product.currency}{product.price.toFixed(0)}
          </Text>
        )}

        {/* Try On */}
        <TouchableOpacity style={cardStyles.tryBtn} onPress={onTryOn} activeOpacity={0.85}>
          <LinearGradient
            colors={Colors.gradient.primary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={cardStyles.tryBtnInner}
          >
            <Ionicons name="camera-outline" size={13} color={Colors.background} />
            <Text style={cardStyles.tryBtnText}>Try On</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ─────────────────────────────────────────────
   Empty states
───────────────────────────────────────────── */
const EmptyWardrobe = ({ onBrowse }: { onBrowse: () => void }) => (
  <View style={emptyStyles.wrap}>
    <LinearGradient
      colors={[Colors.primarySubtle, "transparent"]}
      style={emptyStyles.iconBg}
    >
      <Ionicons name="shirt-outline" size={42} color={Colors.primary} />
    </LinearGradient>
    <Text style={emptyStyles.title}>Your wardrobe is empty</Text>
    <Text style={emptyStyles.sub}>
      Browse the catalog and tap the{"\n"}
      <Text style={{ color: Colors.primary, fontWeight: "700" }}>shirt icon</Text> on any item to save it here for try-on.
    </Text>
    <TouchableOpacity style={emptyStyles.btn} onPress={onBrowse} activeOpacity={0.85}>
      <LinearGradient
        colors={Colors.gradient.primary}
        style={emptyStyles.btnInner}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        <Ionicons name="grid-outline" size={16} color={Colors.background} />
        <Text style={emptyStyles.btnText}>Browse Catalog</Text>
      </LinearGradient>
    </TouchableOpacity>

    {/* Steps */}
    <View style={emptyStyles.steps}>
      {[
        { icon: "shirt-outline", title: "Save items", sub: "Tap the shirt icon on any product" },
        { icon: "camera-outline", title: "Open Virtual Mirror", sub: "Tap the Mirror button above" },
        { icon: "sparkles", title: "Try it on live", sub: "AI tracks your body in real time" },
      ].map((s, i) => (
        <View key={i} style={emptyStyles.step}>
          <View style={emptyStyles.stepNum}>
            <Text style={emptyStyles.stepNumText}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={emptyStyles.stepTitle}>{s.title}</Text>
            <Text style={emptyStyles.stepSub}>{s.sub}</Text>
          </View>
          <Ionicons name={s.icon as any} size={18} color={Colors.text.tertiary} />
        </View>
      ))}
    </View>
  </View>
);

const EmptySearch = () => (
  <View style={emptyStyles.wrap}>
    <Ionicons name="search-outline" size={38} color={Colors.text.tertiary} />
    <Text style={emptyStyles.title}>No items found</Text>
    <Text style={emptyStyles.sub}>Try a different search term or category.</Text>
  </View>
);

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingTop: 8, paddingBottom: 14,
  },
  title: { ...Typography.title2, color: Colors.text.primary },
  subtitle: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 3 },

  mirrorBtn: { borderRadius: Radius.xl, overflow: "hidden" },
  mirrorBtnInner: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  mirrorBtnText: { color: Colors.background, ...Typography.label, fontWeight: "800" },

  tabRow: {
    flexDirection: "row", marginHorizontal: Spacing.lg, marginBottom: 14,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 3,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 9, borderRadius: Radius.md, gap: 6,
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabBtnText: { ...Typography.label, color: Colors.text.secondary },
  tabBtnTextActive: { color: Colors.background, fontWeight: "800" },
  badge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeDark: { backgroundColor: Colors.background },
  badgeText: { color: Colors.background, fontSize: 10, fontWeight: "800" },
  badgeTextDark: { color: Colors.primary },

  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: Spacing.lg, marginBottom: 10,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, height: 44,
  },
  searchInput: { flex: 1, color: Colors.text.primary, ...Typography.body },

  catScroll: { maxHeight: 40, marginBottom: 12 },
  catContent: { paddingHorizontal: Spacing.lg, gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { ...Typography.label, color: Colors.text.secondary },
  catChipTextActive: { color: Colors.background, fontWeight: "800" },

  howItWorks: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.primarySubtle, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: 12,
    borderWidth: 1, borderColor: `${Colors.primary}20`,
  },
  howText: { ...Typography.bodySmall, color: Colors.text.secondary, flex: 1, lineHeight: 17 },

  grid: { paddingHorizontal: Spacing.lg, paddingTop: 2 },
  row: { gap: Spacing.md, marginBottom: Spacing.md },

  skeletonGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: Spacing.md, paddingTop: 4,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    width: CARD_W, backgroundColor: Colors.card,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  imgWrap: { height: CARD_W * 1.25, position: "relative" },
  img: { width: "100%", height: "100%" },
  grad: { position: "absolute", bottom: 0, left: 0, right: 0, height: "55%" },

  saveWrap: { position: "absolute", top: 8, right: 8 },
  saveBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  saveBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  sizesRow: { position: "absolute", bottom: 7, left: 7, flexDirection: "row", gap: 3 },
  sizeChip: {
    backgroundColor: "rgba(0,0,0,0.62)", borderRadius: 5,
    paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.18)",
  },
  sizeText: { color: Colors.white, fontSize: 9, fontWeight: "600" },

  oosBadge: {
    position: "absolute", top: 8, left: 8,
    backgroundColor: "rgba(0,0,0,0.72)", borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  oosText: { color: Colors.error, fontSize: 9, fontWeight: "700" },

  info: { padding: Spacing.md, gap: 4 },
  brand: { ...Typography.caption, color: Colors.text.tertiary },
  title: { ...Typography.label, color: Colors.text.primary, lineHeight: 18 },
  price: { ...Typography.title3, color: Colors.primary, marginTop: 2 },

  tryBtn: { borderRadius: Radius.lg, overflow: "hidden", marginTop: 6 },
  tryBtnInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 9,
  },
  tryBtnText: { color: Colors.background, fontSize: 12, fontWeight: "800" },
});

const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: "center", paddingHorizontal: Spacing.xl,
    paddingTop: 48, paddingBottom: 32, gap: 12,
  },
  iconBg: {
    width: 90, height: 90, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: `${Colors.primary}25`,
  },
  title: { ...Typography.title3, color: Colors.text.primary, textAlign: "center" },
  sub: { ...Typography.body, color: Colors.text.tertiary, textAlign: "center", lineHeight: 22 },
  btn: { borderRadius: Radius.xl, overflow: "hidden", marginTop: 4 },
  btnInner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  btnText: { color: Colors.background, ...Typography.labelLarge, fontWeight: "800" },

  steps: { width: "100%", gap: 0, marginTop: 8 },
  step: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  stepNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primarySubtle, borderWidth: 1, borderColor: `${Colors.primary}35`,
    alignItems: "center", justifyContent: "center",
  },
  stepNumText: { color: Colors.primary, fontSize: 11, fontWeight: "800" },
  stepTitle: { ...Typography.label, color: Colors.text.primary },
  stepSub: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
});
