import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { useAuthStore } from "@store/authStore";
import { isValidEmail, isValidPassword } from "@utils/validators";

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!isValidEmail(email)) errs.email = "Enter a valid email address";
    if (!isValidPassword(password)) errs.password = "Password must be at least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      Alert.alert("Sign In Failed", err instanceof Error ? err.message : "Please check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <View style={styles.hero}>
            <LinearGradient
              colors={["rgba(200,255,0,0.08)", "transparent"]}
              style={StyleSheet.absoluteFill}
            />
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>

            <View style={styles.logoRow}>
              <LinearGradient
                colors={Colors.gradient.accent}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.logoBox}
              >
                <Ionicons name="shirt" size={26} color={Colors.background} />
              </LinearGradient>
              <View>
                <Text style={styles.brandName}>MirrorME</Text>
                <Text style={styles.brandTagline}>AI Fashion Social</Text>
              </View>
            </View>

            <Text style={styles.heading}>Welcome{"\n"}back</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
              error={errors.email}
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.password}
              placeholder="Your password"
            />

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push("/(auth)/forgot-password" as any)}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              fullWidth
              gradient
              isLoading={isLoading}
              onPress={handleLogin}
              style={{ marginTop: 8 }}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Placeholders */}
            <View style={styles.socialRow}>
              <SocialButton icon="logo-google" label="Google" />
              <SocialButton icon="logo-apple" label="Apple" />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.footerLink}> Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const SocialButton = ({ icon, label }: { icon: string; label: string }) => (
  <TouchableOpacity
    style={styles.socialBtn}
    activeOpacity={0.8}
    onPress={() => Alert.alert(`${label} Sign In`, `${label} login is coming soon!`)}
  >
    <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={Colors.text.primary} />
    <Text style={styles.socialBtnText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  hero: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    minHeight: 240,
    justifyContent: "flex-end",
  },
  backBtn: {
    position: "absolute",
    top: 56,
    left: Spacing.xxl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.xl,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { ...Typography.title3, color: Colors.text.primary },
  brandTagline: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 1 },
  heading: { ...Typography.display, color: Colors.text.primary },
  formCard: {
    marginHorizontal: Spacing.xxl,
    backgroundColor: Colors.card,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  forgotBtn: { alignSelf: "flex-end", marginTop: -8, marginBottom: 16 },
  forgotText: { color: Colors.primary, ...Typography.labelSmall },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.text.tertiary, ...Typography.caption },
  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  socialBtnText: { color: Colors.text.primary, ...Typography.label },
  footer: { flexDirection: "row", justifyContent: "center", paddingBottom: 36 },
  footerText: { color: Colors.text.secondary, ...Typography.body },
  footerLink: { color: Colors.primary, ...Typography.body, fontWeight: "700" },
});
