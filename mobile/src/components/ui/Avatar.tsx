import React from "react";
import { View, Text, Image, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@constants/colors";

interface Props {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: ViewStyle;
  hasStory?: boolean;
  isVerified?: boolean;
}

export const Avatar: React.FC<Props> = ({
  uri, name, size = 40, style, hasStory = false, isVerified = false,
}) => {
  const initials = name
    ? name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const ring = hasStory ? 2.5 : 0;
  const outerSize = size + ring * 2 + (hasStory ? 4 : 0);

  const inner = uri ? (
    <Image
      source={{ uri }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: hasStory ? 2 : 0,
        borderColor: Colors.background,
      }}
    />
  ) : (
    <LinearGradient
      colors={["#C8FF00", "#8B5CF6"]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: hasStory ? 2 : 0,
        borderColor: Colors.background,
      }}
    >
      <Text style={{ color: Colors.text.inverse, fontSize: size * 0.33, fontWeight: "700" }}>
        {initials}
      </Text>
    </LinearGradient>
  );

  if (!hasStory) {
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2 }, style]}>
        {inner}
        {isVerified && (
          <View style={{
            position: "absolute", bottom: -1, right: -1,
            backgroundColor: Colors.primary, borderRadius: 10,
            width: size * 0.35, height: size * 0.35,
            alignItems: "center", justifyContent: "center",
            borderWidth: 1.5, borderColor: Colors.background,
          }}>
            <Text style={{ fontSize: size * 0.18, color: Colors.background }}>✓</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[{ width: outerSize, height: outerSize, borderRadius: outerSize / 2 }, style]}>
      <LinearGradient
        colors={Colors.gradient.accent}
        start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }}
        style={{
          width: outerSize, height: outerSize, borderRadius: outerSize / 2,
          alignItems: "center", justifyContent: "center",
        }}
      >
        {inner}
      </LinearGradient>
    </View>
  );
};
