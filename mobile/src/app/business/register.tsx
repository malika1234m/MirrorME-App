import React, { useState } from "react";
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

const CATEGORIES = [
  "Minimalist", "Streetwear", "Old Money", "Sustainable",
  "Luxury", "Boho", "Y2K", "Athleisure", "Preppy", "Dark Academia",
];

export default function BusinessRegisterScreen() {
  const router = useRouter();
  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!brandName.trim()) { Alert.alert("Brand name is required"); return; }
    if (!category) { Alert.alert("Select a category"); return; }
    setIsLoading(true);
    try {
      await businessService.register({
        brandName: brandName.trim(), category, bio, website, instagram, location,
      });
      Alert.alert("Brand Created!", "Your business page is live. Start uploading your designs.", [
        { text: "Go to Dashboard", onPress: () => router.replace("/(tabs)/profile") },
      ]);
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Create Brand Page</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient colors={[Colors.primarySubtle, "transparent"]} style={styles.heroIcon}>
              <Ionicons name="storefront" size={36} color={Colors.primary} />
            </LinearGradient>
            <Text style={styles.heroTitle}>Put your brand on MirrorME</Text>
            <Text style={styles.heroSub}>
              Users match their style photos against your catalog.{"\n"}
              Get discovered by people who already love your aesthetic.
            </Text>
          </View>

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
            style={styles.createBtn}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.gradient.primary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.createBtnInner}
            >
              {isLoading
                ? <ActivityIndicator color={Colors.background} size="small" />
                : <>
                    <Ionicons name="storefront-outline" size={18} color={Colors.background} />
                    <Text style={styles.createBtnText}>Create Brand Page</Text>
                  </>}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Your brand page will be reviewed and verified by the MirrorME team.
            Verified brands appear higher in match results.
          </Text>
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
  hero: { alignItems: "center", padding: Spacing.xl, gap: 12 },
  heroIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  heroTitle: { ...Typography.title2, color: Colors.text.primary, textAlign: "center" },
  heroSub: { ...Typography.body, color: Colors.text.secondary, textAlign: "center", lineHeight: 22 },
  fields: { paddingHorizontal: Spacing.lg, gap: 20 },
  field: { gap: 10 },
  fieldLabel: { ...Typography.caption, color: Colors.text.tertiary, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "700" },
  input: {
    color: Colors.text.primary, ...Typography.body,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: 13,
  },
  bioInput: { minHeight: 80, lineHeight: 22 },
  charCount: { ...Typography.caption, color: Colors.text.tertiary, textAlign: "right" },
  prefixRow: { flexDirection: "row", alignItems: "center", gap: 0 },
  prefix: { color: Colors.text.tertiary, ...Typography.body, paddingLeft: Spacing.lg },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, overflow: "hidden",
  },
  catChipActive: { borderColor: "transparent" },
  catChipText: { color: Colors.text.secondary, ...Typography.label },
  catChipTextActive: { color: Colors.background, fontWeight: "700" },
  createBtn: { marginHorizontal: Spacing.lg, marginTop: 28, borderRadius: Radius.xl, overflow: "hidden" },
  createBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  createBtnText: { ...Typography.labelLarge, color: Colors.background, fontWeight: "800" },
  disclaimer: { ...Typography.caption, color: Colors.text.tertiary, textAlign: "center", marginHorizontal: Spacing.xl, marginTop: 16, lineHeight: 18 },
});
