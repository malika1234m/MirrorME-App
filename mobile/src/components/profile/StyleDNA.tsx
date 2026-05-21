import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Post } from "@types/index";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";

interface Props { posts: Post[] }

const STYLE_ICON: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  Streetwear: "walk", Minimalist: "remove-circle-outline", Y2K: "star-outline",
  Cottagecore: "leaf-outline", "Dark Academia": "book-outline", "Business Casual": "briefcase-outline",
  Athleisure: "barbell-outline", Boho: "globe-outline", Preppy: "school-outline",
  Grunge: "musical-notes-outline", "Old Money": "diamond-outline",
};

const COLOR_HEX: Record<string, string> = {
  black: "#1a1a1a", white: "#f0f0f0", red: "#e53e3e", blue: "#3182ce",
  green: "#38a169", yellow: "#d69e2e", orange: "#dd6b20", purple: "#805ad5",
  pink: "#d53f8c", brown: "#92400e", gray: "#718096", grey: "#718096",
  beige: "#d4b896", cream: "#f5f0e8", navy: "#1a365d", teal: "#2c7a7b",
  olive: "#6b705c", ivory: "#f8f7f0", khaki: "#c3b091", maroon: "#800000",
  camel: "#c19a6b", sage: "#87ae73", rust: "#b7410e", lavender: "#b57bee",
  burgundy: "#800020", "off-white": "#f5f5f0", charcoal: "#36454f",
};

export const StyleDNA: React.FC<Props> = ({ posts }) => {
  const { topStyles, topColors, badge } = useMemo(() => {
    const styleCounts: Record<string, number> = {};
    const colorCounts: Record<string, number> = {};

    posts.forEach((p) => {
      p.outfitAnalysis?.fashionStyles.forEach((s) => {
        styleCounts[s] = (styleCounts[s] ?? 0) + 1;
      });
      p.outfitAnalysis?.colors.forEach((c) => {
        const key = c.toLowerCase();
        colorCounts[key] = (colorCounts[key] ?? 0) + 1;
      });
    });

    const topStyles = Object.entries(styleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([style, count]) => ({ style, count, pct: Math.round((count / posts.length) * 100) }));

    const topColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([color]) => ({ color, hex: COLOR_HEX[color] ?? "#888" }));

    const dominant = topStyles[0]?.style ?? "";
    const badge =
      dominant === "Streetwear" ? { label: "Street Icon", icon: "flame" } :
      dominant === "Minimalist" ? { label: "Minimal Master", icon: "remove-circle" } :
      dominant === "Old Money" ? { label: "Quiet Luxury", icon: "diamond" } :
      dominant === "Dark Academia" ? { label: "Dark Scholar", icon: "book" } :
      posts.length >= 5 ? { label: "Active Creator", icon: "sparkles" } :
      { label: "Rising Star", icon: "star" };

    return { topStyles, topColors, badge };
  }, [posts]);

  if (posts.length === 0 || topStyles.length === 0) return null;

  const maxCount = topStyles[0]?.count ?? 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient colors={Colors.gradient.primary} style={styles.headerIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="analytics" size={14} color={Colors.background} />
        </LinearGradient>
        <Text style={styles.headerTitle}>Style DNA</Text>

        {/* Badge */}
        <View style={styles.badge}>
          <Ionicons name={badge.icon as React.ComponentProps<typeof Ionicons>["name"]} size={11} color={Colors.primary} />
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>
      </View>

      {/* Style bars */}
      <View style={styles.bars}>
        {topStyles.map(({ style, count, pct }, i) => (
          <StyleBar
            key={style}
            style={style}
            count={count}
            pct={pct}
            maxCount={maxCount}
            rank={i + 1}
          />
        ))}
      </View>

      {/* Color palette */}
      {topColors.length > 0 && (
        <View style={styles.paletteSection}>
          <Text style={styles.paletteLabel}>Signature Palette</Text>
          <View style={styles.palette}>
            {topColors.map(({ color, hex }, i) => (
              <View key={color} style={styles.colorItem}>
                <View style={[
                  styles.colorSwatch,
                  { backgroundColor: hex },
                  i === 0 && styles.colorSwatchLarge,
                ]} />
                <Text style={styles.colorName} numberOfLines={1}>{color}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const StyleBar = ({ style, count, pct, maxCount, rank }: {
  style: string; count: number; pct: number; maxCount: number; rank: number;
}) => {
  const fillWidth = `${Math.round((count / maxCount) * 100)}%`;
  const isTop = rank === 1;

  return (
    <View style={stylesBar.row}>
      <View style={stylesBar.labelWrap}>
        <Ionicons
          name={STYLE_ICON[style] ?? "shirt-outline"}
          size={13}
          color={isTop ? Colors.primary : Colors.text.tertiary}
        />
        <Text style={[stylesBar.label, isTop && stylesBar.labelTop]} numberOfLines={1}>{style}</Text>
      </View>
      <View style={stylesBar.track}>
        {isTop ? (
          <LinearGradient
            colors={Colors.gradient.primary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[stylesBar.fill, { width: fillWidth }]}
          />
        ) : (
          <View style={[stylesBar.fill, stylesBar.fillSecondary, { width: fillWidth }]} />
        )}
      </View>
      <Text style={[stylesBar.pct, isTop && stylesBar.pctTop]}>{pct}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: Spacing.lg, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  headerIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...Typography.labelLarge, color: Colors.text.primary, flex: 1 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.primarySubtle, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: `${Colors.primary}30`,
  },
  badgeText: { color: Colors.primary, fontSize: 11, fontWeight: "700" },
  bars: { padding: Spacing.lg, gap: 12 },
  paletteSection: {
    borderTopWidth: 0.5, borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 10,
  },
  paletteLabel: {
    ...Typography.caption, color: Colors.text.tertiary,
    textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "700",
  },
  palette: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  colorItem: { alignItems: "center", gap: 5, maxWidth: 48 },
  colorSwatch: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  colorSwatchLarge: { width: 36, height: 36, borderRadius: 10 },
  colorName: { color: Colors.text.tertiary, fontSize: 9, fontWeight: "500", textTransform: "capitalize" },
});

const stylesBar = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  labelWrap: { flexDirection: "row", alignItems: "center", gap: 6, width: 120 },
  label: { ...Typography.caption, color: Colors.text.secondary, flex: 1 },
  labelTop: { color: Colors.text.primary, fontWeight: "700" },
  track: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },
  fillSecondary: { backgroundColor: Colors.text.tertiary + "60" },
  pct: { ...Typography.caption, color: Colors.text.tertiary, width: 32, textAlign: "right" },
  pctTop: { color: Colors.primary, fontWeight: "700" },
});
