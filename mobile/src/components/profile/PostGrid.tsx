import React from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions, Text } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Post } from "@types/index";
import { Colors } from "@constants/colors";
import { formatCount } from "@utils/formatters";

const { width: W } = Dimensions.get("window");
const GAP = 1.5;
const CELL = (W - GAP * 2) / 3;

interface Props { posts: Post[] }

export const PostGrid: React.FC<Props> = ({ posts }) => {
  const router = useRouter();

  return (
    <View style={styles.grid}>
      {posts.map((post, index) => {
        const isFeatured = index % 7 === 0;
        const size = isFeatured ? CELL * 2 + GAP : CELL;
        const height = isFeatured ? CELL * 2 + GAP : CELL * 1.3;

        return (
          <TouchableOpacity
            key={post.id}
            onPress={() => router.push(`/post/${post.id}`)}
            activeOpacity={0.88}
            style={[styles.cell, { width: size, height }]}
          >
            <Image
              source={{ uri: post.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
            <LinearGradient
              colors={Colors.gradient.dark}
              style={styles.overlay}
            />

            {/* Stats on hover area */}
            <View style={styles.statsRow}>
              <Ionicons name="heart" size={12} color={Colors.white} />
              <Text style={styles.statText}>{formatCount(post._count.likes)}</Text>
            </View>

            {/* AI badge */}
            {post.outfitAnalysis && (
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={9} color={Colors.primary} />
              </View>
            )}

            {/* Rating */}
            {post.avgRating && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>★{post.avgRating.toFixed(1)}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  cell: { backgroundColor: Colors.card, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  statsRow: {
    position: "absolute",
    bottom: 6,
    left: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statText: { color: Colors.white, fontSize: 10, fontWeight: "700" },
  aiBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 6,
    padding: 4,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  ratingBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingText: { color: Colors.warning, fontSize: 9, fontWeight: "700" },
});
