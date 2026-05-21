import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { Colors } from "@constants/colors";

interface Props { size?: number; fullScreen?: boolean }

export const LoadingSpinner: React.FC<Props> = ({ size = 36, fullScreen = false }) => {
  const spin = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, useNativeDriver: true })
    ).start();
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }).start();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={[styles.wrapper, fullScreen && styles.fullScreen]}>
      <Animated.View style={{ transform: [{ rotate }, { scale }] }}>
        <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center", padding: 24 },
  fullScreen: { flex: 1, backgroundColor: Colors.background },
  ring: {
    borderWidth: 2.5,
    borderColor: Colors.border,
    borderTopColor: Colors.primary,
    position: "relative",
  },
  dot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
