import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { OutfitAnalysis } from "@models/index";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { Tag } from "@components/ui/Tag";

interface Props { analysis: OutfitAnalysis }

const COLOR_NAMES: Record<string, string> = {
  black: "#1a1a1a", white: "#f5f5f5", red: "#e53e3e", blue: "#3182ce",
  green: "#38a169", yellow: "#d69e2e", orange: "#dd6b20", purple: "#805ad5",
  pink: "#d53f8c", brown: "#92400e", gray: "#718096", grey: "#718096",
  beige: "#d4b896", cream: "#fffdd0", navy: "#1a365d", teal: "#2c7a7b",
  olive: "#6b705c", ivory: "#fffff0", khaki: "#c3b091", maroon: "#800000",
};

const resolveColor = (name: string) => COLOR_NAMES[name.toLowerCase()] || "#888";

export const OutfitAnalysisCard: React.FC<Props> = ({ analysis }) => {
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    setExpanded(!expanded);
    Animated.spring(heightAnim, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  };

  return (
    <View style={styles.card}>
      {/* Gradient top bar */}
      <LinearGradient
        colors={[Colors.primarySubtle, "transparent"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.topBar}
      />

      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={toggle} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={Colors.gradient.primary} style={styles.aiIconBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="sparkles" size={14} color={Colors.background} />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>AI Analysis</Text>
            {analysis.confidence > 0 && (
              <Text style={styles.confidence}>{Math.round(analysis.confidence * 100)}% confidence</Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          {analysis.fashionStyles[0] && (
            <Tag label={analysis.fashionStyles[0]} color={Colors.primary} />
          )}
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.text.tertiary}
          />
        </View>
      </TouchableOpacity>

      {/* Overall style */}
      {analysis.overallStyle && (
        <Text style={styles.overallStyle}>"{analysis.overallStyle}"</Text>
      )}

      {/* Meta chips */}
      <View style={styles.metaRow}>
        {analysis.season && (
          <MetaChip icon="sunny-outline" label={analysis.season} color={Colors.warning} />
        )}
        {analysis.occasion && (
          <MetaChip icon="calendar-outline" label={analysis.occasion} color={Colors.info} />
        )}
      </View>

      {/* Color palette */}
      {analysis.colors.length > 0 && (
        <View style={styles.colorPalette}>
          {analysis.colors.map((color, i) => (
            <View key={i} style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: resolveColor(color) }]} />
              <Text style={styles.colorName}>{color}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Expanded details */}
      {expanded && (
        <View style={styles.expanded}>
          <Section title="Clothing Items" items={analysis.clothingTypes} color={Colors.accentBlue} />
          <Section title="All Styles" items={analysis.fashionStyles} color={Colors.accent} />

          {analysis.stylistTips.length > 0 && (
            <View style={styles.tipsSection}>
              <View style={styles.tipsSectionHeader}>
                <Ionicons name="bulb-outline" size={14} color={Colors.warning} />
                <Text style={styles.sectionLabel}>Stylist Tips</Text>
              </View>
              {analysis.stylistTips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <LinearGradient
                    colors={Colors.gradient.primary}
                    style={styles.tipNum}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.tipNumText}>{i + 1}</Text>
                  </LinearGradient>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.toggleRow} onPress={toggle} activeOpacity={0.7}>
        <Text style={styles.toggleText}>{expanded ? "Show less" : "Show full analysis"}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={13} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const Section = ({ title, items, color }: { title: string; items: string[]; color: string }) =>
  items.length > 0 ? (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {items.map((item, i) => <Tag key={i} label={item} color={color} />)}
      </View>
    </View>
  ) : null;

const MetaChip = ({ icon, label, color }: { icon: string; label: string; color: string }) => (
  <View style={[styles.metaChip, { borderColor: `${color}30`, backgroundColor: `${color}10` }]}>
    <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={13} color={color} />
    <Text style={[styles.metaChipText, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  topBar: { height: 2, marginBottom: 0 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    paddingBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  aiIconBg: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...Typography.labelLarge, color: Colors.text.primary },
  confidence: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  overallStyle: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontStyle: "italic",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  metaRow: { flexDirection: "row", gap: 8, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaChipText: { ...Typography.caption, fontWeight: "600" },
  colorPalette: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    flexWrap: "wrap",
  },
  colorItem: { alignItems: "center", gap: 5 },
  colorSwatch: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  colorName: { color: Colors.text.tertiary, fontSize: 10, fontWeight: "500", textTransform: "capitalize" },
  expanded: { paddingHorizontal: Spacing.lg, paddingBottom: 4 },
  section: { marginBottom: Spacing.md },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
    marginBottom: 8,
  },
  tipsSection: { marginBottom: Spacing.md },
  tipsSectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  tipRow: { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" },
  tipNum: { width: 20, height: 20, borderRadius: 6, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  tipNumText: { color: Colors.background, fontSize: 11, fontWeight: "800" },
  tipText: { color: Colors.text.secondary, ...Typography.body, flex: 1, lineHeight: 20 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  toggleText: { color: Colors.primary, ...Typography.label },
});
