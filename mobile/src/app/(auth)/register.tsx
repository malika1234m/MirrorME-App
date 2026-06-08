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
import { Logo } from "@components/ui/Logo";
import { useAuthStore } from "@store/authStore";
import { isValidEmail, isValidUsername, isValidPassword } from "@utils/validators";

const STEPS = ["Account", "Profile", "Password"];

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ email: "", username: "", displayName: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const setField = (key: string) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validateStep = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!isValidEmail(form.email)) errs.email = "Enter a valid email address";
    } else if (step === 1) {
      if (!isValidUsername(form.username)) errs.username = "3–30 chars, letters/numbers/underscore";
    } else {
      if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    setIsLoading(true);
    try {
      await register({
        email: form.email.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
        displayName: form.displayName.trim() || undefined,
      });
    } catch (err: unknown) {
      Alert.alert("Registration Failed", err instanceof Error ? err.message : "Please try again");
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <LinearGradient colors={["rgba(139,92,246,0.06)", "transparent"]} style={StyleSheet.absoluteFill} />
            <TouchableOpacity style={styles.backBtn} onPress={() => step > 0 ? setStep(step - 1) : router.back()}>
              <Ionicons name="arrow-back" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
            <Logo size="lg" style={styles.logoRow} />
            <Text style={styles.heading}>Create{"\n"}Account</Text>
            <Text style={styles.subheading}>Join the fashion community</Text>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepRow}>
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle, i <= step && styles.stepCircleActive, i < step && styles.stepCircleDone]}>
                    {i < step
                      ? <Ionicons name="checkmark" size={14} color={Colors.text.inverse} />
                      : <Text style={[styles.stepNum, i === step && styles.stepNumActive]}>{i + 1}</Text>
                    }
                  </View>
                  <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
                </View>
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {step === 0 && (
              <Input
                label="Email Address"
                value={form.email}
                onChangeText={setField("email")}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
                error={errors.email}
                placeholder="you@example.com"
                hint="We'll never share your email"
              />
            )}

            {step === 1 && (
              <>
                <Input
                  label="Display Name"
                  value={form.displayName}
                  onChangeText={setField("displayName")}
                  leftIcon="person-outline"
                  placeholder="How should we call you?"
                />
                <Input
                  label="Username"
                  value={form.username}
                  onChangeText={setField("username")}
                  autoCapitalize="none"
                  leftIcon="at-outline"
                  error={errors.username}
                  placeholder="your_username"
                  hint="This is how others will find you"
                />
              </>
            )}

            {step === 2 && (
              <>
                <Input
                  label="Password"
                  value={form.password}
                  onChangeText={setField("password")}
                  isPassword
                  leftIcon="lock-closed-outline"
                  error={errors.password}
                  placeholder="Min. 8 characters"
                  hint="Use uppercase, numbers and symbols for a stronger password"
                />
                {form.password.length > 0 && <PasswordStrength password={form.password} />}
              </>
            )}

            <Button
              title={step < STEPS.length - 1 ? "Continue" : "Create Account"}
              fullWidth
              gradient={step === STEPS.length - 1}
              isLoading={isLoading}
              onPress={handleNext}
              style={{ marginTop: 8 }}
            />

            {step === STEPS.length - 1 && (
              <Text style={styles.terms}>
                By creating an account you agree to our{" "}
                <Text style={{ color: Colors.primary }} onPress={() => router.push("/legal" as any)}>Terms of Service</Text>
                {" "}&amp;{" "}
                <Text style={{ color: Colors.primary }} onPress={() => router.push("/legal" as any)}>Privacy Policy</Text>
              </Text>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.footerLink}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ── Password strength indicator ── */
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak",   color: Colors.error };
  if (score <= 2) return { score, label: "Fair",   color: Colors.warning };
  if (score <= 3) return { score, label: "Good",   color: Colors.info };
  return              { score, label: "Strong", color: Colors.success };
}

const PasswordStrength = ({ password }: { password: string }) => {
  const { score, label, color } = getStrength(password);
  const bars = [1, 2, 3, 4];
  return (
    <View style={strengthStyles.wrap}>
      <View style={strengthStyles.bars}>
        {bars.map((b) => (
          <View
            key={b}
            style={[strengthStyles.bar, { backgroundColor: b <= score ? color : Colors.border }]}
          />
        ))}
      </View>
      <Text style={[strengthStyles.label, { color }]}>{label}</Text>
    </View>
  );
};

const strengthStyles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: -8, marginBottom: 8 },
  bars: { flex: 1, flexDirection: "row", gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { ...Typography.caption, fontWeight: "700", minWidth: 44, textAlign: "right" },
});

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    minHeight: 200,
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
  logoRow: { marginBottom: Spacing.lg },
  heading: { ...Typography.display, color: Colors.text.primary, marginBottom: 6 },
  subheading: { ...Typography.body, color: Colors.text.secondary },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  stepItem: { alignItems: "center", gap: 6 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySubtle },
  stepCircleDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNum: { ...Typography.labelSmall, color: Colors.text.tertiary },
  stepNumActive: { color: Colors.primary },
  stepLabel: { ...Typography.caption, color: Colors.text.tertiary },
  stepLabelActive: { color: Colors.primary },
  stepLine: { flex: 1, height: 1.5, backgroundColor: Colors.border, marginBottom: 20 },
  stepLineDone: { backgroundColor: Colors.primary },
  formCard: {
    marginHorizontal: Spacing.xxl,
    backgroundColor: Colors.card,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  terms: {
    color: Colors.text.tertiary,
    ...Typography.caption,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
  footer: { flexDirection: "row", justifyContent: "center", paddingBottom: 36 },
  footerText: { color: Colors.text.secondary, ...Typography.body },
  footerLink: { color: Colors.primary, ...Typography.body, fontWeight: "700" },
});
