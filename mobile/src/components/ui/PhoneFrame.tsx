import React from "react";
import { Platform, View, StyleSheet, useWindowDimensions } from "react-native";
import { Colors } from "@constants/colors";

const PHONE_WIDTH = 430;
const PHONE_HEIGHT = 932;
const DESKTOP_BREAKPOINT = 820;

/**
 * On wide web viewports, renders the app inside a phone-shaped mockup so the
 * mobile-first UI doesn't stretch across a desktop browser. On native and on
 * narrow (mobile) web viewports, it's a transparent passthrough.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowDimensions();

  if (Platform.OS !== "web" || width < DESKTOP_BREAKPOINT) {
    return <>{children}</>;
  }

  const frameHeight = Math.min(PHONE_HEIGHT, height - 64);

  return (
    <View style={styles.backdrop}>
      <View style={[styles.device, { width: PHONE_WIDTH, height: frameHeight }]}>
        <View style={styles.screen}>{children}</View>
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    ...Platform.select({ web: { minHeight: "100vh" as unknown as number } }),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
    paddingVertical: 32,
  },
  device: {
    borderRadius: 52,
    borderWidth: 10,
    borderColor: "#1c1c1e",
    backgroundColor: Colors.background,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 30 },
    // `position: fixed` descendants (tab bar, headers, etc.) are positioned
    // relative to the viewport on web unless an ancestor establishes a new
    // containing block — a `transform` does that, confining them to the frame.
    ...Platform.select({ web: { transform: [{ translateZ: 0 }] } as object }),
  },
  screen: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  homeIndicator: {
    position: "absolute",
    bottom: 8,
    left: "50%",
    marginLeft: -67,
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
    zIndex: 10,
  },
});
