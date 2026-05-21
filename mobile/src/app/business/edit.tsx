import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { businessService } from "@services/businessService";
import { Business } from "@types/index";

const CATEGORIES = [
  "Minimalist", "Streetwear", "Old Money", "Sustainable",
  "Luxury", "Boho", "Y2K", "Athleisure", "Preppy", "Dark Academia",
];

export default function BusinessEditScreen() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoadingBiz, setIsLoadingBiz] = useState(true);

  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [location, setLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    businessService.getMe()
      .then((res) => {
        if (res.data) {
          const b = res.data;
          setBusiness(b);
          setBrandName(b.brandName);
          setCategory(b.category);
          setBio(b.bio ?? "");
          setWebsite(b.website ?? "");
          setInstagram(b.instagram ?? "");
          setLocation(b.location ?? "");
        }
      })
      .catch(() => Alert.alert("Error", "Could not load brand info"))
      .finally(() => setIsLoadingBiz(false));
  }, []);

  const handleRequestVerification = async () => {
    Alert.alert(
      "Request Verification",
      "Submit your brand for review by the MirrorME team. Make sure your brand page is complete before requesting.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit Request",
          onPress: async () => {
            try {
              await businessService.requestVerification();
              setBusiness((prev) => prev ? { ...prev, verificationStatus: "pending" } : prev);
              Alert.alert("Request Submitted", "The MirrorME team will review your brand. You will be notified once approved.");
            } catch (err: unknown) {
              Alert.alert("Error", err instanceof Error ? err.message : "Try again");
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!brandName.trim()) { Alert.alert("Brand name is required"); return; }
    if (!category) { Alert.alert("Select a category"); return; }
    setIsSaving(true);
    try {
      const form = new FormData();
      form.append("brandName", brandName.trim());
      form.append("category", category);
      form.append("bio", bio);
      form.append("website", website);
      form.append("instagram", instagram);
      form.append("location", location);
      await businessService.update(form);
      Alert.alert("Saved!", "Your brand page has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Please try again");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingBiz) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.nav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Edit Brand Page</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Brand Page</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Verified status */}
          {business?.isVerified && (
            <View style={styles.verifiedBanner}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={styles.verifiedText}>Your brand is verified by MirrorME</Text>
            </View>
          )}

          <View style={styles.fields}>
            <Field label="Brand Name *">
              <TextInput
                style={styles.input}
                value={brandName}
                onChangeText={setBrandName}
                placeholder="e.g. Studio NOMO"
                placeholderTextColor={Colors.text.tertiary}
                selectionColor={Colors.primary}
              />
            </Field>

            <Field label="Category *">
              <View style={styles.catGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, category === cat && styles.catChipActive]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.8}
                  >
                    {category === cat && (
                      <LinearGradient colors={Colors.gradient.primary} style={StyleSheet.absoluteFill} />
                    )}
                    <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>

            <Field label="Bio">
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={(t) => { if (t.length <= 160) setBio(t); }}
                placeholder="Describe your brand's style and story..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                selectionColor={Colors.primary}
              />
              <Text style={styles.charCount}>{bio.length}/160</Text>
            </Field>

            <Field label="Website">
              <TextInput
                style={styles.input}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yourbrand.com"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="url"
                autoCapitalize="none"
                selectionColor={Colors.primary}
              />
            </Field>

            <Field label="Instagram">
              <View style={styles.prefixRow}>
                <Text style={styles.prefix}>@</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={instagram}
                  onChangeText={setInstagram}
                  placeholder="yourbrand"
                  placeholderTextColor={Colors.text.tertiary}
                  autoCapitalize="none"
                  selectionColor={Colors.primary}
                />
              </View>
            </Field>

            <Field label="Location">
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City, Country"
                placeholderTextColor={Colors.text.tertiary}
                selectionColor={Colors.primary}
              />
            </Field>
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.gradient.primary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveBtnInner}
            >
              {isSaving
                ? <ActivityIndicator color={Colors.background} size="small" />
                : <>
                    <Ionicons name="checkmark" size={18} color={Colors.background} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>}
            </LinearGradient>
          </TouchableOpacity>

          {/* Verification request */}
          {business && !business.isVerified && (
            <View style={styles.verificationBox}>
              {business.verificationStatus === "pending" ? (
                <View style={styles.verificationPending}>
                  <Ionicons name="time-outline" size={18} color={Colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verificationPendingTitle}>Verification Under Review</Text>
                    <Text style={styles.verificationPendingSub}>The MirrorME team will review your brand soon</Text>
                  </View>
                </View>
              ) : business.verificationStatus === "rejected" ? (
                <View style={styles.verificationPending}>
                  <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.verificationPendingTitle, { color: Colors.error }]}>Verification Declined</Text>
                    <Text style={styles.verificationPendingSub}>You can request again after updating your brand</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.verificationRequestBtn}
                  onPress={handleRequestVerification}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={[Colors.primarySubtle, "transparent"]} style={StyleSheet.absoluteFill} />
                  <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verificationRequestTitle}>Request Verification</Text>
                    <Text style={styles.verificationRequestSub}>Get a verified badge and appear higher in match results</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Quick links */}
          <View style={styles.quickLinks}>
            <TouchableOpacity
              style={styles.quickLinkBtn}
              onPress={() => router.push("/business/product-new")}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.quickLinkText}>Add New Product</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.text.tertiary} />
            </TouchableOpacity>
            {business && (
              <TouchableOpacity
                style={styles.quickLinkBtn}
                onPress={() => router.push(`/business/${business.id}`)}
                activeOpacity={0.8}
              >
                <Ionicons name="eye-outline" size={18} color={Colors.text.secondary} />
                <Text style={[styles.quickLinkText, { color: Colors.text.secondary }]}>View Public Brand Page</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
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
  verifiedBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: Spacing.lg, marginTop: 16,
    backgroundColor: Colors.primarySubtle, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    borderWidth: 1, borderColor: `${Colors.primary}30`,
  },
  verifiedText: { ...Typography.label, color: Colors.primary },
  fields: { paddingHorizontal: Spacing.lg, paddingTop: 24, gap: 20 },
  field: { gap: 10 },
  fieldLabel: {
    ...Typography.caption, color: Colors.text.tertiary,
    textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "700",
  },
  input: {
    color: Colors.text.primary, ...Typography.body,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: 13,
  },
  bioInput: { minHeight: 80, lineHeight: 22 },
  charCount: { ...Typography.caption, color: Colors.text.tertiary, textAlign: "right" },
  prefixRow: { flexDirection: "row", alignItems: "center" },
  prefix: { color: Colors.text.tertiary, ...Typography.body, paddingLeft: Spacing.lg },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  catChipActive: { borderColor: "transparent" },
  catChipText: { color: Colors.text.secondary, ...Typography.label },
  catChipTextActive: { color: Colors.background, fontWeight: "700" },
  saveBtn: {
    marginHorizontal: Spacing.lg, marginTop: 28,
    borderRadius: Radius.xl, overflow: "hidden",
  },
  saveBtnInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16,
  },
  saveBtnText: { ...Typography.labelLarge, color: Colors.background, fontWeight: "800" },
  verificationBox: { marginHorizontal: Spacing.lg, marginTop: 20 },
  verificationRequestBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: Spacing.lg, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: `${Colors.primary}30`, overflow: "hidden",
  },
  verificationRequestTitle: { ...Typography.labelLarge, color: Colors.primary },
  verificationRequestSub: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
  verificationPending: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: Spacing.lg, borderRadius: Radius.xl,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  verificationPendingTitle: { ...Typography.labelLarge, color: Colors.warning },
  verificationPendingSub: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
  quickLinks: {
    marginHorizontal: Spacing.lg, marginTop: 16,
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  quickLinkBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  quickLinkText: { flex: 1, ...Typography.label, color: Colors.primary },
});
