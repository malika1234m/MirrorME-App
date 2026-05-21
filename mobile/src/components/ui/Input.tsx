import React, { useState, useRef } from "react";
import {
  View, TextInput, Text, TextInputProps,
  TouchableOpacity, ViewStyle, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Typography } from "@constants/colors";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export const Input: React.FC<Props> = ({
  label, error, hint, leftIcon, rightIcon,
  onRightIconPress, containerStyle, isPassword = false,
  secureTextEntry, onFocus, onBlur, ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const isSecure = isPassword ? !showPassword : secureTextEntry;

  const handleFocus = (e: Parameters<NonNullable<typeof onFocus>>[0]) => {
    setIsFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: Parameters<NonNullable<typeof onBlur>>[0]) => {
    setIsFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    onBlur?.(e);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? Colors.error : Colors.border, error ? Colors.error : Colors.primary],
  });

  return (
    <View style={[{ marginBottom: 18 }, containerStyle]}>
      {label && (
        <Text style={{
          color: isFocused ? Colors.primary : Colors.text.secondary,
          ...Typography.label,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}>
          {label}
        </Text>
      )}

      <Animated.View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.card,
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor,
        paddingHorizontal: 16,
        minHeight: 52,
      }}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={isFocused ? Colors.primary : Colors.text.tertiary}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          placeholderTextColor={Colors.text.tertiary}
          style={{
            flex: 1,
            color: Colors.text.primary,
            ...Typography.body,
            paddingVertical: 14,
          }}
          secureTextEntry={isSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons name={rightIcon} size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {(error || hint) && (
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 }}>
          {error && <Ionicons name="alert-circle-outline" size={12} color={Colors.error} />}
          <Text style={{ color: error ? Colors.error : Colors.text.tertiary, ...Typography.caption }}>
            {error || hint}
          </Text>
        </View>
      )}
    </View>
  );
};
