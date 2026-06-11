import React, { useState, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Animated, StatusBar, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography } from "@constants/colors";
import { Button } from "@components/ui/Button";
import { Logo } from "@components/ui/Logo";

const IS_WEB = Platform.OS === "web";

type IoniconName = keyof typeof Ionicons.glyphMap;

interface Slide {
  id: string;
  icon: IoniconName;
  gradient: [string, string];
  title: string;
  subtitle: string;
  accent: string;
  features?: { icon: IoniconName; label: string }[];
}

const SLIDES: Slide[] = [
  {
    id: "1",
    icon: "sparkles",
    gradient: ["#C8FF00", "#78D500"],
    title: "AI Reads\nYour Fit",
    subtitle: "GPT-4o Vision instantly detects clothing, colors, style tags — and gives you a professional stylist opinion.",
    accent: Colors.primary,
  },
  {
    id: "2",
    icon: "people",
    gradient: ["#FF3CAC", "#8B5CF6"],
    title: "Share &\nGet Rated",
    subtitle: "Post your outfits, let the community rate them 1–10, and discover what's trending right now.",
    accent: Colors.accent,
  },
  {
    id: "3",
    icon: "color-palette",
    gradient: ["#8B5CF6", "#2B86C5"],
    title: "Find Similar\nStyles",
    subtitle: "AI matches you with visually similar outfits from creators around the world. Save the ones you love.",
    accent: Colors.accentBlue,
  },
  {
    id: "4",
    icon: "shirt",
    gradient: ["#F5A623", "#C8FF00"],
    title: "Try On Any\nBrand's Clothes",
    subtitle: "Browse hundreds of brand designs and see exactly how they look on you — before buying.",
    accent: "#F5A623",
    features: [
      { icon: "body-outline",       label: "AI body tracking overlays garments live" },
      { icon: "storefront-outline", label: "Shop from verified brand collections" },
      { icon: "resize-outline",     label: "Size recommender based on your measurements" },
    ],
  },
];

// Renders one slide's content — used by both web and native paths
function SlideContent({ item }: { item: Slide }) {
  return (
    <>
      <LinearGradient colors={["#080808", "#0F0F0F"]} style={StyleSheet.absoluteFill} />

      <View style={styles.iconSection}>
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconOuter}
        >
          <View style={styles.iconInner}>
            <Ionicons name={item.icon} size={64} color={Colors.text.inverse} />
          </View>
        </LinearGradient>
        <View style={[styles.glow, { backgroundColor: item.accent + "22" }]} />
      </View>

      <View style={styles.textSection}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>

        {item.features && (
          <View style={styles.featureList}>
            {item.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureIconWrap}
                >
                  <Ionicons name={f.icon} size={15} color={Colors.background} />
                </LinearGradient>
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const activeSlide = SLIDES[activeIndex];

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      if (IS_WEB) {
        setActiveIndex(activeIndex + 1);
      } else {
        flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      }
    } else {
      router.replace("/(auth)/login");
    }
  };

  // ── Dot indicators ────────────────────────────────────────────────
  const nativeDots = SLIDES.map((_, i) => {
    const W = 375; // placeholder — overridden per-platform below
    const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
    const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: "clamp" });
    const opacity  = scrollX.interpolate({ inputRange, outputRange: [0.35, 1, 0.35], extrapolate: "clamp" });
    return { dotWidth, opacity };
  });

  // ── Bottom bar (shared) ───────────────────────────────────────────
  const bottomBar = (
    <View style={styles.bottom}>
      <View style={styles.dots}>
        {SLIDES.map((_, i) =>
          IS_WEB ? (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: activeIndex === i ? 24 : 8,
                  opacity: activeIndex === i ? 1 : 0.35,
                  backgroundColor: activeSlide.accent,
                },
              ]}
            />
          ) : (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  width: nativeDots[i].dotWidth,
                  opacity: nativeDots[i].opacity,
                  backgroundColor: activeSlide.accent,
                },
              ]}
            />
          )
        )}
      </View>

      <Button
        title={activeIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
        fullWidth
        gradient={activeIndex === SLIDES.length - 1}
        onPress={goNext}
        style={{ marginBottom: 16 }}
      />

      <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
        <Text style={styles.skip}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  // ── WEB: simple single-slide display, no FlatList ─────────────────
  if (IS_WEB) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.webFrame}>
          <Logo size="sm" style={styles.logoRow} />
          <View style={styles.webSlide}>
            <SlideContent item={activeSlide} />
          </View>
          {bottomBar}
        </View>
      </View>
    );
  }

  // ── NATIVE: FlatList carousel ─────────────────────────────────────
  // Re-calculate dots with real scrollX per slide width on native
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Logo size="sm" style={styles.logoRow} />

      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) =>
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / 375))
        }
        renderItem={({ item }) => (
          <View style={styles.nativeSlide}>
            <SlideContent item={item} />
          </View>
        )}
      />

      {bottomBar}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Web layout
  webFrame: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    overflow: "hidden",
  },
  webSlide: {
    flex: 1,
    overflow: "hidden",
  },

  // Native layout
  nativeSlide: {
    width: 375,
    flex: 1,
  },

  logoRow: {
    position: "absolute",
    top: 56,
    left: 24,
    zIndex: 10,
  },

  iconSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  iconOuter: {
    width: 180,
    height: 180,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    elevation: 20,
  },
  iconInner: {
    width: 160,
    height: 160,
    borderRadius: 48,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    bottom: -60,
    alignSelf: "center",
  },

  textSection: {
    paddingHorizontal: 32,
    paddingBottom: 28,
  },
  title: {
    ...Typography.display,
    color: Colors.text.primary,
    marginBottom: 14,
  },
  subtitle: {
    color: Colors.text.secondary,
    ...Typography.bodyLarge,
    lineHeight: 26,
  },

  featureList: { marginTop: 22, gap: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: {
    ...Typography.body,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },

  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
    alignItems: "center",
  },
  dots: { flexDirection: "row", gap: 6, marginBottom: 28, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  skip: { color: Colors.text.tertiary, ...Typography.label },
});
