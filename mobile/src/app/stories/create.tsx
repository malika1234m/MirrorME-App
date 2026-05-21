import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, Radius } from "@constants/colors";
import { useImagePicker } from "@hooks/useImagePicker";
import { storyService } from "@services/storyService";

export default function StoryCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { image, pickFromGallery, pickFromCamera } = useImagePicker();
  const [caption, setCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const handleSource = () =>
    Alert.alert("Add to Story", "Choose source", [
      { text: "Camera", onPress: pickFromCamera },
      { text: "Photo Library", onPress: pickFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);

  const handlePost = async () => {
    if (!image) { Alert.alert("Pick a photo first"); return; }
    setIsPosting(true);
    try {
      const form = new FormData();
      form.append("image", { uri: image.uri, type: image.type, name: image.name } as never);
      if (caption.trim()) form.append("caption", caption.trim());
      await storyService.createStory(form);
      router.back();
    } catch (err: unknown) {
      Alert.alert("Failed to post", err instanceof Error ? err.message : "Please try again");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Full-screen image preview */}
      {image ? (
        <Image source={{ uri: image.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <LinearGradient colors={["#0F0F0F", "#1A1A1A"]} style={StyleSheet.absoluteFill} />
      )}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>New Story</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleSource}>
          <Ionicons name="images-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Pick prompt if no image */}
      {!image && (
        <TouchableOpacity style={styles.pickArea} onPress={handleSource} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.primarySubtle, "transparent"]} style={styles.pickIcon}>
            <Ionicons name="camera" size={44} color={Colors.primary} />
          </LinearGradient>
          <Text style={styles.pickTitle}>Add a photo</Text>
          <Text style={styles.pickSub}>Camera or gallery · 24 hour story</Text>
        </TouchableOpacity>
      )}

      {/* Bottom: caption + post */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.bottomWrap}
      >
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
          {image && (
            <BlurView intensity={60} tint="dark" style={styles.captionRow}>
              <Ionicons name="text" size={16} color="rgba(255,255,255,0.6)" />
              <TextInput
                style={styles.captionInput}
                value={caption}
                onChangeText={(t) => { if (t.length <= 80) setCaption(t); }}
                placeholder="Add a caption…"
                placeholderTextColor="rgba(255,255,255,0.4)"
                selectionColor={Colors.primary}
                maxLength={80}
              />
            </BlurView>
          )}

          <TouchableOpacity
            style={[styles.postBtn, !image && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={!image || isPosting}
            activeOpacity={0.85}
          >
            {isPosting ? (
              <ActivityIndicator color={Colors.background} size="small" />
            ) : (
              <>
                <LinearGradient
                  colors={Colors.gradient.primary}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.postBtnText}>Share Story</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.background} />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>Visible to your followers for 24 hours</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  topTitle: { ...Typography.title3, color: Colors.white },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  pickArea: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  pickIcon: { width: 100, height: 100, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  pickTitle: { ...Typography.title2, color: Colors.white },
  pickSub: { ...Typography.body, color: "rgba(255,255,255,0.5)", textAlign: "center" },
  bottomWrap: { position: "absolute", bottom: 0, left: 0, right: 0 },
  bottom: { paddingHorizontal: Spacing.lg, gap: 10 },
  captionRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: Radius.xl, overflow: "hidden",
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  captionInput: { flex: 1, color: Colors.white, ...Typography.body },
  postBtn: {
    height: 54, borderRadius: Radius.xl, overflow: "hidden",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { ...Typography.labelLarge, color: Colors.background, fontWeight: "800" },
  hint: { ...Typography.caption, color: "rgba(255,255,255,0.35)", textAlign: "center" },
});
