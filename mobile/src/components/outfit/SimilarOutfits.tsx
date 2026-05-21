import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Post } from "@types/index";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { formatCount } from "@utils/formatters";

interface Props { posts: Post[] }

export const SimilarOutfits: React.FC<Props> = ({ posts }) => {
  const router = useRouter();
  if (posts.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <LinearGradient colors={Colors.gradient.accent} style={styles.titleIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="color-palette" size={12} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.title}>Similar Outfits</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/explore")}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 2, gap: 10, paddingBottom: 4 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/post/${item.id}`)}
            activeOpacity={0.88}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />
            <LinearGradient colors={Colors.gradient.dark} style={styles.cardGrad} />

            <View style={styles.cardBottom}>
              <Text style={styles.cardUser} numberOfLines={1}>@{item.user.username}</Text>
              <View style={styles.cardStats}>
                <Ionicons name="heart" size={10} color={Colors.accent} />
                <Text style={styles.cardCount}>{formatCount(item._count.likes)}</Text>
              </View>
            </View>

            {item.outfitAnalysis?.fashionStyles[0] && (
              <View style={styles.styleBadge}>
                <Text style={styles.styleBadgeText}>{item.outfitAnalysis.fashionStyles[0]}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleIcon: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  title: { ...Typography.title3, color: Colors.text.primary },
  seeAll: { color: Colors.primary, ...Typography.label },
  card: { width: 148, height: 200, borderRadius: Radius.xl, overflow: "hidden", backgroundColor: Colors.card },
  image: { width: "100%", height: "100%" },
  cardGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: "45%" },
  cardBottom: { position: "absolute", bottom: 10, left: 10, right: 10 },
  cardUser: { color: Colors.white, ...Typography.label, marginBottom: 3 },
  cardStats: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardCount: { color: "rgba(255,255,255,0.75)", ...Typography.caption },
  styleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: `${Colors.accent}40`,
  },
  styleBadgeText: { color: Colors.accent, fontSize: 9, fontWeight: "700" },
});
