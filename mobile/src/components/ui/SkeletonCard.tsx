import React, { useEffect, useRef } from "react";
import { View, Animated, Dimensions, StyleSheet } from "react-native";
import { Colors } from "@constants/colors";

const { width: W } = Dimensions.get("window");

const Bone = ({
  width,
  height,
  radius = 8,
  style,
  opacity,
}: {
  width: number | string;
  height: number;
  radius?: number;
  style?: object;
  opacity: Animated.AnimatedInterpolation<number>;
}) => (
  <Animated.View
    style={[
      skeletonStyles.bone,
      { width, height, borderRadius: radius, opacity },
      style,
    ]}
  />
);

function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
}

export const PostCardSkeleton: React.FC = () => {
  const opacity = useShimmer();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Bone width={38} height={38} radius={19} opacity={opacity} />
        <View style={{ flex: 1, marginLeft: 10, gap: 7 }}>
          <Bone width={120} height={13} opacity={opacity} />
          <Bone width={80} height={10} opacity={opacity} />
        </View>
      </View>
      <Bone width={W} height={W * 1.25} radius={0} opacity={opacity} />
      <View style={styles.actions}>
        <Bone width={60} height={20} opacity={opacity} />
        <Bone width={60} height={20} opacity={opacity} />
        <Bone width={60} height={20} opacity={opacity} />
      </View>
      <View style={styles.caption}>
        <Bone width="90%" height={13} opacity={opacity} />
        <Bone width="60%" height={13} opacity={opacity} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
};

export const ProfileSkeleton: React.FC = () => {
  const opacity = useShimmer();

  return (
    <View style={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Bone width={80} height={80} radius={40} opacity={opacity} />
        <View style={{ flex: 1, gap: 10 }}>
          <Bone width={140} height={16} opacity={opacity} />
          <Bone width={100} height={12} opacity={opacity} />
        </View>
      </View>
      <Bone width="100%" height={42} radius={12} opacity={opacity} />
      <View style={{ flexDirection: "row", gap: 2 }}>
        {[0, 1, 2].map((i) => (
          <Bone
            key={i}
            width={(W - 32 - 4) / 3}
            height={(W - 32 - 4) / 3}
            radius={4}
            opacity={opacity}
          />
        ))}
      </View>
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  bone: { backgroundColor: Colors.cardElevated },
});

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", padding: 14 },
  actions: { flexDirection: "row", gap: 16, padding: 14 },
  caption: { paddingHorizontal: 14, paddingBottom: 14 },
});
