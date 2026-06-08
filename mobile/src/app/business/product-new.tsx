import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { businessService } from "@services/businessService";
import { useImagePicker } from "@hooks/useImagePicker";

const FASHION_STYLES = [
  "Minimalist", "Streetwear", "Old Money", "Sustainable",
  "Luxury", "Boho", "Y2K", "Athleisure", "Preppy", "Dark Academia",
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size", "Free Size"];
const SEASONS = ["Spring", "Summer", "Fall", "Winter", "All Season"];
const OCCASIONS = ["Casual", "Formal", "Work", "Party", "Sport", "Evening", "Beach"];

export default function NewProductScreen() {
  const router = useRouter();
  const { image, pickFromGallery, pickFromCamera, clearImage } = useImagePicker();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [shopLink, setShopLink] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedOccasion, setSelectedOccasion] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const toggleStyle = (s: string) =>
    setSelectedStyles((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const toggleSize = (s: string) =>
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handlePickSource = () =>
    Alert.alert("Product Photo", "Choose source", [
      { text: "Camera", onPress: pickFromCamera },
      { text: "Photo Library", onPress: pickFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);

  const handleUpload = async () => {
    if (!image) { Alert.alert("Add a photo first"); return; }
    if (!title.trim()) { Alert.alert("Product title is required"); return; }

    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("image", { uri: image.uri, type: image.type, name: image.name } as never);
      form.append("title", title.trim());
      if (description.trim()) form.append("description", description.trim());
      if (price.trim()) form.append("price", price.trim());
      if (shopLink.trim()) form.append("shopLink", shopLink.trim());
      if (selectedStyles.length) form.append("fashionStyles", JSON.stringify(selectedStyles));
      if (selectedSizes.length) form.append("sizes", JSON.stringify(selectedSizes));
      if (selectedSeason) form.append("season", selectedSeason);
      if (selectedOccasion) form.append("occasion", selectedOccasion);

      await businessService.createProduct(form);

      Alert.alert("Product Added!", "Your item is now live on your brand page. AI matching is running in the background.", [
        { text: "Add Another", onPress: () => { clearImage(); setTitle(""); setDescription(""); setPrice(""); setShopLink(""); setSelectedStyles([]); setSelectedSizes([]); setSelectedSeason(""); setSelectedOccasion(""); } },
        { text: "Back to Brand", onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      Alert.alert("Upload Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Add Product</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          {/* Photo picker */}
          {!image ? (
            <TouchableOpacity style={styles.picker} onPress={handlePickSource} activeOpacity={0.85}>
              <LinearGradient colors={[`${Colors.primary}12`, Colors.card]} style={StyleSheet.absoluteFill} />
              <View style={styles.pickerBorder}>
                <LinearGradient
                  colors={[`${Colors.primary}50`, `${Colors.accentBlue}50`]}
                  style={styles.pickerBorderGrad}
                />
                <View style={styles.pickerContent}>
                  <View style={styles.pickerIcon}>
                    <Ionicons name="shirt" size={32} color={Colors.primary} />
                  </View>
                  <Text style={styles.pickerTitle}>Add Product Photo</Text>
                  <Text style={styles.pickerSub}>High quality photos get more clicks</Text>
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={12} color={Colors.primary} />
                    <Text style={styles.aiBadgeText}>AI will auto-tag style & generate match embedding</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.previewWrap}>
              <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
              <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={styles.previewGrad} />
              <TouchableOpacity style={styles.changeBtn} onPress={handlePickSource}>
                <BlurView intensity={60} tint="dark" style={styles.changeBtnInner}>
                  <Ionicons name="camera-outline" size={14} color={Colors.white} />
                  <Text style={styles.changeBtnText}>Change</Text>
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={clearImage}>
                <Ionicons name="close" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.form}>

            {/* Title */}
            <Field label="Product Title *">
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Oversized Linen Blazer"
                placeholderTextColor={Colors.text.tertiary}
                selectionColor={Colors.primary}
              />
            </Field>

            {/* Description */}
            <Field label="Description">
              <TextInput
                style={[styles.input, styles.multiInput]}
                value={description}
                onChangeText={(t) => { if (t.length <= 300) setDescription(t); }}
                placeholder="Material, fit, care instructions..."
                placeholderTextColor={Colors.text.tertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                selectionColor={Colors.primary}
              />
              <Text style={styles.charCount}>{description.length}/300</Text>
            </Field>

            {/* Price */}
            <Field label="Price (USD)">
              <View style={styles.prefixRow}>
                <Text style={styles.prefix}>$</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="decimal-pad"
                  selectionColor={Colors.primary}
                />
              </View>
            </Field>

            {/* Shop Link */}
            <Field label="Shop Link">
              <TextInput
                style={styles.input}
                value={shopLink}
                onChangeText={setShopLink}
                placeholder="https://yourbrand.com/product"
                placeholderTextColor={Colors.text.tertiary}
                keyboardType="url"
                autoCapitalize="none"
                selectionColor={Colors.primary}
              />
            </Field>

            {/* Fashion Styles */}
            <Field label="Fashion Styles">
              <View style={styles.chips}>
                {FASHION_STYLES.map((s) => {
                  const active = selectedStyles.includes(s);
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleStyle(s)}
                      activeOpacity={0.8}
                    >
                      {active && <LinearGradient colors={Colors.gradient.primary} style={StyleSheet.absoluteFill} />}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            {/* Sizes */}
            <Field label="Available Sizes">
              <View style={styles.chips}>
                {SIZES.map((s) => {
                  const active = selectedSizes.includes(s);
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleSize(s)}
                      activeOpacity={0.8}
                    >
                      {active && <LinearGradient colors={Colors.gradient.primary} style={StyleSheet.absoluteFill} />}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            {/* Season */}
            <Field label="Season">
              <View style={styles.chips}>
                {SEASONS.map((s) => {
                  const active = selectedSeason === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedSeason(active ? "" : s)}
                      activeOpacity={0.8}
                    >
                      {active && <LinearGradient colors={Colors.gradient.primary} style={StyleSheet.absoluteFill} />}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            {/* Occasion */}
            <Field label="Occasion">
              <View style={styles.chips}>
                {OCCASIONS.map((o) => {
                  const active = selectedOccasion === o;
                  return (
                    <TouchableOpacity
                      key={o}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedOccasion(active ? "" : o)}
                      activeOpacity={0.8}
                    >
                      {active && <LinearGradient colors={Colors.gradient.primary} style={StyleSheet.absoluteFill} />}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{o}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

          </View>

          {/* AI hint */}
          <View style={styles.aiBanner}>
            <LinearGradient colors={[Colors.primarySubtle, "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Ionicons name="sparkles" size={18} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.aiBannerTitle}>AI Match Embedding</Text>
              <Text style={styles.aiBannerSub}>Your product will be embedded and matched to users' style photos automatically</Text>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleUpload}
            disabled={isUploading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Colors.gradient.primary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.submitBtnInner}
            >
              {isUploading
                ? <ActivityIndicator color={Colors.background} size="small" />
                : <>
                    <Ionicons name="cloud-upload-outline" size={18} color={Colors.background} />
                    <Text style={styles.submitBtnText}>Add to Brand Page</Text>
                  </>}
            </LinearGradient>
          </TouchableOpacity>

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

  /* Photo picker */
  picker: {
    margin: Spacing.lg, height: 220,
    borderRadius: Radius.xxl, overflow: "hidden",
  },
  pickerBorder: {
    flex: 1, margin: 2, borderRadius: Radius.xl,
    overflow: "hidden", alignItems: "center", justifyContent: "center",
  },
  pickerBorderGrad: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
  pickerContent: { alignItems: "center", gap: 8, padding: Spacing.xl },
  pickerIcon: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: Colors.primarySubtle, borderWidth: 1.5, borderColor: `${Colors.primary}40`,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  pickerTitle: { ...Typography.title3, color: Colors.text.primary },
  pickerSub: { ...Typography.body, color: Colors.text.secondary, textAlign: "center" },
  aiBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.primarySubtle, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6, marginTop: 4,
    borderWidth: 1, borderColor: `${Colors.primary}25`,
  },
  aiBadgeText: { color: Colors.primary, ...Typography.caption },

  /* Preview */
  previewWrap: { aspectRatio: 1 / 0.85, position: "relative" },
  preview: { width: "100%", height: "100%" },
  previewGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 100 },
  changeBtn: {
    position: "absolute", bottom: 14, right: 14,
    borderRadius: Radius.full, overflow: "hidden",
  },
  changeBtnInner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  changeBtnText: { color: Colors.white, ...Typography.label },
  removeBtn: {
    position: "absolute", top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center",
  },

  /* Form */
  form: { paddingHorizontal: Spacing.lg, paddingTop: 8, gap: 22 },
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
  multiInput: { minHeight: 80, lineHeight: 22 },
  charCount: { ...Typography.caption, color: Colors.text.tertiary, textAlign: "right" },
  prefixRow: { flexDirection: "row", alignItems: "center" },
  prefix: { color: Colors.text.tertiary, ...Typography.body, paddingLeft: Spacing.lg },

  /* Chips */
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
  },
  chipActive: { borderColor: "transparent" },
  chipText: { color: Colors.text.secondary, ...Typography.label },
  chipTextActive: { color: Colors.background, fontWeight: "700" },

  /* AI banner */
  aiBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: Spacing.lg, marginTop: 24,
    padding: Spacing.lg, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: `${Colors.primary}25`, overflow: "hidden",
  },
  aiBannerTitle: { ...Typography.label, color: Colors.primary, marginBottom: 3 },
  aiBannerSub: { ...Typography.caption, color: Colors.text.secondary },

  /* Submit */
  submitBtn: {
    marginHorizontal: Spacing.lg, marginTop: 20,
    borderRadius: Radius.xl, overflow: "hidden",
  },
  submitBtnInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16,
  },
  submitBtnText: { ...Typography.labelLarge, color: Colors.background, fontWeight: "800" },
});
