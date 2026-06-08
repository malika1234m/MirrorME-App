import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Animated, Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Post } from "@models/index";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { Avatar } from "@components/ui/Avatar";
import { Tag } from "@components/ui/Tag";
import { formatCount, formatTimeAgo } from "@utils/formatters";
import { postService } from "@services/postService";
import { aiService } from "@services/aiService";
import { useFeedStore } from "@store/feedStore";

interface Props { post: Post }

export const PostCard: React.FC<Props> = ({ post }) => {
  const router = useRouter();
  const [isLiking, setIsLiking] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved ?? false);
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post._count.likes);

  useEffect(() => {
    setIsLiked(post.isLiked ?? false);
    setLikeCount(post._count.likes);
    setIsSaved(post.isSaved ?? false);
  }, [post.isLiked, post._count.likes, post.isSaved]);

  const heartScale = useRef(new Animated.Value(1)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const animateHeart = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(heartScale, { toValue: 1.6, useNativeDriver: true, tension: 60, friction: 5 }),
        Animated.timing(heartOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(heartOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const wasLiked = isLiked;
    if (!wasLiked) animateHeart();
    // Optimistic update local state immediately
    setIsLiked(!wasLiked);
    setLikeCount((c) => wasLiked ? c - 1 : c + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await postService.toggleLike(post.id);
      // Sync with server truth if response includes count
      if (res.data?.count !== undefined) setLikeCount(res.data.count);
    } catch {
      // Roll back on failure
      setIsLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : c - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    setIsSaved((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await aiService.toggleSave(post.id); }
    catch { setIsSaved((prev) => !prev); }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: post.caption ? `${post.caption}\n\n${post.imageUrl}` : post.imageUrl,
        url: post.imageUrl,
      });
    } catch {}
  };

  const lastTapRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleImageTap = () => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 300;
    lastTapRef.current = now;

    if (isDoubleTap) {
      // Double tap → like
      if (tapTimerRef.current) { clearTimeout(tapTimerRef.current); tapTimerRef.current = null; }
      if (!isLiked) handleLike();
    } else {
      // Single tap → navigate to post after short delay (cancelled if double-tap follows)
      tapTimerRef.current = setTimeout(() => {
        tapTimerRef.current = null;
        router.push(`/post/${post.id}`);
      }, 280);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => router.push(`/profile/${post.user.id}`)}
          activeOpacity={0.8}
        >
          <Avatar
            uri={post.user.avatarUrl}
            name={post.user.displayName || post.user.username}
            size={38}
            hasStory={false}
          />
          <View style={styles.userInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={styles.username}>{post.user.username}</Text>
              {post.user.isVerified && <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />}
            </View>
            <Text style={styles.timestamp}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>

        {post.outfitAnalysis?.fashionStyles[0] && (
          <Tag
            label={post.outfitAnalysis.fashionStyles[0]}
            color={Colors.accentBlue}
            dot
          />
        )}
      </View>

      {/* Image */}
      <TouchableOpacity activeOpacity={1} onPress={handleImageTap}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />

          {/* Double-tap heart */}
          <Animated.View
            pointerEvents="none"
            style={[styles.bigHeart, { transform: [{ scale: heartScale }], opacity: heartOpacity }]}
          >
            <Ionicons name="heart" size={80} color="white" />
          </Animated.View>

          {/* Top overlay */}
          <LinearGradient
            colors={["rgba(0,0,0,0.45)", "transparent"]}
            style={styles.topGradient}
          />

          {/* Bottom overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.bottomGradient}
          >
            <View style={styles.imageBottom}>
              {/* Color dots */}
              {post.outfitAnalysis?.colors && (
                <View style={styles.colorDots}>
                  {post.outfitAnalysis.colors.slice(0, 4).map((color, i) => (
                    <View
                      key={i}
                      style={[styles.colorDot, { backgroundColor: color.toLowerCase(), marginLeft: i > 0 ? -4 : 0 }]}
                    />
                  ))}
                </View>
              )}

              {/* Style info */}
              {post.outfitAnalysis?.season && (
                <View style={styles.seasonBadge}>
                  <Text style={styles.seasonText}>{post.outfitAnalysis.season}</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* AI Badge */}
          {post.outfitAnalysis && (
            <View style={styles.aiBadge}>
              <LinearGradient colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.6)"]} style={styles.aiBadgeInner}>
                <Ionicons name="sparkles" size={11} color={Colors.primary} />
                <Text style={styles.aiBadgeText}>AI Styled</Text>
              </LinearGradient>
            </View>
          )}

          {/* Rating */}
          {post.avgRating && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ {post.avgRating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
            <Animated.View>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={25}
                color={isLiked ? Colors.accent : Colors.text.secondary}
              />
            </Animated.View>
            <Text style={[styles.actionCount, isLiked && { color: Colors.accent }]}>
              {formatCount(likeCount)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/post/${post.id}`)} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={23} color={Colors.text.secondary} />
            <Text style={styles.actionCount}>{formatCount(post._count.comments)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/post/${post.id}`)} activeOpacity={0.7}>
            <Ionicons name="star-outline" size={23} color={Colors.text.secondary} />
            <Text style={styles.actionCount}>{formatCount(post._count.ratings)}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={handleSave} activeOpacity={0.7}>
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={23} color={isSaved ? Colors.primary : Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {post.caption && (
        <View style={styles.captionRow}>
          <Text style={styles.captionUsername}>{post.user.username}</Text>
          <Text style={styles.captionText} numberOfLines={2}> {post.caption}</Text>
        </View>
      )}

      {/* AI Clothing Tags */}
      {post.outfitAnalysis?.clothingTypes && post.outfitAnalysis.clothingTypes.length > 0 && (
        <View style={styles.tagsRow}>
          {post.outfitAnalysis.clothingTypes.slice(0, 3).map((item, i) => (
            <Tag key={i} label={item} color={Colors.accentBlue} />
          ))}
          {post.outfitAnalysis.clothingTypes.length > 3 && (
            <Text style={styles.moreTags}>+{post.outfitAnalysis.clothingTypes.length - 3} more</Text>
          )}
        </View>
      )}

      {/* View all comments */}
      {post._count.comments > 0 && (
        <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)}>
          <Text style={styles.viewComments}>View all {post._count.comments} comments</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 6, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  userRow: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  userInfo: { flex: 1 },
  username: { ...Typography.labelLarge, color: Colors.text.primary },
  timestamp: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 1 },
  imageContainer: { width: "100%", aspectRatio: 1 / 1.22, backgroundColor: Colors.card },
  image: { width: "100%", height: "100%" },
  bigHeart: {
    position: "absolute",
    alignSelf: "center",
    top: "40%",
    zIndex: 10,
    shadowColor: "#fff",
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 80 },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  imageBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  colorDots: { flexDirection: "row" },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  seasonBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  seasonText: { color: Colors.white, ...Typography.caption, fontWeight: "600" },
  aiBadge: { position: "absolute", top: 12, left: 12 },
  aiBadgeInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: `${Colors.primary}35`,
  },
  aiBadgeText: { color: Colors.primary, ...Typography.caption, fontWeight: "700" },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: `${Colors.warning}40`,
  },
  ratingText: { color: Colors.warning, ...Typography.caption, fontWeight: "700" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  leftActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { color: Colors.text.secondary, ...Typography.label },
  captionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    marginBottom: 6,
  },
  captionUsername: { ...Typography.labelLarge, color: Colors.text.primary },
  captionText: { ...Typography.body, color: Colors.text.secondary, flex: 1 },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    gap: 6,
    marginBottom: 8,
    alignItems: "center",
  },
  moreTags: { color: Colors.text.tertiary, ...Typography.caption },
  viewComments: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
    color: Colors.text.tertiary,
    ...Typography.body,
  },
});
