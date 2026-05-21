import React from "react";
import { Text, View, ViewStyle, TouchableOpacity } from "react-native";
import { Colors, Radius, Typography } from "@constants/colors";

interface Props {
  label: string;
  color?: string;
  style?: ViewStyle;
  onPress?: () => void;
  dot?: boolean;
}

export const Tag: React.FC<Props> = ({
  label, color = Colors.primary, style, onPress, dot = false,
}) => {
  const content = (
    <View style={[{
      backgroundColor: `${color}12`,
      borderColor: `${color}35`,
      borderWidth: 1,
      borderRadius: Radius.full,
      paddingHorizontal: 10,
      paddingVertical: 5,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    }, style]}>
      {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />}
      <Text style={{ color, ...Typography.caption, fontWeight: "600", letterSpacing: 0.3 }}>
        {label}
      </Text>
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{content}</TouchableOpacity>;
  return content;
};
