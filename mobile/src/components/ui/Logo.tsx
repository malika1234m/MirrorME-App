import React from "react";
import { View, Text, Image, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  /** sm = nav bars / compact headers, md = section headers, lg = auth & onboarding hero */
  size?: LogoSize;
  /** Show the "AI Fashion Social" tagline under the wordmark (lg only) */
  withTagline?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<LogoSize, { badge: number; radius: number; text: number }> = {
  sm: { badge: 32, radius: 9,  text: 20 },
  md: { badge: 44, radius: 13, text: 24 },
  lg: { badge: 52, radius: Radius.md, text: 18 },
};

const LOGO = require("../../../assets/logo.png");

/** MirrorME brand mark — logo image + wordmark, used across auth, onboarding & nav */
export const Logo: React.FC<LogoProps> = ({ size = "sm", withTagline = false, style }) => {
  const s = SIZES[size];
  const wordmarkStyle = size === "lg"
    ? [Typography.title3, { color: Colors.text.primary }]
    : [{ fontSize: s.text, fontWeight: "900" as const, letterSpacing: -0.5, color: Colors.primary }];

  return (
    <View style={[styles.row, style]}>
      <Image
        source={LOGO}
        style={{ width: s.badge, height: s.badge, borderRadius: s.radius }}
        resizeMode="cover"
      />
      <View>
        <Text style={wordmarkStyle}>MirrorME</Text>
        {withTagline && <Text style={styles.tagline}>AI Fashion Social</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  tagline: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 1 },
});
