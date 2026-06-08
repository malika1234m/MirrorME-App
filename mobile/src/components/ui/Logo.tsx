import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  /** sm = nav bars / compact headers, md = section headers, lg = auth & onboarding hero */
  size?: LogoSize;
  /** Show the "AI Fashion Social" tagline under the wordmark (lg only) */
  withTagline?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<LogoSize, { badge: number; radius: number; icon: number; text: number }> = {
  sm: { badge: 32, radius: 9, icon: 16, text: 20 },
  md: { badge: 44, radius: 13, icon: 21, text: 24 },
  lg: { badge: 52, radius: Radius.md, icon: 26, text: 18 },
};

/** MirrorME brand mark — gradient badge + wordmark, used across auth, onboarding & nav */
export const Logo: React.FC<LogoProps> = ({ size = "sm", withTagline = false, style }) => {
  const s = SIZES[size];
  // Hero contexts (auth/onboarding) pair the mark with a large heading right below it,
  // so the wordmark reads as a quiet label rather than competing with it.
  const wordmarkStyle = size === "lg"
    ? [Typography.title3, { color: Colors.text.primary }]
    : [{ fontSize: s.text, fontWeight: "900" as const, letterSpacing: -0.5, color: Colors.primary }];

  return (
    <View style={[styles.row, style]}>
      <LinearGradient
        colors={Colors.gradient.accent}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.badge, { width: s.badge, height: s.badge, borderRadius: s.radius }]}
      >
        <Ionicons name="shirt" size={s.icon} color={Colors.background} />
      </LinearGradient>
      <View>
        <Text style={wordmarkStyle}>MirrorME</Text>
        {withTagline && <Text style={styles.tagline}>AI Fashion Social</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  badge: { alignItems: "center", justifyContent: "center" },
  tagline: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 1 },
});
