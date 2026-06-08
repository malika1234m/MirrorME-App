import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Business } from "@models/index";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { businessService } from "@services/businessService";
import { formatCount } from "@utils/formatters";

interface Props {
  business: Business;
  onPress: () => void;
}

const CAT_COLORS: Record<string, string> = {
  Minimalist: Colors.primary,
  Streetwear: Colors.accent,
  "Old Money": "#D4AF37",
  Sustainable: "#38a169",
  Luxury: Colors.accentBlue,
  Boho: "#dd6b20",
};

export const BrandCard: React.FC<Props> = ({ business, onPress }) => {
  const [following, setFollowing] = useState(business.isFollowing ?? false);
  const accent = CAT_COLORS[business.category] ?? Colors.primary;

  const handleFollow = async (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    setFollowing((p) => !p);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await businessService.toggleFollow(business.id); }
    catch { setFollowing((p) => !p); }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Cover / gradient bg */}
      <View style={styles.cover}>
        {business.coverUrl ? (
          <Image source={{ uri: business.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={[`${accent}40`, Colors.card]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
        )}
        <LinearGradient colors={["transparent", Colors.card]} style={styles.coverFade} />

        {/* Verified badge */}
        {business.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
          </View>
        )}
      </View>

      {/* Logo */}
      <View style={styles.logoWrap}>
        {business.logoUrl ? (
          <Image source={{ uri: business.logoUrl }} style={styles.logo} contentFit="cover" />
        ) : (
          <LinearGradient colors={[accent, `${accent}80`]} style={[styles.logo, { alignItems: "center", justifyContent: "center" }]}>
            <Text style={styles.logoLetter}>{business.brandName[0]}</Text>
          </LinearGradient>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{business.brandName}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.catPill, { borderColor: `${accent}40` }]}>
            <Text style={[styles.catText, { color: accent }]}>{business.category}</Text>
          </View>
          {business.location && (
            <Text style={styles.loc} numberOfLines={1}>{business.location}</Text>
          )}
        </View>
        {business.bio && (
          <Text style={styles.bio} numberOfLines={2}>{business.bio}</Text>
        )}
        <View style={styles.footer}>
          <View style={styles.stats}>
            <Text style={styles.statText}>{formatCount(business._count.products)} products</Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.statText}>{formatCount(business._count.follows)} followers</Text>
          </View>
          <TouchableOpacity
            style={[styles.followBtn, following && styles.followBtnActive]}
            onPress={handleFollow}
            activeOpacity={0.8}
          >
            {!following && (
              <LinearGradient colors={Colors.gradient.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            )}
            <Text style={[styles.followText, following && styles.followTextActive]}>
              {following ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  cover: { height: 90, position: "relative" },
  coverFade: { position: "absolute", bottom: 0, left: 0, right: 0, height: 50 },
  verifiedBadge: { position: "absolute", top: 8, right: 8 },
  logoWrap: { marginLeft: Spacing.lg, marginTop: -24 },
  logo: { width: 48, height: 48, borderRadius: 14, borderWidth: 2, borderColor: Colors.background, overflow: "hidden" },
  logoLetter: { color: Colors.white, fontSize: 20, fontWeight: "900" },
  info: { padding: Spacing.lg, gap: 6 },
  name: { ...Typography.labelLarge, color: Colors.text.primary },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  catPill: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  catText: { fontSize: 10, fontWeight: "700" },
  loc: { ...Typography.caption, color: Colors.text.tertiary, flex: 1 },
  bio: { ...Typography.caption, color: Colors.text.secondary, lineHeight: 16 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  stats: { flexDirection: "row", alignItems: "center", gap: 5 },
  statText: { ...Typography.caption, color: Colors.text.tertiary },
  statDot: { color: Colors.text.tertiary },
  followBtn: {
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 6,
    overflow: "hidden",
  },
  followBtnActive: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  followText: { color: Colors.background, fontSize: 11, fontWeight: "800" },
  followTextActive: { color: Colors.text.secondary },
});
