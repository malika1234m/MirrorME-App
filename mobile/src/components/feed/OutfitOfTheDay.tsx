import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { aiService } from "@services/aiService";
import { Post } from "@types/index";
import { Avatar } from "@components/ui/Avatar";
import { formatCount } from "@utils/formatters";

const { width: W } = Dimensions.get("window");

export const OutfitOfTheDay: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const router = useRouter();

  useEffect(() => {
    aiService.getTrending()
      .then((r) => { if (r.data?.[0]) setPost(r.data[0]); })
      .catch(() => {});
  }, []);

  if (!post) return null;

  return (
    <View style={styles.container}>
      {/* Section label */}
      <View style={styles.sectionHeader}>
        <LinearGradient colors={["#FFD700", "#FF8C00"]} style={styles.ootdBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="trophy" size={11} color="#000" />
          <Text style={styles.ootdBadgeText}>OUTFIT OF THE DAY</Text>
        </LinearGradient>
        <Text style={styles.sectionSubtitle}>Most loved look right now</Text>
      </View>

      {/* Hero card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/post/${post.id}`)}
        activeOpacity={0.92}
      >
        <Image source={{ uri: post.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />

        {/* Gradient overlays */}
        <LinearGradient colors={["rgba(0,0,0,0.5)", "transparent"]} style={styles.topGrad} />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.9)"]} style={styles.botGrad} />

        {/* Top: Trophy + rank */}
        <View style={styles.topRow}>
          <View style={styles.crownBadge}>
            <Ionicons name="trophy" size={16} color="#FFD700" />
          </View>
          {post.avgRating && (
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{post.avgRating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Bottom: User + stats + style */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => router.push(`/profile/${post.user.id}`)}
            activeOpacity={0.85}
          >
            <Avatar uri={post.user.avatarUrl} name={post.user.username} size={40} hasStory />
            <View>
              <Text style={styles.username}>@{post.user.username}</Text>
              {post.outfitAnalysis?.fashionStyles[0] && (
                <View style={styles.styleTag}>
                  <Ionicons name="sparkles" size={10} color={Colors.primary} />
                  <Text style={styles.styleTagText}>{post.outfitAnalysis.fashionStyles[0]}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={14} color={Colors.accent} />
              <Text style={styles.statText}>{formatCount(post._count.likes)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star" size={13} color="#FFD700" />
              <Text style={styles.statText}>{formatCount(post._count.ratings)}</Text>
            </View>
          </View>
        </View>

        {/* AI analysis teaser */}
        {post.outfitAnalysis?.overallStyle && (
          <View style={styles.analysisBanner}>
            <Ionicons name="sparkles" size={12} color={Colors.primary} />
            <Text style={styles.analysisText} numberOfLines={1}>{post.outfitAnalysis.overallStyle}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const CARD_H = W * 0.78;

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
  },
  ootdBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
  },
  ootdBadgeText: { fontSize: 10, fontWeight: "800", color: "#000", letterSpacing: 1 },
  sectionSubtitle: { ...Typography.caption, color: Colors.text.tertiary },
  card: { height: CARD_H, backgroundColor: Colors.card, overflow: "hidden" },
  topGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
  botGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 220 },
  topRow: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: Spacing.lg,
  },
  crownBadge: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,215,0,0.4)",
  },
  ratingPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.7)", borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(255,215,0,0.3)",
  },
  ratingText: { color: "#FFD700", ...Typography.labelLarge, fontWeight: "800" },
  bottomRow: {
    position: "absolute", bottom: 52, left: 0, right: 0,
    flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  username: { ...Typography.labelLarge, color: Colors.white },
  styleTag: {
    flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.primary}40`,
    alignSelf: "flex-start",
  },
  styleTagText: { color: Colors.primary, fontSize: 10, fontWeight: "700" },
  stats: { flexDirection: "row", gap: 12 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statText: { color: Colors.white, ...Typography.label, fontWeight: "700" },
  analysisBanner: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(0,0,0,0.75)", paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: `${Colors.primary}20`,
  },
  analysisText: { color: Colors.text.secondary, ...Typography.caption, flex: 1, fontStyle: "italic" },
});
