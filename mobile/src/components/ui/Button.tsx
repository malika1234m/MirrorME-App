import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Colors, Radius, Typography } from "@constants/colors";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "glass";
type Size = "sm" | "md" | "lg";

interface Props extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  gradient?: boolean;
}

const sizeMap = {
  sm: { py: 9, px: 18, radius: Radius.md, ...Typography.labelSmall, fontSize: 13 },
  md: { py: 14, px: 24, radius: Radius.lg, ...Typography.labelLarge },
  lg: { py: 17, px: 32, radius: Radius.xl, ...Typography.labelLarge, fontSize: 16 },
};

export const Button: React.FC<Props> = ({
  title, variant = "primary", size = "md",
  isLoading = false, fullWidth = false,
  leftIcon, gradient = false, disabled, style, onPress, ...props
}) => {
  const s = sizeMap[size];

  const handlePress = (e: Parameters<NonNullable<typeof onPress>>[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  const textColor =
    variant === "primary" ? Colors.text.inverse :
    variant === "ghost" ? Colors.primary :
    variant === "danger" ? Colors.white :
    Colors.text.primary;

  const content = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {isLoading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text style={{ color: textColor, fontSize: s.fontSize, fontWeight: s.fontWeight, letterSpacing: 0.2 }}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  const containerBase: ViewStyle = {
    paddingVertical: s.py,
    paddingHorizontal: s.px,
    borderRadius: s.radius,
    alignItems: "center",
    justifyContent: "center",
    opacity: disabled || isLoading ? 0.45 : 1,
    ...(fullWidth && { alignSelf: "stretch" }),
  };

  if (variant === "primary" && gradient) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        disabled={disabled || isLoading}
        onPress={handlePress}
        style={[containerBase, style as ViewStyle]}
        {...props}
      >
        <LinearGradient
          colors={Colors.gradient.primary}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ ...containerBase, paddingVertical: 0, paddingHorizontal: 0, padding: s.py, paddingLeft: s.px, paddingRight: s.px }}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyle: ViewStyle =
    variant === "primary"
      ? { backgroundColor: Colors.primary }
      : variant === "secondary"
      ? { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border }
      : variant === "glass"
      ? { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }
      : variant === "danger"
      ? { backgroundColor: Colors.error }
      : { backgroundColor: "transparent" };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || isLoading}
      onPress={handlePress}
      style={[containerBase, variantStyle, style as ViewStyle]}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
};
