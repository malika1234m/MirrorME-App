import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, PanResponder, Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Post } from "@models/index";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { postService } from "@services/postService";
import { Avatar } from "@components/ui/Avatar";
import { formatCount, formatTimeAgo } from "@utils/formatters";

const RATING_LABELS: Record<number, string> = {
  1: "Needs Work", 2: "Basic", 3: "Okay", 4: "Decent",
  5: "Average", 6: "Good", 7: "Great", 8: "Fire",
  9: "Iconic", 10: "Legendary",
};

export default function RateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [queue, setQueue] = useState<Post[]>([]);
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [ratedCount, setRatedCount] = useState(0);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | "up" | null>(null);

  // Measure the deck's own rendered size rather than `Dimensions.get("window")` —
  // the window is the full browser viewport on web, but the actual card area is
  // constrained to the PhoneFrame's container (~410px) on desktop web.
  const [deckSize, setDeckSize] = useState({ width: 0, height: 0 });
  const CARD_W = deckSize.width > 0 ? deckSize.width - Spacing.lg * 2 : 0;
  const CARD_H = deckSize.height > 0 ? deckSize.height - 24 : 0;
  const safeCardW = CARD_W > 0 ? CARD_W : 1;
  const safeCardH = CARD_H > 0 ? CARD_H : 1;
  const SWIPE_THRESHOLD = safeCardW * 0.32;

  const pan = useRef(new Animated.ValueXY()).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const nextCardScale = useRef(new Animated.Value(0.93)).current;
  const nextNextScale = useRef(new Animated.Value(0.86)).current;

  useEffect(() => {
    postService.getExplore(1)
      .then((r) => setQueue(r.data ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  const currentPost = queue[index];
  const nextPost = queue[index + 1];
  const nextNextPost = queue[index + 2];

  const submitRating = useCallback(async (postId: string, score: number) => {
    try { await postService.ratePost(postId, score); } catch {}
  }, []);

  const rateAndAdvance = useCallback((score: number) => {
    const post = queue[index];
    if (!post) return;
    submitRating(post.id, score);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // fly card upward
    Animated.parallel([
      Animated.timing(pan, { toValue: { x: 0, y: -safeCardH * 2 }, duration: 300, useNativeDriver: false }),
      Animated.timing(nextCardScale, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(nextNextScale, { toValue: 0.93, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      pan.setValue({ x: 0, y: 0 });
      nextCardScale.setValue(0.93);
      nextNextScale.setValue(0.86);
      cardScale.setValue(1);
      setIndex((i) => i + 1);
      setRatedCount((c) => c + 1);
      setSwipeDir(null);
    });
  }, [index, queue, submitRating, pan, nextCardScale, nextNextScale, cardScale]);

  const advance = useCallback((dir: "right" | "left" | "up") => {
    const post = queue[index];
    if (!post) return;

    const score = dir === "up" ? 10 : dir === "right" ? 8 : 3;
    if (dir !== "left") submitRating(post.id, score);

    const targetX = dir === "left" ? -safeCardW * 2 : dir === "right" ? safeCardW * 2 : 0;
    const targetY = dir === "up" ? -safeCardH * 2 : 0;

    Animated.parallel([
      Animated.timing(pan, { toValue: { x: targetX, y: targetY }, duration: 280, useNativeDriver: false }),
      Animated.timing(nextCardScale, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(nextNextScale, { toValue: 0.93, duration: 280, useNativeDriver: true }),
    ]).start(() => {
      pan.setValue({ x: 0, y: 0 });
      nextCardScale.setValue(0.93);
      nextNextScale.setValue(0.86);
      cardScale.setValue(1);
      setIndex((i) => i + 1);
      setRatedCount((c) => c + 1);
      setSwipeDir(null);
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [index, queue]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        pan.setValue({ x: g.dx, y: g.dy });
        // animate next card to scale up as top card moves away
        const progress = Math.min(Math.abs(g.dx) / SWIPE_THRESHOLD, 1);
        nextCardScale.setValue(0.93 + 0.07 * progress);
        nextNextScale.setValue(0.86 + 0.07 * progress);

        if (g.dy < -40 && Math.abs(g.dx) < 60) setSwipeDir("up");
        else if (g.dx > 40) setSwipeDir("right");
        else if (g.dx < -40) setSwipeDir("left");
        else setSwipeDir(null);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -SWIPE_THRESHOLD && Math.abs(g.dx) < 80) {
          advanceRef.current("up");
        } else if (g.dx > SWIPE_THRESHOLD) {
          advanceRef.current("right");
        } else if (g.dx < -SWIPE_THRESHOLD) {
          advanceRef.current("left");
        } else {
          Animated.parallel([
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, tension: 80, friction: 8 }),
            Animated.spring(nextCardScale, { toValue: 0.93, useNativeDriver: true }),
            Animated.spring(nextNextScale, { toValue: 0.86, useNativeDriver: true }),
          ]).start();
          setSwipeDir(null);
        }
      },
    })
  ).current;

  // keep advance ref stable for panResponder (closure trick)
  const advanceRef = useRef(advance);
  useEffect(() => { advanceRef.current = advance; }, [advance]);

  const rotate = pan.x.interpolate({ inputRange: [-safeCardW * 0.6, 0, safeCardW * 0.6], outputRange: ["-12deg", "0deg", "12deg"] });
  const fireOpacity = pan.x.interpolate({ inputRange: [0, safeCardW * 0.2], outputRange: [0, 1], extrapolate: "clamp" });
  const passOpacity = pan.x.interpolate({ inputRange: [-safeCardW * 0.2, 0], outputRange: [1, 0], extrapolate: "clamp" });
  const iconicOpacity = pan.y.interpolate({ inputRange: [-safeCardH * 0.15, 0], outputRange: [1, 0], extrapolate: "clamp" });
  const greenTint = pan.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 0.35], extrapolate: "clamp" });
  const redTint = pan.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [0.35, 0], extrapolate: "clamp" });
  const goldTint = pan.y.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [0.35, 0], extrapolate: "clamp" });

  const progress = queue.length > 0 ? Math.min(ratedCount / queue.length, 1) : 0;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={[styles.subtitle, { marginTop: 12 }]}>Loading outfits…</Text>
      </View>
    );
  }

  if (!currentPost || index >= queue.length) {
    return <AllDoneScreen count={ratedCount} onRestart={() => { setIndex(0); setRatedCount(0); }} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Rate My Fit</Text>
          <View style={styles.subtitleRow}>
            <Ionicons name="flame" size={11} color={Colors.primary} />
            <Text style={styles.subtitle}>Fire</Text>
            <Text style={styles.subtitleDot}>·</Text>
            <Ionicons name="close-circle" size={11} color="#FF3CAC" />
            <Text style={styles.subtitle}>Pass</Text>
            <Text style={styles.subtitleDot}>·</Text>
            <Ionicons name="star" size={11} color="#FFD700" />
            <Text style={styles.subtitle}>Iconic</Text>
          </View>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{ratedCount}/{queue.length}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Card stack */}
      <View
        style={styles.deck}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setDeckSize({ width, height });
        }}
      >
        {CARD_W > 0 && CARD_H > 0 && (
          <>
            {/* Card 3 (bottom) */}
            {nextNextPost && (
              <Animated.View style={[styles.cardWrap, { width: CARD_W, transform: [{ scale: nextNextScale }], bottom: -18, zIndex: 1 }]}>
                <OutfitCard post={nextNextPost} cardH={CARD_H} />
              </Animated.View>
            )}
            {/* Card 2 */}
            {nextPost && (
              <Animated.View style={[styles.cardWrap, { width: CARD_W, transform: [{ scale: nextCardScale }], bottom: -9, zIndex: 2 }]}>
                <OutfitCard post={nextPost} cardH={CARD_H} />
              </Animated.View>
            )}
            {/* Top card - draggable */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.cardWrap,
                {
                  width: CARD_W,
                  zIndex: 10,
                  transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
                },
              ]}
            >
              <OutfitCard post={currentPost} cardH={CARD_H} onAvatarPress={() => router.push(`/profile/${currentPost.user.id}`)} />

              {/* Green overlay (right swipe) */}
              <Animated.View pointerEvents="none" style={[styles.overlay, { backgroundColor: "#00FF88", opacity: greenTint }]} />
              {/* Red overlay (left swipe) */}
              <Animated.View pointerEvents="none" style={[styles.overlay, { backgroundColor: "#FF3CAC", opacity: redTint }]} />
              {/* Gold overlay (up swipe) */}
              <Animated.View pointerEvents="none" style={[styles.overlay, { backgroundColor: "#FFD700", opacity: goldTint }]} />

              {/* FIRE badge */}
              <Animated.View style={[styles.swipeBadge, styles.fireBadge, { opacity: fireOpacity }]}>
                <Ionicons name="flame" size={18} color={Colors.primary} />
                <Text style={styles.swipeBadgeText}>FIRE</Text>
              </Animated.View>

              {/* PASS badge */}
              <Animated.View style={[styles.swipeBadge, styles.passBadge, { opacity: passOpacity }]}>
                <Ionicons name="close-circle" size={18} color="#FF3CAC" />
                <Text style={styles.swipeBadgeText}>PASS</Text>
              </Animated.View>

              {/* ICONIC badge */}
              <Animated.View style={[styles.swipeBadge, styles.iconicBadge, { opacity: iconicOpacity }]}>
                <Ionicons name="star" size={18} color="#FFD700" />
                <Text style={styles.swipeBadgeText}>ICONIC</Text>
              </Animated.View>
            </Animated.View>
          </>
        )}
      </View>

      {/* Rating row */}
      <View style={styles.ratingSection}>
        <Text style={styles.ratingHint}>
          Tap a number to submit  ·  Or swipe the card
        </Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <TouchableOpacity
              key={n}
              style={styles.ratingBtn}
              onPress={() => rateAndAdvance(n)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={n >= 8 ? Colors.gradient.primary : n >= 5 ? ["#444", "#333"] : ["#2a2a2a", "#222"]}
                style={[StyleSheet.absoluteFill, { borderRadius: Radius.md }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <Text style={styles.ratingNum}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action buttons */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <ActionBtn icon="close" color="#FF3CAC" label="Pass" onPress={() => advance("left")} />
        <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/post/${currentPost.id}`)}>
          <Text style={styles.viewBtnText}>View Full Post</Text>
        </TouchableOpacity>
        <ActionBtn icon="flame" color={Colors.primary} label="Fire" onPress={() => advance("right")} />
      </View>
    </View>
  );
}

/* ─── Outfit card ─────────────────────────────────────────── */
const OutfitCard = ({ post, cardH, onAvatarPress }: { post: Post; cardH: number; onAvatarPress?: () => void }) => (
  <View style={[styles.card, { height: cardH }]}>
    <Image source={{ uri: post.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
    <LinearGradient colors={["rgba(0,0,0,0.5)", "transparent"]} style={styles.topGrad} />
    <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} style={styles.botGrad} />

    {/* User info */}
    <View style={styles.cardTop}>
      <TouchableOpacity style={styles.userRow} onPress={onAvatarPress} activeOpacity={0.8}>
        <Avatar uri={post.user.avatarUrl} name={post.user.username} size={36} />
        <View>
          <Text style={styles.cardUsername}>@{post.user.username}</Text>
          <Text style={styles.cardTime}>{formatTimeAgo(post.createdAt)}</Text>
        </View>
      </TouchableOpacity>
      {post.avgRating && (
        <BlurView intensity={50} tint="dark" style={styles.scorePill}>
          <Ionicons name="star" size={11} color={Colors.warning} />
          <Text style={styles.scoreText}>{post.avgRating.toFixed(1)}</Text>
        </BlurView>
      )}
    </View>

    {/* Bottom info */}
    <View style={styles.cardBot}>
      {post.outfitAnalysis?.fashionStyles[0] && (
        <View style={styles.stylePill}>
          <Ionicons name="sparkles" size={11} color={Colors.primary} />
          <Text style={styles.stylePillText}>{post.outfitAnalysis.fashionStyles[0]}</Text>
        </View>
      )}
      {post.outfitAnalysis?.overallStyle && (
        <Text style={styles.cardDesc} numberOfLines={2}>{post.outfitAnalysis.overallStyle}</Text>
      )}
      <View style={styles.cardStats}>
        <Ionicons name="heart" size={12} color={Colors.accent} />
        <Text style={styles.cardStatText}>{formatCount(post._count.likes)}</Text>
        <Ionicons name="chatbubble-outline" size={11} color="rgba(255,255,255,0.5)" />
        <Text style={styles.cardStatText}>{formatCount(post._count.comments)}</Text>
        <Ionicons name="star-outline" size={11} color="rgba(255,255,255,0.5)" />
        <Text style={styles.cardStatText}>{formatCount(post._count.ratings)}</Text>
      </View>
    </View>
  </View>
);

/* ─── Action button ───────────────────────────────────────── */
const ActionBtn = ({ icon, color, label, onPress }: { icon: string; color: string; label: string; onPress: () => void }) => (
  <TouchableOpacity style={[styles.actionBtn, { borderColor: `${color}40` }]} onPress={onPress} activeOpacity={0.8}>
    <Ionicons name={icon as React.ComponentProps<typeof Ionicons>["name"]} size={24} color={color} />
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

/* ─── All done screen ─────────────────────────────────────── */
const AllDoneScreen = ({ count, onRestart }: { count: number; onRestart: () => void }) => (
  <View style={[styles.container, { alignItems: "center", justifyContent: "center", gap: 20, padding: 40 }]}>
    <LinearGradient colors={Colors.gradient.primary} style={styles.doneIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Ionicons name="trophy" size={44} color={Colors.background} />
    </LinearGradient>
    <Text style={[styles.title, { textAlign: "center" }]}>You rated {count} outfits!</Text>
    <Text style={[styles.subtitle, { textAlign: "center" }]}>Come back tomorrow for a fresh batch of looks from the community.</Text>
    <TouchableOpacity style={styles.restartBtn} onPress={onRestart}>
      <LinearGradient colors={Colors.gradient.primary} style={styles.restartBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Ionicons name="refresh" size={16} color={Colors.background} />
        <Text style={styles.restartBtnText}>Rate Again</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: Spacing.lg, paddingTop: 8, paddingBottom: 10,
  },
  title: { ...Typography.title2, color: Colors.text.primary },
  subtitleRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  subtitleDot: { color: Colors.text.tertiary, ...Typography.caption },
  subtitle: { ...Typography.caption, color: Colors.text.tertiary },
  progressBadge: {
    backgroundColor: Colors.card, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.border,
  },
  progressText: { ...Typography.label, color: Colors.text.secondary },
  progressTrack: { height: 2, backgroundColor: Colors.card, marginHorizontal: Spacing.lg, borderRadius: 1 },
  progressFill: { height: 2, backgroundColor: Colors.primary, borderRadius: 1 },
  deck: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 12, marginBottom: 8 },
  cardWrap: { position: "absolute" },
  card: {
    width: "100%", borderRadius: Radius.xxl,
    overflow: "hidden", backgroundColor: Colors.card,
  },
  overlay: { ...StyleSheet.absoluteFillObject, borderRadius: Radius.xxl },
  topGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
  botGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 220 },
  cardTop: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: Spacing.lg,
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  cardUsername: { ...Typography.labelLarge, color: Colors.white },
  cardTime: { ...Typography.caption, color: "rgba(255,255,255,0.6)", marginTop: 1 },
  scorePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5, overflow: "hidden",
  },
  scoreText: { color: Colors.warning, ...Typography.label },
  cardBot: { position: "absolute", bottom: 0, left: 0, right: 0, padding: Spacing.lg, gap: 8 },
  stylePill: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: `${Colors.primary}40`,
  },
  stylePillText: { color: Colors.primary, ...Typography.caption, fontWeight: "700" },
  cardDesc: { color: "rgba(255,255,255,0.85)", ...Typography.body, lineHeight: 20 },
  cardStats: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardStatText: { color: "rgba(255,255,255,0.6)", ...Typography.caption },
  swipeBadge: {
    position: "absolute", borderRadius: Radius.xl,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 2, flexDirection: "row", alignItems: "center", gap: 6,
  },
  fireBadge: { top: 30, left: 20, borderColor: Colors.primary, backgroundColor: "rgba(0,0,0,0.7)", transform: [{ rotate: "-15deg" }] },
  passBadge: { top: 30, right: 20, borderColor: "#FF3CAC", backgroundColor: "rgba(0,0,0,0.7)", transform: [{ rotate: "15deg" }] },
  iconicBadge: { top: "35%", alignSelf: "center", borderColor: "#FFD700", backgroundColor: "rgba(0,0,0,0.7)" },
  swipeBadgeText: { ...Typography.title3, color: Colors.white, fontWeight: "800" },
  ratingSection: { paddingHorizontal: Spacing.lg, paddingBottom: 10, gap: 8 },
  ratingHint: { ...Typography.caption, color: Colors.text.tertiary, textAlign: "center" },
  ratingRow: { flexDirection: "row", gap: 6 },
  ratingBtn: {
    flex: 1, aspectRatio: 1,
    borderRadius: Radius.md, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  ratingNum: { color: Colors.white, fontSize: 12, fontWeight: "800" },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.xl, gap: 12 },
  actionBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.card, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", gap: 3,
  },
  actionLabel: { fontSize: 10, fontWeight: "700" },
  viewBtn: {
    flex: 1, height: 48, backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center",
  },
  viewBtnText: { ...Typography.label, color: Colors.text.secondary },
  doneIcon: { width: 100, height: 100, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  restartBtn: { borderRadius: Radius.xl, overflow: "hidden", marginTop: 8 },
  restartBtnInner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 16 },
  restartBtnText: { ...Typography.labelLarge, color: Colors.background, fontWeight: "700" },
});
