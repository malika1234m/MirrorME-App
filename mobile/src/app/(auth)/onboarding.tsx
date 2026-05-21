import React, { useState, useRef } from "react";
import {
  View, Text, FlatList, Dimensions, TouchableOpacity,
  StyleSheet, Animated, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Radius } from "@constants/colors";
import { Button } from "@components/ui/Button";

const { width: W, height: H } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "sparkles" as const,
    gradient: ["#C8FF00", "#78D500"] as [string, string],
    title: "AI Reads\nYour Fit",
    subtitle: "GPT-4o Vision instantly detects clothing, colors, style tags — and gives you a professional stylist opinion.",
    accent: Colors.primary,
  },
  {
    id: "2",
    icon: "people" as const,
    gradient: ["#FF3CAC", "#8B5CF6"] as [string, string],
    title: "Share &\nGet Rated",
    subtitle: "Post your outfits, let the community rate them 1–10, and discover what's trending right now.",
    accent: Colors.accent,
  },
  {
    id: "3",
    icon: "color-palette" as const,
    gradient: ["#8B5CF6", "#2B86C5"] as [string, string],
    title: "Find Similar\nStyles",
    subtitle: "AI matches you with visually similar outfits from creators around the world. Save the ones you love.",
    accent: Colors.accentBlue,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.replace("/(auth)/login");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
        renderItem={({ item }) => (
          <View style={{ width: W, flex: 1 }}>
            <LinearGradient
              colors={["#080808", "#0F0F0F"]}
              style={StyleSheet.absoluteFill}
            />

            {/* Large icon backdrop */}
            <View style={styles.iconSection}>
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.iconOuter}
              >
                <View style={styles.iconInner}>
                  <Ionicons name={item.icon} size={64} color={Colors.text.inverse} />
                </View>
              </LinearGradient>

              {/* Glow */}
              <View style={[styles.glow, { backgroundColor: item.accent + "20" }]} />
            </View>

            {/* Text */}
            <View style={styles.textSection}>
              <Text style={[styles.title, { color: Colors.text.primary }]}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom UI */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: "clamp" });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.35, 1, 0.35], extrapolate: "clamp" });
            return (
              <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity, backgroundColor: SLIDES[activeIndex].accent }]} />
            );
          })}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  },
  textSection: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  title: {
    ...Typography.display,
    marginBottom: 16,
  },
  subtitle: {
    color: Colors.text.secondary,
    ...Typography.bodyLarge,
    lineHeight: 26,
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
