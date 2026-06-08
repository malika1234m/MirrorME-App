import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Logo } from "@components/ui/Logo";
import { authService } from "@services/authService";
import { isValidEmail } from "@utils/validators";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!isValidEmail(email)) { setError("Enter a valid email address"); return; }
    setError("");
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      // Never reveal whether email exists — show success either way
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.inner}>
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>

          <Logo size="sm" style={styles.logoRow} />

          {/* Icon */}
          <View style={styles.iconWrap}>
            <LinearGradient colors={Colors.gradient.primary} style={styles.icon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="lock-open-outline" size={30} color={Colors.background} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Forgot password?</Text>
          <Text style={styles.sub}>
            Enter your email and we'll send you a link to reset your password.
          </Text>

          {sent ? (
            <View style={styles.sentCard}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
              <Text style={styles.sentTitle}>Check your inbox</Text>
              <Text style={styles.sentSub}>
                If <Text style={{ color: Colors.primary }}>{email}</Text> is registered, a reset link is on its way. Check your spam folder too.
              </Text>
              <Button
                title="Back to Sign In"
                fullWidth
                gradient
                onPress={() => router.replace("/(auth)/login")}
                style={{ marginTop: 8 }}
              />
            </View>
          ) : (
            <View style={styles.card}>
              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon="mail-outline"
                error={error}
                placeholder="you@example.com"
              />
              <Button
                title="Send Reset Link"
                fullWidth
                gradient
                isLoading={isLoading}
                onPress={handleSend}
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: 60, gap: 16 },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  logoRow: { marginBottom: Spacing.xl },
  iconWrap: { marginBottom: 4 },
  icon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  title: { ...Typography.title1, color: Colors.text.primary },
  sub: { ...Typography.body, color: Colors.text.secondary, lineHeight: 24 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.xxl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.xxl,
  },
  sentCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xxl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.xxl,
    alignItems: "center", gap: 12,
  },
  sentTitle: { ...Typography.title3, color: Colors.text.primary },
  sentSub: { ...Typography.body, color: Colors.text.secondary, textAlign: "center", lineHeight: 22 },
});
