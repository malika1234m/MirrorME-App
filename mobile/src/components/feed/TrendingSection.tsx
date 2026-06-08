import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  Image, Dimensions, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Post } from "@models/index";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { aiService } from "@services/aiService";
import { formatCount } from "@utils/formatters";

const { width: W } = Dimensions.get("window");
const CARD_W = W * 0.42;

export const TrendingSection: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const router = useRouter();

  useEffect(() => {
    aiService.getTrending().then((res) => setPosts(res.data || [])).catch(() => {});
  }, []);

  if (posts.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <LinearGradient colors={Colors.gradient.accent} style={styles.fireIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="flame" size={12} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.title}>Trending Now</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/explore")}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 10 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push(`/post/${item.id}`)}
            style={styles.card}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.image} />

            {/* Rank badge */}
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>

            <LinearGradient colors={Colors.gradient.dark} style={styles.cardGradient}>
              <Text style={styles.cardUser} numberOfLines={1}>@{item.user.username}</Text>
              <View style={styles.cardStats}>
                <Ionicons name="heart" size={11} color={Colors.accent} />
                <Text style={styles.cardCount}>{formatCount(item._count.likes)}</Text>
                {item.outfitAnalysis?.fashionStyles[0] && (
                  <View style={styles.cardStyleBadge}>
                    <Text style={styles.cardStyleText}>{item.outfitAnalysis.fashionStyles[0]}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: 12,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fireIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...Typography.title3, color: Colors.text.primary },
  seeAll: { color: Colors.primary, ...Typography.label },
  card: {
    width: CARD_W,
    height: CARD_W * 1.35,
    borderRadius: Radius.xl,
    overflow: "hidden",
    backgroundColor: Colors.card,
  },
  image: { width: "100%", height: "100%", position: "absolute" },
  rankBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  rankText: { color: Colors.white, ...Typography.caption, fontWeight: "800" },
  cardGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45%",
    justifyContent: "flex-end",
    padding: 10,
    gap: 4,
  },
  cardUser: { color: Colors.white, ...Typography.label },
  cardStats: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardCount: { color: Colors.text.secondary, ...Typography.caption },
  cardStyleBadge: {
    marginLeft: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardStyleText: { color: "rgba(255,255,255,0.8)", fontSize: 9, fontWeight: "600" },
});
