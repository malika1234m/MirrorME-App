import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { useImagePicker } from "@hooks/useImagePicker";
import { businessService } from "@services/businessService";
import { Product } from "@types/index";
import { ProductCard } from "@components/business/ProductCard";

const { width: W, height: H } = Dimensions.get("window");

type State = "idle" | "loading" | "results" | "error";

export default function MatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { image, pickFromGallery, pickFromCamera, clearImage } = useImagePicker();
  const [state, setState] = useState<State>("idle");
  const [matches, setMatches] = useState<Product[]>([]);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCatalogFallback, setIsCatalogFallback] = useState(false);

  const handlePickSource = () =>
    Alert.alert("Find This Look", "Upload a photo of the style you want", [
      { text: "Camera", onPress: pickFromCamera },
      { text: "Photo Library", onPress: pickFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);

  const handleMatch = async () => {
    if (!image) return;
    setState("loading");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const form = new FormData();
      form.append("image", { uri: image.uri, type: image.type, name: image.name } as never);
      const res = await businessService.matchByPhoto(form);
      if (res.data) {
        setMatches(res.data.matches);
        setResultImageUrl(res.data.imageUrl || null);
        setIsCatalogFallback((res.data as any).matchMethod === "catalog");
        setState("results");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Match failed");
      setState("error");
    }
  };

  const reset = () => {
    clearImage();
    setMatches([]);
    setResultImageUrl(null);
    setState("idle");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Find This Look</Text>
          <Text style={styles.subtitle}>Upload any outfit → AI finds where to buy it</Text>
        </View>
        {(state === "results" || image) && (
          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Ionicons name="refresh" size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {state === "idle" && !image && <IdleState onPick={handlePickSource} />}

      {image && state !== "results" && (
        <View style={styles.previewSection}>
          <View style={styles.previewCard}>
            <Image source={{ uri: image.uri }} style={styles.preview} contentFit="cover" />
            <TouchableOpacity style={styles.changeImg} onPress={handlePickSource}>
              <BlurView intensity={60} tint="dark" style={styles.changeImgInner}>
                <Ionicons name="camera-outline" size={14} color={Colors.white} />
                <Text style={styles.changeImgText}>Change</Text>
              </BlurView>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.matchBtn, state === "loading" && styles.matchBtnLoading]}
            onPress={handleMatch}
            disabled={state === "loading"}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.gradient.primary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.matchBtnGrad}
            >
              {state === "loading" ? (
                <>
                  <ActivityIndicator color={Colors.background} size="small" />
                  <Text style={styles.matchBtnText}>AI is searching brands…</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color={Colors.background} />
                  <Text style={styles.matchBtnText}>Find Where to Buy</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {state === "loading" && (
            <View style={styles.loadingHints}>
              {["Analysing style & colours", "Comparing 100+ brand catalogs", "Ranking by similarity"].map((hint, i) => (
                <View key={i} style={styles.hintRow}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                  <Text style={styles.hintText}>{hint}</Text>
                </View>
              ))}
            </View>
          )}

          {state === "error" && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}
        </View>
      )}

      {state === "results" && (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Catalog fallback banner */}
          {isCatalogFallback && (
            <View style={styles.fallbackBanner}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.warning} />
              <Text style={styles.fallbackText}>AI matching unavailable — showing full catalog</Text>
            </View>
          )}

          {/* Result header */}
          <View style={styles.resultsHeader}>
            {resultImageUrl ? (
              <Image source={{ uri: resultImageUrl }} style={styles.resultThumb} contentFit="cover" />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.resultsTitle}>
                {matches.length > 0 ? `${matches.length} ${isCatalogFallback ? "products" : "matches found"}` : "No matches yet"}
              </Text>
              <Text style={styles.resultsSub}>
                {matches.length > 0
                  ? isCatalogFallback ? "Browse brands on MirrorME" : "Sorted by visual similarity"
                  : "Try a clearer photo or different angle"}
              </Text>
            </View>
          </View>

          {/* Match cards */}
          <View style={styles.matchGrid}>
            {matches.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                rank={i + 1}
                onPress={() => router.push(`/business/${product.business.id}`)}
              />
            ))}
          </View>

          {/* Try again */}
          <TouchableOpacity style={styles.tryAgain} onPress={reset}>
            <Ionicons name="camera-outline" size={16} color={Colors.primary} />
            <Text style={styles.tryAgainText}>Search with a different photo</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const IdleState = ({ onPick }: { onPick: () => void }) => (
  <View style={styles.idle}>
    {/* Hero illustration */}
    <TouchableOpacity style={styles.idleCard} onPress={onPick} activeOpacity={0.88}>
      <LinearGradient
        colors={[`${Colors.primary}15`, `${Colors.accentBlue}10`, Colors.card]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.idleIconWrap}>
        <LinearGradient colors={Colors.gradient.primary} style={styles.idleIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="camera" size={36} color={Colors.background} />
        </LinearGradient>
      </View>
      <Text style={styles.idleTitle}>Upload a Photo</Text>
      <Text style={styles.idleSub}>
        Snap or upload any outfit you love.{"\n"}AI matches it to brand catalogs instantly.
      </Text>
      <View style={styles.idleHintRow}>
        {["Street style", "Magazine looks", "Screenshot", "Runway"].map((t) => (
          <View key={t} style={styles.idleTag}>
            <Text style={styles.idleTagText}>{t}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>

    {/* How it works */}
    <View style={styles.steps}>
      {[
        { icon: "camera-outline", label: "Upload a photo", sub: "Any outfit, from anywhere" },
        { icon: "sparkles", label: "AI analyses style", sub: "Colours, cut, category, vibe" },
        { icon: "storefront-outline", label: "See where to buy", sub: "Matched to verified brands" },
      ].map((step, i) => (
        <View key={i} style={styles.step}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepLabel}>{step.label}</Text>
            <Text style={styles.stepSub}>{step.sub}</Text>
          </View>
          <Ionicons name={step.icon as React.ComponentProps<typeof Ionicons>["name"]} size={20} color={Colors.text.tertiary} />
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingTop: 8, paddingBottom: 16,
  },
  title: { ...Typography.title2, color: Colors.text.primary },
  subtitle: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 3 },
  resetBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  // Idle
  idle: { flex: 1, paddingHorizontal: Spacing.lg, gap: 20 },
  idleCard: {
    borderRadius: Radius.xxl, overflow: "hidden", borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, alignItems: "center", gap: 12,
  },
  idleIconWrap: { marginBottom: 4 },
  idleIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  idleTitle: { ...Typography.title3, color: Colors.text.primary },
  idleSub: { ...Typography.body, color: Colors.text.secondary, textAlign: "center", lineHeight: 22 },
  idleHintRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  idleTag: {
    backgroundColor: Colors.card, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  idleTagText: { ...Typography.caption, color: Colors.text.tertiary },
  steps: { gap: 0 },
  step: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primarySubtle, borderWidth: 1, borderColor: `${Colors.primary}40`,
    alignItems: "center", justifyContent: "center",
  },
  stepNumText: { color: Colors.primary, fontSize: 12, fontWeight: "800" },
  stepLabel: { ...Typography.labelLarge, color: Colors.text.primary },
  stepSub: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
  // Preview
  previewSection: { flex: 1, paddingHorizontal: Spacing.lg, gap: 16 },
  previewCard: { borderRadius: Radius.xxl, overflow: "hidden", height: H * 0.38 },
  preview: { width: "100%", height: "100%" },
  changeImg: { position: "absolute", bottom: 12, right: 12, borderRadius: Radius.full, overflow: "hidden" },
  changeImgInner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  changeImgText: { color: Colors.white, ...Typography.label },
  matchBtn: { borderRadius: Radius.xl, overflow: "hidden" },
  matchBtnLoading: { opacity: 0.8 },
  matchBtnGrad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16,
  },
  matchBtnText: { ...Typography.labelLarge, color: Colors.background, fontWeight: "800" },
  loadingHints: { gap: 10 },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  hintText: { ...Typography.body, color: Colors.text.secondary },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: `${Colors.error}15`, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: `${Colors.error}30`,
  },
  errorText: { ...Typography.body, color: Colors.error, flex: 1 },
  fallbackBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: Spacing.lg, marginTop: 12,
    backgroundColor: `${Colors.warning}15`, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.warning}30`,
  },
  fallbackText: { ...Typography.caption, color: Colors.warning, flex: 1 },
  // Results
  resultsHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  resultThumb: { width: 52, height: 64, borderRadius: Radius.lg },
  resultsTitle: { ...Typography.title3, color: Colors.text.primary },
  resultsSub: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 3 },
  matchGrid: { padding: Spacing.lg, gap: 12 },
  tryAgain: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, margin: Spacing.lg,
    borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.primary,
  },
  tryAgainText: { color: Colors.primary, ...Typography.label, fontWeight: "700" },
});
