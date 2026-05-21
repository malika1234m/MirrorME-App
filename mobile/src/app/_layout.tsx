import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@store/authStore";
import { Colors } from "@constants/colors";
import { LoadingSpinner } from "@components/ui/LoadingSpinner";

export default function RootLayout() {
  const { loadUser, isLoading, isAuthenticated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/onboarding");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

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
      </Stack>

      {/* Loading overlay sits on top of the Stack so navigator always mounts */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner fullScreen />
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
});
