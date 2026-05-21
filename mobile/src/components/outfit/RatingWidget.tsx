import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { RATING_LABELS } from "@constants/config";
import { postService } from "@services/postService";

interface Props {
  postId: string;
  avgScore: number;
  totalRatings: number;
  userScore: number | null;
  onRated?: (score: number, avg: number) => void;
}

const COLORS = [
  "#FF453A", "#FF6B35", "#FF8C00", "#FFB800", "#F4D03F",
  "#A8D500", "#78D500", "#00C853", "#00BCD4", "#C8FF00",
];

export const RatingWidget: React.FC<Props> = ({
  postId, avgScore, totalRatings, userScore, onRated,
}) => {
  const [selected, setSelected] = useState(userScore);
  const [localAvg, setLocalAvg] = useState(avgScore);
  const [localTotal, setLocalTotal] = useState(totalRatings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scoreAnim = useRef(new Animated.Value(1)).current;

  const animateScore = () => {
    Animated.sequence([
      Animated.timing(scoreAnim, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.spring(scoreAnim, { toValue: 1, useNativeDriver: true, tension: 60 }),
    ]).start();
  };

  const handleRate = async (score: number) => {
    if (isSubmitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateScore();
    setSelected(score);
    setIsSubmitting(true);
    try {
      const res = await postService.ratePost(postId, score);
      if (res.data) {
        setLocalAvg(res.data.avgScore);
        setLocalTotal(res.data.totalRatings);
        onRated?.(score, res.data.avgScore);
      }
    } catch {
      setSelected(userScore);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillPct = localAvg > 0 ? (localAvg / 10) * 100 : 0;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Rate This Fit</Text>
          <Text style={styles.subtitle}>{localTotal} community {localTotal === 1 ? "rating" : "ratings"}</Text>
        </View>
        <Animated.View style={[styles.scoreBox, { transform: [{ scale: scoreAnim }] }]}>
          <LinearGradient
            colors={localAvg > 0 ? Colors.gradient.primary : [Colors.card, Colors.cardElevated]}
            style={styles.scoreGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.scoreValue, { color: localAvg > 0 ? Colors.background : Colors.text.tertiary }]}>
              {localAvg > 0 ? localAvg.toFixed(1) : "—"}
            </Text>
            <Text style={[styles.scoreMax, { color: localAvg > 0 ? Colors.background + "99" : Colors.text.tertiary }]}>/10</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <LinearGradient
          colors={Colors.gradient.primary}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${fillPct}%` }]}
        />
      </View>

      {/* Your rating label */}
      {selected !== null && (
        <View style={styles.yourRating}>
          <View style={[styles.ratingColorDot, { backgroundColor: COLORS[selected - 1] }]} />
          <Text style={styles.yourRatingText}>
            Your rating: <Text style={{ fontWeight: "800", color: COLORS[selected - 1] }}>{selected}/10</Text>
            {" — "}{RATING_LABELS[selected]}
          </Text>
        </View>
      )}

      {/* Stars Grid */}
      <View style={styles.grid}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
          const isSelected = selected !== null && score <= selected;
          const color = COLORS[score - 1];
          return (
            <TouchableOpacity
              key={score}
              onPress={() => handleRate(score)}
              activeOpacity={0.75}
              style={styles.scoreCell}
            >
              <View style={[styles.scoreButton, isSelected && { backgroundColor: `${color}20`, borderColor: `${color}60` }]}>
                <Text style={{ fontSize: 18 }}>
                  {isSelected ? "★" : "☆"}
                </Text>
              </View>
              <Text style={[styles.scoreLabel, { color: isSelected ? color : Colors.text.tertiary }]}>{score}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.md },
  title: { ...Typography.labelLarge, color: Colors.text.primary },
  subtitle: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 3 },
  scoreBox: { borderRadius: Radius.lg, overflow: "hidden" },
  scoreGradient: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  scoreValue: { fontSize: 26, fontWeight: "900" },
  scoreMax: { fontSize: 13, fontWeight: "600", marginLeft: 2 },
  progressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  yourRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ratingColorDot: { width: 8, height: 8, borderRadius: 4 },
  yourRatingText: { ...Typography.body, color: Colors.text.secondary },
  grid: { flexDirection: "row", justifyContent: "space-between" },
  scoreCell: { alignItems: "center", gap: 4 },
  scoreButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreLabel: { fontSize: 10, fontWeight: "600" },
});
