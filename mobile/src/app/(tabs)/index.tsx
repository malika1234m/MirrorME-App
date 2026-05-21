import React from "react";
import {
  FlatList, RefreshControl, View, Text,
  TouchableOpacity, StyleSheet, StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useFeed } from "@hooks/useFeed";
import { PostCard } from "@components/feed/PostCard";
import { TrendingSection } from "@components/feed/TrendingSection";
import { StoriesBar } from "@components/feed/StoriesBar";
import { OutfitOfTheDay } from "@components/feed/OutfitOfTheDay";
import { PostCardSkeleton } from "@components/ui/SkeletonCard";
import { Colors, Typography, Spacing } from "@constants/colors";

/* ─── Sticky top bar ───────────────────────────────────────────── */
const TopBar = ({ topInset }: { topInset: number }) => {
  const router = useRouter();
  return (
    <View style={[styles.header, { paddingTop: topInset + 10 }]}>
      <View style={styles.logoRow}>
        <LinearGradient
          colors={Colors.gradient.accent}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.logoBadge}
        >
          <Ionicons name="shirt" size={16} color={Colors.background} />
        </LinearGradient>
        <Text style={styles.logoText}>MirrorME</Text>
      </View>
      <View style={styles.headerActions}>
        {/* Find This Look shortcut */}
        <TouchableOpacity
          style={[styles.iconBtn, styles.findBtn]}
          onPress={() => router.push("/match")}
        >
          <Ionicons name="camera-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications-outline" size={22} color={Colors.text.primary} />
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ─── Feed list header (stories + trending + label) ──────────────── */
const ListHeader = ({ topInset }: { topInset: number }) => (
  <View>
    <TopBar topInset={topInset} />
    <View style={styles.divider} />
    <OutfitOfTheDay />
    <View style={styles.divider} />
    <StoriesBar />
    <View style={styles.divider} />
    <TrendingSection />
    <View style={styles.feedLabel}>
      <Ionicons name="layers-outline" size={15} color={Colors.text.tertiary} />
      <Text style={styles.feedLabelText}>Your Feed</Text>
    </View>
  </View>
);

/* ─── Home screen ────────────────────────────────────────────────── */
export default function HomeScreen() {
  const { posts, isLoading, isRefreshing, refreshFeed, loadMore } = useFeed();
  const insets = useSafeAreaInsets();

  if (isLoading && posts.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <TopBar topInset={insets.top} />
        <View style={styles.divider} />
        <View style={{ flex: 1 }}>
          <PostCardSkeleton />
          <PostCardSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        extraData={posts}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={<ListHeader topInset={insets.top} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshFeed}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            progressBackgroundColor={Colors.card}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<EmptyFeed />}
        ListFooterComponent={
          isLoading && posts.length > 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <PostCardSkeleton />
            </View>
          ) : null
        }
      />
    </View>
  );
}

/* ─── Empty state ────────────────────────────────────────────────── */
const EmptyFeed = () => (
  <View style={styles.empty}>
    <View style={styles.emptyIconBox}>
      <Ionicons name="shirt-outline" size={40} color={Colors.primary} />
    </View>
    <Text style={styles.emptyTitle}>Your feed is empty</Text>
    <Text style={styles.emptySubtext}>
      Follow fashion creators to see their latest looks here
    </Text>
    <TouchableOpacity style={styles.exploreCta} onPress={() => router.push("/(tabs)/explore")}>
      <Ionicons name="search-outline" size={16} color={Colors.primary} />
      <Text style={styles.exploreCtaText}>Discover Creators</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: 10,
    backgroundColor: Colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBadge: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { color: Colors.primary, fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  headerActions: { flexDirection: "row", gap: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  findBtn: { backgroundColor: Colors.primarySubtle, borderRadius: 12, borderWidth: 1, borderColor: `${Colors.primary}40` },
  notifDot: {
    position: "absolute", top: 8, right: 8,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: Colors.accent, borderWidth: 1.5, borderColor: Colors.background,
  },
  divider: { height: 0.5, backgroundColor: Colors.border },
  feedLabel: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 4,
  },
  feedLabelText: {
    ...Typography.caption, color: Colors.text.tertiary,
    textTransform: "uppercase", letterSpacing: 1,
  },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40, gap: 14 },
  emptyIconBox: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { ...Typography.title3, color: Colors.text.primary, textAlign: "center" },
  emptySubtext: { ...Typography.body, color: Colors.text.secondary, textAlign: "center", lineHeight: 22 },
  exploreCta: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.primary, marginTop: 4,
  },
  exploreCtaText: { color: Colors.primary, ...Typography.label },
});
