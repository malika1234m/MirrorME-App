import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  StatusBar, Animated, Modal, FlatList, Alert, ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useStoryStore } from "@store/storyStore";
import { useAuthStore } from "@store/authStore";
import { storyService } from "@services/storyService";
import { Avatar } from "@components/ui/Avatar";
import { Colors, Typography, Spacing, Radius } from "@constants/colors";
import { formatTimeAgo } from "@utils/formatters";

const { width: W, height: H } = Dimensions.get("window");
const STORY_DURATION = 5000;

export default function StoryViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuthStore();
  const { groups, activeGroupIndex, markViewed } = useStoryStore();

  const [groupIdx, setGroupIdx] = useState(activeGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<{ count: number; users: any[] } | null>(null);
  const [viewersLoading, setViewersLoading] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const pausedAt = useRef(0);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];
  const isOwn = story?.userId === currentUser?.id;

  /* ── navigation ────────────────────────────────────────── */
  const goClose = useCallback(() => {
    animRef.current?.stop();
    router.back();
  }, [router]);

  const goNext = useCallback(() => {
    if (!group) return;
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx((i) => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((g) => g + 1);
      setStoryIdx(0);
    } else {
      goClose();
    }
  }, [storyIdx, groupIdx, group, groups.length, goClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) setStoryIdx((i) => i - 1);
    else if (groupIdx > 0) { setGroupIdx((g) => g - 1); setStoryIdx(0); }
  }, [storyIdx, groupIdx]);

  /* ── animation ─────────────────────────────────────────── */
  const startAnim = useCallback((from = 0, dur = STORY_DURATION) => {
    progress.setValue(from);
    animRef.current?.stop();
    animRef.current = Animated.timing(progress, {
      toValue: 1, duration: dur, useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => { if (finished) goNext(); });
  }, [progress, goNext]);

  const doPause = useCallback(() => {
    if (paused) return;
    animRef.current?.stop();
    pausedAt.current = (progress as any)._value as number;
    setPaused(true);
  }, [paused, progress]);

  const doResume = useCallback(() => {
    if (!paused) return;
    const rem = (1 - pausedAt.current) * STORY_DURATION;
    startAnim(pausedAt.current, rem);
    setPaused(false);
  }, [paused, startAnim]);

  /* ── reset on story change ──────────────────────────────── */
  useEffect(() => {
    if (!story) { goClose(); return; }
    setViewers(null);
    startAnim(0, STORY_DURATION);
    if (!story.viewed && !isOwn) {
      storyService.viewStory(story.id).catch(() => {});
      markViewed(groupIdx, storyIdx);
    }
  }, [groupIdx, storyIdx]);

  /* ── viewers sheet ──────────────────────────────────────── */
  const openViewers = async () => {
    if (!story || !isOwn) return;
    doPause();
    setViewersLoading(true);
    setShowViewers(true);
    try {
      const res = await storyService.getViewers(story.id);
      if (res.data) setViewers({ count: res.data.count, users: res.data.views });
    } catch {
      setViewers({ count: 0, users: [] });
    } finally {
      setViewersLoading(false);
    }
  };

  const closeViewers = () => {
    setShowViewers(false);
    setViewers(null);
    doResume();
  };

  /* ── delete ─────────────────────────────────────────────── */
  const handleDelete = () => {
    doPause();
    Alert.alert("Delete Story", "Remove this story?", [
      { text: "Cancel", style: "cancel", onPress: doResume },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try { await storyService.deleteStory(story!.id); goNext(); }
          catch { doResume(); }
        },
      },
    ]);
  };

  if (!group || !story) return null;

  const topInteractiveY = insets.top + 80; // below progress bars + header

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Background image */}
      <Image
        source={{ uri: story.imageUrl }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={100}
      />

      {/* Gradient overlays */}
      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "transparent"]}
        style={[StyleSheet.absoluteFill, { height: H * 0.35 }]}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)"]}
        style={[StyleSheet.absoluteFill, { top: H * 0.6 }]}
      />

      {/* ── TAP ZONES (split left/right, below header) ──── */}
      <TouchableOpacity
        style={[styles.tapLeft, { top: topInteractiveY, bottom: isOwn ? 80 : 90 }]}
        onPress={goPrev}
        onLongPress={doPause}
        onPressOut={doResume}
        activeOpacity={1}
        delayLongPress={200}
      />
      <TouchableOpacity
        style={[styles.tapRight, { top: topInteractiveY, bottom: isOwn ? 80 : 90 }]}
        onPress={goNext}
        onLongPress={doPause}
        onPressOut={doResume}
        activeOpacity={1}
        delayLongPress={200}
      />

      {/* ── PROGRESS BARS ───────────────────────────────── */}
      <View style={[styles.bars, { paddingTop: insets.top + 6 }]}>
        {group.stories.map((s, i) => (
          <View key={s.id} style={styles.barTrack}>
            {i < storyIdx
              ? <View style={[styles.barFill, { width: "100%" }]} />
              : i === storyIdx
              ? <Animated.View style={[styles.barFill, {
                  width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                }]} />
              : null}
          </View>
        ))}
      </View>

      {/* ── HEADER ──────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => { goClose(); router.push(`/profile/${group.user.id}`); }}
          activeOpacity={0.85}
        >
          <Avatar uri={group.user.avatarUrl} name={group.user.displayName ?? group.user.username} size={36} hasStory />
          <View>
            <Text style={styles.username}>@{group.user.username}</Text>
            <Text style={styles.time}>{formatTimeAgo(story.createdAt)}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {paused && (
            <View style={styles.pausedPill}>
              <Ionicons name="pause" size={11} color={Colors.white} />
              <Text style={styles.pausedText}>Paused</Text>
            </View>
          )}
          {isOwn && (
            <TouchableOpacity style={styles.iconBtn} onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={18} color={Colors.white} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={goClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── CAPTION ─────────────────────────────────────── */}
      {story.caption && (
        <View style={[styles.captionWrap, { bottom: isOwn ? 80 : 90 }]}>
          <BlurView intensity={50} tint="dark" style={styles.captionBlur}>
            <Text style={styles.captionText}>{story.caption}</Text>
          </BlurView>
        </View>
      )}

      {/* ── OWN STORY: viewers button ────────────────────── */}
      {isOwn && (
        <View style={[styles.viewersBtnWrap, { bottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.viewersBtn} onPress={openViewers} activeOpacity={0.85}>
            <Ionicons name="eye-outline" size={16} color={Colors.white} />
            <Text style={styles.viewersBtnText}>
              {viewers ? `${viewers.count} views` : "Views"}
            </Text>
            <Ionicons name="chevron-up" size={13} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── OTHER STORY: reply bar ────────────────────────── */}
      {!isOwn && (
        <View style={[styles.replyBar, { paddingBottom: insets.bottom + 12 }]}>
          <BlurView intensity={50} tint="dark" style={styles.replyInput}>
            <Text style={styles.replyPlaceholder}>Reply to @{group.user.username}…</Text>
          </BlurView>
          <TouchableOpacity
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            style={styles.heartBtn}
          >
            <Ionicons name="heart-outline" size={26} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── VIEWERS MODAL ────────────────────────────────── */}
      <Modal
        visible={showViewers}
        transparent
        animationType="slide"
        onRequestClose={closeViewers}
        statusBarTranslucent
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeViewers}>
          <View style={[styles.viewersSheet, { paddingBottom: insets.bottom + 16 }]}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>
              {viewersLoading ? "Loading..." : `${viewers?.count ?? 0} view${viewers?.count !== 1 ? "s" : ""}`}
            </Text>

            {viewersLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 24, marginBottom: 16 }} />
            ) : !viewers || viewers.users.length === 0 ? (
              <View style={styles.emptyViewers}>
                <Ionicons name="eye-off-outline" size={36} color={Colors.text.tertiary} />
                <Text style={styles.emptyViewersText}>No views yet</Text>
                <Text style={styles.emptyViewersSub}>Share your story to get more eyes on your look</Text>
              </View>
            ) : (
              <FlatList
                data={viewers.users}
                keyExtractor={(u) => u.id}
                contentContainerStyle={{ gap: 16, paddingTop: 8 }}
                renderItem={({ item }) => (
                  <View style={styles.viewerRow}>
                    <Avatar uri={item.avatarUrl} name={item.displayName ?? item.username} size={42} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.viewerName}>{item.displayName ?? item.username}</Text>
                      <Text style={styles.viewerHandle}>@{item.username}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  </View>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  /* Tap zones */
  tapLeft: { position: "absolute", left: 0, width: W * 0.35 },
  tapRight: { position: "absolute", right: 0, width: W * 0.65 },

  /* Progress bars */
  bars: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", gap: 3,
    paddingHorizontal: Spacing.md, zIndex: 10,
  },
  barTrack: {
    flex: 1, height: 2.5,
    backgroundColor: "rgba(255,255,255,0.35)", borderRadius: 2, overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: "#fff", borderRadius: 2 },

  /* Header */
  header: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  username: { ...Typography.labelLarge, color: "#fff" },
  time: { ...Typography.caption, color: "rgba(255,255,255,0.65)", marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 2 },
  iconBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  pausedPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)", borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5, marginRight: 4,
  },
  pausedText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  /* Caption */
  captionWrap: {
    position: "absolute", left: 0, right: 0, zIndex: 10,
    paddingHorizontal: Spacing.lg,
  },
  captionBlur: {
    borderRadius: Radius.lg, overflow: "hidden",
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
  },
  captionText: { ...Typography.body, color: "#fff", lineHeight: 22, textAlign: "center" },

  /* Viewers button */
  viewersBtnWrap: {
    position: "absolute", left: 0, right: 0, zIndex: 10,
    alignItems: "center",
  },
  viewersBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: Radius.full,
    paddingHorizontal: 20, paddingVertical: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.28)",
  },
  viewersBtnText: { color: "#fff", ...Typography.label, fontWeight: "700" },

  /* Reply bar */
  replyBar: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: Spacing.lg, paddingTop: 8,
  },
  replyInput: {
    flex: 1, borderRadius: Radius.full, overflow: "hidden",
    paddingHorizontal: Spacing.lg, paddingVertical: 13,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.28)",
  },
  replyPlaceholder: { color: "rgba(255,255,255,0.65)", ...Typography.body },
  heartBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },

  /* Modal */
  modalBackdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  viewersSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg,
    maxHeight: H * 0.6,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: "center", marginBottom: 18,
  },
  sheetTitle: { ...Typography.title3, color: Colors.text.primary, marginBottom: 8 },
  emptyViewers: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyViewersText: { ...Typography.labelLarge, color: Colors.text.secondary },
  emptyViewersSub: { ...Typography.body, color: Colors.text.tertiary, textAlign: "center" },
  viewerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  viewerName: { ...Typography.labelLarge, color: Colors.text.primary },
  viewerHandle: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
});
