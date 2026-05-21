import React, { useState } from "react";
import {
  View, Text, Image, TextInput, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView,
  Platform, StyleSheet, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { Button } from "@components/ui/Button";
import { Tag } from "@components/ui/Tag";
import { useImagePicker } from "@hooks/useImagePicker";
import { postService } from "@services/postService";
import { useFeedStore } from "@store/feedStore";
import { MAX_CAPTION_LENGTH } from "@constants/config";

const { width: W } = Dimensions.get("window");

export default function UploadScreen() {
  const router = useRouter();
  const addPost = useFeedStore((s) => s.addPost);
  const { image, pickFromGallery, pickFromCamera, clearImage } = useImagePicker();
  const [caption, setCaption] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags((prev) => [...prev, t]);
      setTagInput("");
    }
  };

  const handleSource = () => {
    Alert.alert("Add Photo", "Choose source", [
      { text: "Camera", onPress: pickFromCamera },
      { text: "Photo Library", onPress: pickFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleUpload = async () => {
    if (!image) { Alert.alert("Select a photo first"); return; }
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("image", { uri: image.uri, type: image.type, name: image.name } as never);
      if (caption) form.append("caption", caption);
      form.append("tags", JSON.stringify(tags));
      form.append("isPublic", String(isPublic));
      const res = await postService.createPost(form);
      if (res.data) addPost(res.data);
      Alert.alert("Posted!", "Your outfit is live. AI analysis is running.", [
        { text: "View Feed", onPress: () => router.replace("/(tabs)") },
      ]);
      clearImage(); setCaption(""); setTags([]);
    } catch (err: unknown) {
      Alert.alert("Upload Failed", err instanceof Error ? err.message : "Try again");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>New Post</Text>
            {image && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearImage}>
                <Ionicons name="close" size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Image Area */}
          {!image ? (
            <TouchableOpacity style={styles.picker} onPress={handleSource} activeOpacity={0.85}>
              <LinearGradient
                colors={["#161616", "#111111"]}
                style={StyleSheet.absoluteFill}
              />
              {/* Dashed border */}
              <View style={styles.pickerBorder}>
                <LinearGradient
                  colors={[`${Colors.primary}50`, `${Colors.accentBlue}50`, `${Colors.accent}50`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.pickerBorderGradient}
                />
                <View style={styles.pickerContent}>
                  <View style={styles.pickerIcon}>
                    <Ionicons name="camera" size={34} color={Colors.primary} />
                  </View>
                  <Text style={styles.pickerTitle}>Add Your Outfit</Text>
                  <Text style={styles.pickerSubtitle}>Tap to choose from camera or gallery</Text>
                  <View style={styles.aiHint}>
                    <Ionicons name="sparkles" size={13} color={Colors.primary} />
                    <Text style={styles.aiHintText}>AI will auto-analyze clothing, colors & style</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.previewContainer}>
              <Image source={{ uri: image.uri }} style={styles.preview} />
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.previewGrad} />
              <TouchableOpacity style={styles.changeBtn} onPress={handleSource} activeOpacity={0.85}>
                <BlurView intensity={60} tint="dark" style={styles.changeBtnBlur}>
                  <Ionicons name="camera-outline" size={16} color={Colors.white} />
                  <Text style={styles.changeBtnText}>Change</Text>
                </BlurView>
              </TouchableOpacity>

              {/* AI badge */}
              <View style={styles.previewAiBadge}>
                <Ionicons name="sparkles" size={12} color={Colors.primary} />
                <Text style={styles.previewAiText}>AI analysis will run after posting</Text>
              </View>
            </View>
          )}

          {/* Caption */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Caption</Text>
            <View style={styles.captionBox}>
              <TextInput
                style={styles.captionInput}
                value={caption}
                onChangeText={setCaption}
                placeholder="Describe your outfit, inspo, mood..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
                maxLength={MAX_CAPTION_LENGTH}
              />
              <Text style={styles.charCount}>{caption.length}/{MAX_CAPTION_LENGTH}</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <View style={styles.tagInputRow}>
              <View style={styles.tagInputBox}>
                <Text style={styles.hashSymbol}>#</Text>
                <TextInput
                  style={styles.tagInput}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  placeholder="streetwear, y2k, casual..."
                  placeholderTextColor={Colors.text.tertiary}
                  returnKeyType="done"
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity style={styles.addTagBtn} onPress={addTag} activeOpacity={0.85}>
                <Ionicons name="add" size={22} color={Colors.background} />
              </TouchableOpacity>
            </View>
            {tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tags.map((t, i) => (
                  <Tag
                    key={i}
                    label={`#${t}`}
                    color={Colors.accentBlue}
                    onPress={() => setTags((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Privacy */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Visibility</Text>
            <View style={styles.privacyRow}>
              {[{ label: "Public", value: true }, { label: "Followers", value: false }].map(({ label, value }) => {
                const active = isPublic === value;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.privacyOpt, active && styles.privacyOptActive]}
                    onPress={() => setIsPublic(value)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={value ? "globe-outline" : "people-outline"}
                      size={16}
                      color={active ? Colors.primary : Colors.text.tertiary}
                    />
                    <Text style={[styles.privacyText, active && { color: Colors.primary }]}>{label}</Text>
                    {active && <View style={styles.selectedDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* AI Info Banner */}
          <View style={styles.aiBanner}>
            <LinearGradient
              colors={[Colors.primarySubtle, "transparent"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="sparkles" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.aiBannerTitle}>AI Style Analysis Included</Text>
              <Text style={styles.aiBannerSubtext}>
                Clothing detection · Color palette · Style tags · Stylist tips
              </Text>
            </View>
          </View>

          {/* Submit */}
          <View style={styles.submitRow}>
            <Button
              title={isUploading ? "Uploading..." : "Post Outfit"}
              fullWidth
              gradient
              isLoading={isUploading}
              onPress={handleUpload}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  title: { ...Typography.title2, color: Colors.text.primary },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  picker: {
    marginHorizontal: Spacing.lg,
    height: 280,
    borderRadius: Radius.xxl,
    overflow: "hidden",
    marginBottom: Spacing.xxl,
  },
  pickerBorder: {
    flex: 1,
    margin: 2,
    borderRadius: Radius.xl,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerBorderGradient: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  pickerContent: {
    alignItems: "center",
    gap: 10,
    padding: Spacing.xxl,
  },
  pickerIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primarySubtle,
    borderWidth: 1.5,
    borderColor: `${Colors.primary}40`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  pickerTitle: { ...Typography.title3, color: Colors.text.primary },
  pickerSubtitle: { ...Typography.body, color: Colors.text.secondary, textAlign: "center" },
  aiHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primarySubtle,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 4,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
  },
  aiHintText: { color: Colors.primary, ...Typography.caption },
  previewContainer: { marginHorizontal: 0, marginBottom: Spacing.xxl },
  preview: { width: W, height: W * 1.1, resizeMode: "cover" },
  previewGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 120 },
  changeBtn: { position: "absolute", bottom: 14, right: 14, borderRadius: Radius.full, overflow: "hidden" },
  changeBtnBlur: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  changeBtnText: { color: Colors.white, ...Typography.label },
  previewAiBadge: {
    position: "absolute",
    bottom: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  previewAiText: { color: Colors.primary, ...Typography.caption },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xxl },
  sectionLabel: {
    color: Colors.text.tertiary,
    ...Typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    fontWeight: "700",
  },
  captionBox: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  captionInput: {
    color: Colors.text.primary,
    ...Typography.body,
    minHeight: 72,
    textAlignVertical: "top",
  },
  charCount: { color: Colors.text.tertiary, ...Typography.caption, textAlign: "right", marginTop: 6 },
  tagInputRow: { flexDirection: "row", gap: 10 },
  tagInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
  },
  hashSymbol: { color: Colors.primary, ...Typography.bodyLarge, fontWeight: "700", marginRight: 4 },
  tagInput: { flex: 1, color: Colors.text.primary, ...Typography.body },
  addTagBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 },
  privacyRow: { flexDirection: "row", gap: 10 },
  privacyOpt: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  privacyOptActive: {
    borderColor: `${Colors.primary}60`,
    backgroundColor: Colors.primarySubtle,
  },
  privacyText: { ...Typography.label, color: Colors.text.secondary, flex: 1 },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: `${Colors.primary}25`,
    overflow: "hidden",
  },
  aiBannerTitle: { ...Typography.label, color: Colors.primary, marginBottom: 3 },
  aiBannerSubtext: { ...Typography.caption, color: Colors.text.secondary },
  submitRow: { paddingHorizontal: Spacing.lg },
});
