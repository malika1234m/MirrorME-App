import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, FlatList, ScrollView, RefreshControl,
  TouchableOpacity, StyleSheet, Dimensions,
  TextInput, Animated, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Post, Business } from "@models/index";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { FASHION_STYLES } from "@constants/config";
import { postService } from "@services/postService";
import { businessService } from "@services/businessService";
import { BrandCard } from "@components/business/BrandCard";
import { formatCount } from "@utils/formatters";

/* ─── Layout constants ─────────────────────────────────────── */
const { width: W } = Dimensions.get("window");
const GAP = 2;
const BIG_W = Math.floor((W - GAP) * 0.62);
const BIG_H = Math.floor(BIG_W * 1.35);
const SM_W  = W - BIG_W - GAP;
const SM_H  = Math.floor((BIG_H - GAP) / 2);
const TRI_W = Math.floor((W - GAP * 2) / 3);
const TRI_H = Math.floor(TRI_W * 1.25);

/* ─── Style tab config ─────────────────────────────────────── */
const STYLE_ICONS: Record<string, string> = {
  All:              "flame",
  Streetwear:       "walk",
  Minimalist:       "remove-circle",
  Y2K:              "star",
  Cottagecore:      "leaf",
  "Dark Academia":  "book",
  "Business Casual":"briefcase",
  Athleisure:       "barbell",
  Boho:             "globe",
  Preppy:           "school",
  Grunge:           "musical-notes",
  "Old Money":      "diamond",
};

const STYLE_DESC: Partial<Record<string, string>> = {
  Streetwear:       "Urban edge meets comfort",
  Minimalist:       "Less is always more",
  Y2K:              "Turn of the millennium revival",
  Cottagecore:      "Soft, dreamy, countryside",
  "Dark Academia":  "Moody tones & literary vibes",
  "Business Casual":"Sharp but relaxed",
  Athleisure:       "Performance meets everyday",
  Boho:             "Free-spirited & eclectic",
  Preppy:           "Clean cuts, classic colours",
  Grunge:           "Raw, rebellious, real",
  "Old Money":      "Quiet luxury redefined",
};

/* ─── Grid block types ─────────────────────────────────────── */
type Block =
  | { type: "featured"; posts: [Post, Post, Post] }
  | { type: "featured-sm"; posts: [Post, Post] }   // only 2 posts remain
  | { type: "featured-solo"; posts: [Post] }         // only 1 post remains
  | { type: "trio"; posts: [Post, Post, Post] }
  | { type: "trio-sm"; posts: [Post, Post] }
  | { type: "trio-solo"; posts: [Post] };

function groupIntoBlocks(posts: Post[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  let idx = 0;
  while (i < posts.length) {
    const isFeatured = idx % 2 === 0;
    const remaining = posts.length - i;
    if (isFeatured) {
      if (remaining >= 3) blocks.push({ type: "featured", posts: [posts[i], posts[i + 1], posts[i + 2]] });
      else if (remaining === 2) blocks.push({ type: "featured-sm", posts: [posts[i], posts[i + 1]] });
      else blocks.push({ type: "featured-solo", posts: [posts[i]] });
      i += Math.min(3, remaining);
    } else {
      if (remaining >= 3) blocks.push({ type: "trio", posts: [posts[i], posts[i + 1], posts[i + 2]] });
      else if (remaining === 2) blocks.push({ type: "trio-sm", posts: [posts[i], posts[i + 1]] });
      else blocks.push({ type: "trio-solo", posts: [posts[i]] });
      i += Math.min(3, remaining);
    }
    idx++;
  }
  return blocks;
}

/* ─── Individual post cell ─────────────────────────────────── */
const PostCell = ({
  post, width, height, onPress,
}: {
  post: Post; width: number; height: number; onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.cell, { width, height }]}
    onPress={onPress}
    activeOpacity={0.88}
  >
    <Image source={{ uri: post.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
    <LinearGradient
      colors={["transparent", "rgba(0,0,0,0.6)"]}
      style={styles.cellGrad}
    >
      <View style={styles.cellMeta}>
        <Ionicons name="heart" size={10} color={Colors.accent} />
        <Text style={styles.cellLikes}>{formatCount(post._count.likes)}</Text>
        {post.avgRating ? (
          <View style={styles.cellRating}>
            <Text style={styles.cellRatingText}>★ {post.avgRating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>
    </LinearGradient>
    {post.outfitAnalysis && (
      <View style={styles.aiDot}>
        <Ionicons name="sparkles" size={8} color={Colors.primary} />
      </View>
    )}
  </TouchableOpacity>
);

/* ─── Block renderers ──────────────────────────────────────── */
type FeaturedBlockType = Extract<Block, { type: "featured" | "featured-sm" | "featured-solo" }>;

const FeaturedBlock = ({ block, onPress }: { block: FeaturedBlockType; onPress: (id: string) => void }) => {
  if (block.type === "featured-solo") {
    return <PostCell post={block.posts[0]} width={W} height={Math.floor(W * 0.9)} onPress={() => onPress(block.posts[0].id)} />;
  }
  if (block.type === "featured-sm") {
    return (
      <View style={[styles.row, { gap: GAP }]}>
        <PostCell post={block.posts[0]} width={BIG_W} height={BIG_H} onPress={() => onPress(block.posts[0].id)} />
        <PostCell post={block.posts[1]} width={SM_W} height={BIG_H} onPress={() => onPress(block.posts[1].id)} />
      </View>
    );
  }
  // full featured: 1 big left + 2 small right
  return (
    <View style={[styles.row, { gap: GAP }]}>
      <PostCell post={block.posts[0]} width={BIG_W} height={BIG_H} onPress={() => onPress(block.posts[0].id)} />
      <View style={{ gap: GAP }}>
        <PostCell post={block.posts[1]} width={SM_W} height={SM_H} onPress={() => onPress(block.posts[1].id)} />
        <PostCell post={block.posts[2]} width={SM_W} height={SM_H} onPress={() => onPress(block.posts[2].id)} />
      </View>
    </View>
  );
};

const TrioBlock = ({ block, onPress }: { block: Block; onPress: (id: string) => void }) => {
  if (block.type === "trio-solo") {
    return <PostCell post={block.posts[0]} width={W} height={TRI_H} onPress={() => onPress(block.posts[0].id)} />;
  }
  if (block.type === "trio-sm") {
    const hw = Math.floor((W - GAP) / 2);
    return (
      <View style={[styles.row, { gap: GAP }]}>
        {block.posts.map((p) => <PostCell key={p.id} post={p} width={hw} height={TRI_H} onPress={() => onPress(p.id)} />)}
      </View>
    );
  }
  // 3 equal
  return (
    <View style={[styles.row, { gap: GAP }]}>
      {block.posts.map((p) => <PostCell key={p.id} post={p} width={TRI_W} height={TRI_H} onPress={() => onPress(p.id)} />)}
    </View>
  );
};

/* ─── Search result row ────────────────────────────────────── */
const SearchResult = ({ post, onPress }: { post: Post; onPress: () => void }) => (
  <TouchableOpacity style={styles.searchResult} onPress={onPress} activeOpacity={0.82}>
    <Image source={{ uri: post.imageUrl }} style={styles.searchThumb} contentFit="cover" />
    <View style={styles.searchInfo}>
      <Text style={styles.searchUser} numberOfLines={1}>@{post.user.username}</Text>
      {post.outfitAnalysis?.fashionStyles[0] && (
        <View style={styles.searchStyleBadge}>
          <Text style={styles.searchStyleText}>{post.outfitAnalysis.fashionStyles[0]}</Text>
        </View>
      )}
      {post.caption ? (
        <Text style={styles.searchCaption} numberOfLines={2}>{post.caption}</Text>
      ) : null}
      <View style={styles.searchStats}>
        <Ionicons name="heart" size={12} color={Colors.accent} />
        <Text style={styles.searchStatText}>{formatCount(post._count.likes)}</Text>
        <Ionicons name="chatbubble-outline" size={12} color={Colors.text.tertiary} />
        <Text style={styles.searchStatText}>{formatCount(post._count.comments)}</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
  </TouchableOpacity>
);

/* ─── Main screen ──────────────────────────────────────────── */
export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"outfits" | "brands">("outfits");
  const [posts, setPosts] = useState<Post[]>([]);
  const [brands, setBrands] = useState<Business[]>([]);
  const [selected, setSelected] = useState("All");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchRef = useRef<TextInput>(null);

  const fetchPosts = useCallback(async (style: string) => {
    setIsLoading(true);
    try {
      const res = await postService.getExplore(1, style === "All" ? undefined : style);
      setPosts(res.data ?? []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBrands = useCallback(async (searchTerm?: string) => {
    setBrandsLoading(true);
    try {
      const res = await businessService.list({ search: searchTerm });
      setBrands(res.data ?? []);
    } finally {
      setBrandsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(selected); }, [selected]);
  useEffect(() => { if (activeTab === "brands") fetchBrands(); }, [activeTab]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === "outfits") await fetchPosts(selected);
    else await fetchBrands();
    setIsRefreshing(false);
  };

  const onFocusSearch = () => {
    setSearchFocused(true);
    Animated.spring(searchAnim, { toValue: 1, useNativeDriver: false, tension: 80, friction: 10 }).start();
  };

  const onBlurSearch = () => {
    if (!search) {
      setSearchFocused(false);
      Animated.spring(searchAnim, { toValue: 0, useNativeDriver: false, tension: 80, friction: 10 }).start();
    }
  };

  const clearSearch = () => {
    setSearch("");
    setSearchFocused(false);
    searchRef.current?.blur();
    Animated.spring(searchAnim, { toValue: 0, useNativeDriver: false, tension: 80, friction: 10 }).start();
  };

  const goToPost = (id: string) => router.push(`/post/${id}`);

  // Outfit search — client-side filter
  const filtered = search.trim()
    ? posts.filter((p) =>
        p.user.username.toLowerCase().includes(search.toLowerCase()) ||
        p.caption?.toLowerCase().includes(search.toLowerCase()) ||
        p.outfitAnalysis?.fashionStyles.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : posts;

  // Brand search — client-side filter against loaded brands
  const filteredBrands = search.trim()
    ? brands.filter((b) =>
        b.brandName.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase()) ||
        b.bio?.toLowerCase().includes(search.toLowerCase()) ||
        b.location?.toLowerCase().includes(search.toLowerCase())
      )
    : brands;

  const blocks = search.trim() ? [] : groupIntoBlocks(filtered);

  const cancelWidth = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 62] });
  const cancelOpacity = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const isSearching = !!search.trim();
  const styleDesc = STYLE_DESC[selected];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Explore</Text>
          {!searchFocused && (
            <View style={styles.postCount}>
              <Text style={styles.postCountText}>
                {activeTab === "outfits"
                  ? `${filtered.length} outfits`
                  : `${filteredBrands.length} brand${filteredBrands.length !== 1 ? "s" : ""}`}
              </Text>
            </View>
          )}
        </View>

        {/* Search row */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
            <Ionicons name="search-outline" size={17} color={searchFocused ? Colors.primary : Colors.text.tertiary} />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              onFocus={onFocusSearch}
              onBlur={onBlurSearch}
              placeholder={activeTab === "outfits" ? "Search styles, creators, tags…" : "Search brands, categories…"}
              placeholderTextColor={Colors.text.tertiary}
              returnKeyType="search"
              selectionColor={Colors.primary}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={17} color={Colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
          <Animated.View style={{ width: cancelWidth, opacity: cancelOpacity, overflow: "hidden" }}>
            <TouchableOpacity style={styles.cancelBtn} onPress={clearSearch}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* ── Tab switcher: Outfits / Brands ── */}
      <View style={styles.tabRow}>
        {(["outfits", "brands"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => { setActiveTab(tab); setSearch(""); }}
            activeOpacity={0.8}
          >
            {activeTab === tab && (
              <LinearGradient colors={Colors.gradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            )}
            <Ionicons
              name={tab === "outfits" ? "shirt-outline" : "storefront-outline"}
              size={14}
              color={activeTab === tab ? Colors.background : Colors.text.tertiary}
            />
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === "outfits" ? "Outfits" : "Brands"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Category chips (outfits only) ── */}
      {!isSearching && activeTab === "outfits" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}
          bounces={false}
        >
          {FASHION_STYLES.map((style) => {
            const active = selected === style;
            const icon = (STYLE_ICONS[style] ?? "ellipse") as React.ComponentProps<typeof Ionicons>["name"];
            return (
              <TouchableOpacity
                key={style}
                onPress={() => setSelected(style)}
                activeOpacity={0.75}
                style={[styles.chip, active && styles.chipActive]}
              >
                {active && (
                  <LinearGradient
                    colors={Colors.gradient.primary}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Ionicons
                  name={icon}
                  size={11}
                  color={active ? Colors.background : Colors.text.tertiary}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{style}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Style description strip ── */}
      {!isSearching && styleDesc && selected !== "All" && (
        <View style={styles.styleStrip}>
          <Ionicons name={(STYLE_ICONS[selected] ?? "ellipse") as React.ComponentProps<typeof Ionicons>["name"]} size={14} color={Colors.primary} />
          <Text style={styles.styleDesc}>{styleDesc}</Text>
          <Text style={styles.styleCount}>{filtered.length}</Text>
        </View>
      )}

      {/* ── Content ── */}
      {activeTab === "brands" ? (
        <FlatList
          style={{ flex: 1 }}
          data={filteredBrands}
          keyExtractor={(b) => b.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: Spacing.lg, gap: 14, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} progressBackgroundColor={Colors.card} />}
          ListHeaderComponent={
            <TouchableOpacity style={styles.registerBrandBtn} onPress={() => router.push("/business/register")} activeOpacity={0.88}>
              <LinearGradient colors={[Colors.primarySubtle, "transparent"]} style={StyleSheet.absoluteFill} />
              <Ionicons name="storefront-outline" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.registerBrandTitle}>List your brand</Text>
                <Text style={styles.registerBrandSub}>Get matched when users search for your style</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          }
          ListEmptyComponent={
            brandsLoading
              ? <GridSkeleton />
              : <EmptyState search={search.trim() ? search : undefined} tab="brands" />
          }
          renderItem={({ item }) => (
            <BrandCard business={item} onPress={() => router.push(`/business/${item.id}`)} />
          )}
        />
      ) : isLoading ? (
        <GridSkeleton />
      ) : isSearching ? (
        /* Search results */
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.searchList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<EmptyState search={search} />}
          renderItem={({ item }) => (
            <SearchResult post={item} onPress={() => goToPost(item.id)} />
          )}
        />
      ) : (
        /* Mixed grid */
        <FlatList
          style={{ flex: 1 }}
          data={blocks}
          keyExtractor={(_, i) => String(i)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              progressBackgroundColor={Colors.card}
            />
          }
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item: block }) => {
            if (block.type === "featured" || block.type === "featured-sm" || block.type === "featured-solo") {
              return <FeaturedBlock block={block} onPress={goToPost} />;
            }
            return <TrioBlock block={block} onPress={goToPost} />;
          }}
        />
      )}
    </View>
  );
}

/* ─── Skeleton loader ──────────────────────────────────────── */
const GridSkeleton = () => (
  <View style={{ flex: 1, gap: GAP }}>
    <View style={[styles.row, { gap: GAP }]}>
      <View style={[styles.skeletonCell, { width: BIG_W, height: BIG_H }]} />
      <View style={{ gap: GAP }}>
        <View style={[styles.skeletonCell, { width: SM_W, height: SM_H }]} />
        <View style={[styles.skeletonCell, { width: SM_W, height: SM_H }]} />
      </View>
    </View>
    <View style={[styles.row, { gap: GAP }]}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.skeletonCell, { width: TRI_W, height: TRI_H }]} />
      ))}
    </View>
    <View style={[styles.row, { gap: GAP }]}>
      <View style={[styles.skeletonCell, { width: BIG_W, height: BIG_H * 0.7 }]} />
      <View style={{ gap: GAP }}>
        <View style={[styles.skeletonCell, { width: SM_W, height: SM_H * 0.7 }]} />
        <View style={[styles.skeletonCell, { width: SM_W, height: SM_H * 0.7 }]} />
      </View>
    </View>
  </View>
);

/* ─── Empty state ──────────────────────────────────────────── */
const EmptyState = ({ search, tab = "outfits" }: { search?: string; tab?: "outfits" | "brands" }) => (
  <View style={styles.empty}>
    <LinearGradient
      colors={[Colors.primarySubtle, "transparent"]}
      style={styles.emptyIcon}
    >
      <Ionicons name={search ? "search-outline" : tab === "brands" ? "storefront-outline" : "shirt-outline"} size={36} color={Colors.primary} />
    </LinearGradient>
    <Text style={styles.emptyTitle}>{search ? "No results found" : tab === "brands" ? "No brands yet" : "No outfits yet"}</Text>
    <Text style={styles.emptySubtext}>
      {search ? `Nothing matched "${search}"` : tab === "brands" ? "Be the first to list your brand" : "Be the first to post in this style"}
    </Text>
  </View>
);

/* ─── Styles ───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  /* Tab switcher */
  tabRow: {
    flexDirection: "row", marginHorizontal: Spacing.lg, marginBottom: 10,
    backgroundColor: Colors.card, borderRadius: Radius.xl, padding: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 8, borderRadius: Radius.lg, overflow: "hidden",
  },
  tabBtnActive: {},
  tabBtnText: { ...Typography.label, color: Colors.text.tertiary },
  tabBtnTextActive: { color: Colors.background, fontWeight: "700" },

  /* Brand list */
  registerBrandBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: Spacing.lg, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: `${Colors.primary}30`,
    marginBottom: 8, overflow: "hidden",
  },
  registerBrandTitle: { ...Typography.labelLarge, color: Colors.primary },
  registerBrandSub: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },

  /* Header */
  header: { paddingHorizontal: Spacing.lg, paddingBottom: 12, gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 6 },
  title: { ...Typography.title2, color: Colors.text.primary },
  postCount: {
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  postCountText: { ...Typography.caption, color: Colors.text.tertiary },

  /* Search */
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchBar: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, height: 46,
  },
  searchBarFocused: { borderColor: Colors.primary },
  searchInput: { flex: 1, color: Colors.text.primary, ...Typography.body, paddingVertical: 0 },
  cancelBtn: { alignItems: "center", justifyContent: "center", paddingLeft: 4 },
  cancelText: { color: Colors.primary, ...Typography.label },

  /* Chips */
  chipsScroll: { flexGrow: 0 },
  chips: { paddingHorizontal: Spacing.lg, paddingVertical: 8, gap: 6 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  chipActive: { borderColor: "transparent" },
  chipText: { color: Colors.text.secondary, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: Colors.background, fontWeight: "700" },

  /* Style strip */
  styleStrip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: Spacing.lg, paddingBottom: 10,
  },
  styleDesc: { flex: 1, ...Typography.caption, color: Colors.text.tertiary, fontStyle: "italic" },
  styleCount: {
    ...Typography.caption, color: Colors.primary,
    backgroundColor: Colors.primarySubtle, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: Radius.full,
  },

  /* Grid */
  grid: { gap: 0, paddingBottom: 100 },
  row: { flexDirection: "row" },
  cell: { overflow: "hidden", backgroundColor: Colors.card },
  cellGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 40, justifyContent: "flex-end", padding: 7 },
  cellMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cellLikes: { color: Colors.white, fontSize: 10, fontWeight: "600" },
  cellRating: {
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1, marginLeft: 4,
  },
  cellRatingText: { color: Colors.warning, fontSize: 9, fontWeight: "700" },
  aiDot: {
    position: "absolute", top: 6, right: 6,
    backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 6, padding: 4,
    borderWidth: 1, borderColor: `${Colors.primary}50`,
  },

  /* Skeleton */
  skeletonCell: { backgroundColor: Colors.cardElevated, opacity: 0.6 },

  /* Search results */
  searchList: { paddingBottom: 100 },
  separator: { height: 0.5, backgroundColor: Colors.border, marginLeft: 76 },
  searchResult: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
  },
  searchThumb: { width: 60, height: 72, borderRadius: Radius.md, backgroundColor: Colors.card },
  searchInfo: { flex: 1, gap: 4 },
  searchUser: { ...Typography.labelLarge, color: Colors.text.primary },
  searchStyleBadge: {
    alignSelf: "flex-start", backgroundColor: Colors.primarySubtle,
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.primary}30`,
  },
  searchStyleText: { color: Colors.primary, fontSize: 11, fontWeight: "600" },
  searchCaption: { ...Typography.caption, color: Colors.text.tertiary, lineHeight: 16 },
  searchStats: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  searchStatText: { ...Typography.caption, color: Colors.text.tertiary },

  /* Empty */
  empty: { alignItems: "center", paddingTop: 70, paddingHorizontal: 40, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { ...Typography.title3, color: Colors.text.secondary },
  emptySubtext: { ...Typography.body, color: Colors.text.tertiary, textAlign: "center" },
});
