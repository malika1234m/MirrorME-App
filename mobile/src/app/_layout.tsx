import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@store/authStore";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { LoadingSpinner } from "@components/ui/LoadingSpinner";
import { Logo } from "@components/ui/Logo";
import { api } from "@services/api";

const APP_VERSION = "1.0.0"; // must match app.json version

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0) ? 1 : -1;
  return 0;
}

export default function RootLayout() {
  const { loadUser, isLoading, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [updateRequired, setUpdateRequired] = useState(false);

  useEffect(() => {
    loadUser();
    // Check if app needs update
    api.get<{ minClientVersion: string }>("/version")
      .then((data) => {
        if (compareVersions(APP_VERSION, data.minClientVersion) < 0) setUpdateRequired(true);
      })
      .catch(() => {}); // silent — don't block app if version check fails
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/onboarding");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  // Forced update screen
  if (updateRequired) {
    return (
      <View style={styles.updateScreen}>
        <Logo size="md" style={styles.updateLogo} />
        <Text style={styles.updateTitle}>Update Required</Text>
        <Text style={styles.updateSub}>A new version of MirrorME is available. Please update to continue.</Text>
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={() => Linking.openURL("https://apps.apple.com/app/mirrorme")}
          activeOpacity={0.85}
        >
          <Text style={styles.updateBtnText}>Update Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        <Stack.Screen
          name="post/[id]"
          options={{ presentation: "card", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="profile/[id]"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/edit"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="stories/viewer"
          options={{ presentation: "fullScreenModal", animation: "fade", gestureEnabled: true, gestureDirection: "vertical" }}
        />
        <Stack.Screen
          name="stories/create"
          options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="business/[id]"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="business/register"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="business/edit"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="business/product-new"
          options={{ presentation: "card", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="match/index"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="notifications"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="admin/index"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="wardrobe/try-on"
          options={{ presentation: "fullScreenModal", animation: "slide_from_bottom", gestureEnabled: true, gestureDirection: "vertical" }}
        />
        <Stack.Screen
          name="(auth)/forgot-password"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="legal"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
      </Stack>

      {/* Loading overlay sits on top of the Stack so navigator always mounts */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Logo size="md" withTagline style={styles.loadingLogo} />
          <LoadingSpinner />
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLogo: { marginBottom: Spacing.xxl },
  updateScreen: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: "center", justifyContent: "center", padding: Spacing.xxl, gap: 16,
  },
  updateLogo: { marginBottom: 8 },
  updateTitle: { ...Typography.title1, color: Colors.text.primary, textAlign: "center" },
  updateSub: { ...Typography.body, color: Colors.text.secondary, textAlign: "center", lineHeight: 24 },
  updateBtn: {
    marginTop: 8, backgroundColor: Colors.primary,
    borderRadius: Radius.xl, paddingHorizontal: 32, paddingVertical: 14,
  },
  updateBtnText: { color: Colors.background, ...Typography.labelLarge, fontWeight: "800" },
});
