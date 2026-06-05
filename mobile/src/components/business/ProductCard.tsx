import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Linking, Alert } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Product } from "@types/index";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { businessService } from "@services/businessService";

const { width: W } = Dimensions.get("window");

interface Props {
  product: Product;
  rank?: number;
  onPress?: () => void;
  showBrand?: boolean;
  showTryOn?: boolean;
}

export const ProductCard: React.FC<Props> = ({ product, rank, onPress, showBrand = true, showTryOn = false }) => {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const score = product.score;

  const handleShop = async () => {
    if (!product.shopLink) {
      Alert.alert("No shop link", "This brand hasn't added a link yet.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = /^https?:\/\//i.test(product.shopLink) ? product.shopLink : `https://${product.shopLink}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Cannot open link", "This shop link doesn't appear to be valid.");
    }
  };

  const handleSave = async () => {
    setSaved((p) => !p);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await businessService.saveProduct(product.id); }
    catch { setSaved((p) => !p); }
  };

  const handleTryOn = () => {
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

  return (
    <View style={styles.card}>
      {/* Image */}
      <TouchableOpacity style={styles.imageWrap} onPress={onPress} activeOpacity={0.9}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} contentFit="cover" />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={styles.imageGrad} />

        {/* Rank badge */}
        {rank !== undefined && (
          <LinearGradient
            colors={rank === 1 ? ["#FFD700", "#FF8C00"] : Colors.gradient.primary}
            style={styles.rankBadge}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {rank === 1
              ? <Ionicons name="trophy" size={14} color="#FFD700" />
              : <Text style={styles.rankText}>#{rank}</Text>}
          </LinearGradient>
        )}

        {/* Similarity score */}
        {score !== undefined && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{Math.round(score * 100)}% match</Text>
          </View>
        )}

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={18} color={saved ? Colors.primary : Colors.white} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.info}>
        {showBrand && (
          <TouchableOpacity style={styles.brandRow} onPress={onPress} activeOpacity={0.8}>
            {product.business.logoUrl ? (
              <Image source={{ uri: product.business.logoUrl }} style={styles.brandLogo} contentFit="cover" />
            ) : (
              <View style={[styles.brandLogo, styles.brandLogoFallback]}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.primary }}>
                  {product.business.brandName[0]}
                </Text>
              </View>
            )}
            <Text style={styles.brandName} numberOfLines={1}>{product.business.brandName}</Text>
            {product.business.isVerified && (
              <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>

        {/* Styles */}
        {product.fashionStyles.length > 0 && (
          <View style={styles.tagRow}>
            {product.fashionStyles.slice(0, 2).map((s) => (
              <View key={s} style={styles.tag}>
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottom}>
          <View>
            {product.price ? (
              <Text style={styles.price}>
                {product.currency === "USD" ? "$" : product.currency}{product.price.toFixed(0)}
              </Text>
            ) : (
              <Text style={styles.priceTbd}>Price on site</Text>
            )}
            {product.sizes.length > 0 && (
              <Text style={styles.sizes}>{product.sizes.slice(0, 4).join(" · ")}</Text>
            )}
          </View>

          <View style={styles.actionBtns}>
            {showTryOn && (
              <TouchableOpacity style={styles.tryOnBtn} onPress={handleTryOn} activeOpacity={0.85}>
                <View style={styles.tryOnBtnInner}>
                  <Ionicons name="camera-outline" size={13} color={Colors.primary} />
                  <Text style={styles.tryOnBtnText}>Try</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.shopBtn} onPress={handleShop} activeOpacity={0.85}>
              <LinearGradient
                colors={Colors.gradient.primary}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.shopBtnInner}
              >
                <Text style={styles.shopBtnText}>Shop</Text>
                <Ionicons name="arrow-forward" size={13} color={Colors.background} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  imageWrap: { height: 220, position: "relative" },
  image: { width: "100%", height: "100%" },
  imageGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: "50%" },
  rankBadge: {
    position: "absolute", top: 10, left: 10,
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  rankText: { color: Colors.background, fontSize: 11, fontWeight: "800" },
  scoreBadge: {
    position: "absolute", bottom: 10, left: 10,
    backgroundColor: "rgba(0,0,0,0.7)", borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: `${Colors.primary}40`,
  },
  scoreText: { color: Colors.primary, fontSize: 11, fontWeight: "700" },
  saveBtn: {
    position: "absolute", top: 10, right: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  info: { padding: Spacing.lg, gap: 8 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandLogo: { width: 20, height: 20, borderRadius: 5, overflow: "hidden" },
  brandLogoFallback: { backgroundColor: Colors.primarySubtle, alignItems: "center", justifyContent: "center" },
  brandName: { ...Typography.caption, color: Colors.text.tertiary, flex: 1 },
  productTitle: { ...Typography.labelLarge, color: Colors.text.primary, lineHeight: 20 },
  tagRow: { flexDirection: "row", gap: 6 },
  tag: {
    backgroundColor: Colors.primarySubtle, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.primary}25`,
  },
  tagText: { color: Colors.primary, fontSize: 10, fontWeight: "600" },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actionBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  tryOnBtn: {
    borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.primary,
  },
  tryOnBtnInner: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 11, paddingVertical: 8,
  },
  tryOnBtnText: { color: Colors.primary, fontSize: 12, fontWeight: "800" },
  price: { ...Typography.title3, color: Colors.text.primary },
  priceTbd: { ...Typography.body, color: Colors.text.tertiary },
  sizes: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
  shopBtn: { borderRadius: Radius.xl, overflow: "hidden" },
  shopBtnInner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  shopBtnText: { color: Colors.background, ...Typography.label, fontWeight: "800" },
});
