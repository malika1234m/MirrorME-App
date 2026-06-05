import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, Radius } from "@constants/colors";

const TERMS = `Last updated: June 2026

1. ACCEPTANCE OF TERMS
By using MirrorME you agree to these Terms of Service. If you do not agree, do not use the app.

2. USER ACCOUNTS
You must be 13 or older to use MirrorME. You are responsible for maintaining the security of your account credentials.

3. CONTENT
You retain ownership of content you post. By posting, you grant MirrorME a non-exclusive licence to display your content within the platform. You must not post content that is illegal, harmful, or infringes on others' rights.

4. AI FEATURES
MirrorME uses AI (OpenAI GPT-4o) to analyse outfit photos. AI suggestions are for style guidance only and are not professional advice.

5. VIRTUAL TRY-ON
The Virtual Mirror feature uses your device camera exclusively for body tracking. No camera data is transmitted to our servers.

6. INTELLECTUAL PROPERTY
MirrorME's brand, design, and code are the property of MirrorME Ltd. You may not copy or redistribute them.

7. TERMINATION
We may suspend or terminate accounts that violate these terms. You may delete your account at any time in Settings.

8. LIMITATION OF LIABILITY
MirrorME is provided "as is". We are not liable for any indirect or incidental damages arising from your use of the app.

9. CHANGES
We may update these terms. Continued use after notice constitutes acceptance.

Contact: legal@mirrorme.app`;

const PRIVACY = `Last updated: June 2026

WHAT WE COLLECT
• Account info: email, username, display name
• Profile content: photos, captions, tags you post
• Usage data: features you use, interactions (likes, ratings)
• Body measurements: height, weight, gender (only if you enter them for size recommendations)
• Device info: device type and OS version for debugging

WHAT WE DO NOT COLLECT
• Camera footage — the Virtual Mirror processes video entirely on your device; nothing is sent to our servers
• Location
• Contacts

HOW WE USE YOUR DATA
• To operate the app and personalise your feed
• To run AI outfit analysis on photos you upload
• To send transactional emails (password reset, welcome)

DATA SHARING
We do not sell your data. We share data only with:
• Cloudinary (image storage)
• OpenAI (outfit analysis — your uploaded images only)
• Our hosting provider (Railway/Render)

YOUR RIGHTS
You can: edit your profile, export your data (contact us), or permanently delete your account in Settings → Delete Account.

DATA RETENTION
Deleted accounts have all personal data removed within 30 days.

SECURITY
Passwords are hashed with bcrypt. Connections are encrypted with TLS.

Contact: privacy@mirrorme.app`;

export default function LegalScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Legal</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {(["terms", "privacy"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "terms" ? "Terms of Service" : "Privacy Policy"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.body}>{activeTab === "terms" ? TERMS : PRIVACY}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  title: { ...Typography.title3, color: Colors.text.primary },
  tabRow: {
    flexDirection: "row", margin: Spacing.lg, marginBottom: 0,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: 3,
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: Radius.md },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { ...Typography.label, color: Colors.text.secondary },
  tabTextActive: { color: Colors.background, fontWeight: "800" },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingTop: Spacing.xl },
  body: { ...Typography.body, color: Colors.text.secondary, lineHeight: 24 },
});
