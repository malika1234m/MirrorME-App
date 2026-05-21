import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@store/authStore";
import { authService } from "@services/authService";
import { useImagePicker } from "@hooks/useImagePicker";
import { Avatar } from "@components/ui/Avatar";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const { image, pickFromGallery, pickFromCamera } = useImagePicker();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarPress = () =>
    Alert.alert("Change Photo", "Choose source", [
      { text: "Camera", onPress: pickFromCamera },
      { text: "Photo Library", onPress: pickFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);

  const handleSave = async () => {
    if (!username.trim()) { Alert.alert("Username cannot be empty"); return; }
    setIsSaving(true);
    try {
      const form = new FormData();
      if (displayName.trim()) form.append("displayName", displayName.trim());
      form.append("bio", bio.trim());
      if (username.trim() !== user?.username) form.append("username", username.trim());
      if (image) form.append("avatar", { uri: image.uri, type: image.type, name: image.name } as never);
      const res = await authService.updateProfile(form);
      if (res.data) updateUser(res.data);
      router.back();
    } catch (err: unknown) {
      Alert.alert("Save Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.navBtn, styles.saveBtn]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Avatar */}
          <TouchableOpacity style={styles.avatarSection} onPress={handleAvatarPress} activeOpacity={0.8}>
            <View style={styles.avatarWrap}>
              <Avatar uri={image?.uri ?? user?.avatarUrl} name={user?.displayName ?? user?.username} size={90} />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color={Colors.white} />
              </View>
            </View>
            <Text style={styles.changeText}>Change Photo</Text>
          </TouchableOpacity>

          {/* Fields */}
          <View style={styles.fields}>
            <FieldRow label="Display Name">
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={Colors.text.tertiary}
                selectionColor={Colors.primary}
              />
            </FieldRow>
            <FieldRow label="Username">
              <View style={styles.usernameRow}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  placeholderTextColor={Colors.text.tertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={Colors.primary}
                />
              </View>
            </FieldRow>
            <FieldRow label="Bio">
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={(t) => { if (t.length <= 150) setBio(t); }}
                placeholder="Tell the world about your style..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                selectionColor={Colors.primary}
              />
              <Text style={styles.charCount}>{bio.length}/150</Text>
            </FieldRow>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldBox}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  nav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  navTitle: { ...Typography.title3, color: Colors.text.primary },
  saveBtn: { backgroundColor: Colors.primarySubtle, borderColor: `${Colors.primary}40` },
  saveBtnText: { color: Colors.primary, ...Typography.label, fontWeight: "700" },
  avatarSection: { alignItems: "center", paddingVertical: 28 },
  avatarWrap: { position: "relative" },
  cameraBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.background,
    alignItems: "center", justifyContent: "center",
  },
  changeText: { color: Colors.primary, ...Typography.label, marginTop: 10 },
  fields: { paddingHorizontal: Spacing.lg, gap: 4 },
  fieldRow: {
    paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  fieldLabel: {
    ...Typography.caption, color: Colors.text.tertiary,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, fontWeight: "700",
  },
  fieldBox: {},
  input: { color: Colors.text.primary, ...Typography.body, paddingVertical: 0 },
  bioInput: { minHeight: 64, lineHeight: 22 },
  usernameRow: { flexDirection: "row", alignItems: "center" },
  atSymbol: { color: Colors.text.tertiary, ...Typography.body, marginRight: 2 },
  charCount: { color: Colors.text.tertiary, ...Typography.caption, textAlign: "right", marginTop: 6 },
});
