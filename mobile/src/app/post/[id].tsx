import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView, View, Text, Image, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  StyleSheet, Alert, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { usePostStore } from "@store/postStore";
import { useFeedStore } from "@store/feedStore";
import { useAuthStore } from "@store/authStore";
import { OutfitAnalysisCard } from "@components/outfit/OutfitAnalysisCard";
import { RatingWidget } from "@components/outfit/RatingWidget";
import { SimilarOutfits } from "@components/outfit/SimilarOutfits";
import { Avatar } from "@components/ui/Avatar";
import { Tag } from "@components/ui/Tag";
import { LoadingSpinner } from "@components/ui/LoadingSpinner";
import { formatTimeAgo, formatCount } from "@utils/formatters";
import { postService } from "@services/postService";
import { aiService } from "@services/aiService";


export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const removePost = useFeedStore((s) => s.removePost);
  const {
    activePost, comments, analysis, similar,
    isLoadingPost, fetchPost, fetchComments, addComment,
    deleteComment, fetchAnalysis, fetchSimilar, reset,
  } = usePostStore();

  const [rating, setRating] = useState<{ avgScore: number; totalRatings: number; userScore: number | null }>({
    avgScore: 0, totalRatings: 0, userScore: null,
  });
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const commentInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showAllComments, setShowAllComments] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPost(id);
    fetchComments(id);
    fetchAnalysis(id);
    fetchSimilar(id);
    postService.getRating(id)
      .then((res) => { if (res.data) setRating(res.data); })
      .catch(() => {}); // rating stays at defaults — widget still renders
    return () => reset();
  }, [id]);

  useEffect(() => {
    if (activePost) {
      setIsLiked(activePost.isLiked ?? false);
      setLikeCount(activePost._count.likes);
    }
  }, [activePost]);

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await postService.toggleLike(id!); }
    catch { setIsLiked(isLiked); setLikeCount(likeCount); }
  };

  const handleSave = async () => {
    setIsSaved(!isSaved);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await aiService.toggleSave(id!); }
    catch { setIsSaved(isSaved); }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: activePost?.caption
          ? `${activePost.caption}\n\n${activePost.imageUrl}`
          : activePost?.imageUrl ?? "",
        url: activePost?.imageUrl,
      });
    } catch {}
  };

  const handleOptions = () => {
    const isOwn = activePost?.userId === user?.id;
    if (isOwn) {
      Alert.alert("Post Options", undefined, [
        {
          text: "Delete Post",
          style: "destructive",
          onPress: () =>
            Alert.alert("Delete Post", "This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  try {
                    await postService.deletePost(id!);
                    removePost(id!);
                    router.back();
                  } catch (err: unknown) {
                    Alert.alert("Error", err instanceof Error ? err.message : "Failed to delete");
                  }
                },
              },
            ]),
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      Alert.alert("Report", "Report this post as inappropriate?", [
        { text: "Cancel", style: "cancel" },
        { text: "Report", style: "destructive", onPress: () => Alert.alert("Reported", "Thanks for keeping MirrorME safe.") },
      ]);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      await addComment(id!, commentText.trim());
      setCommentText("");
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const focusComment = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
    setTimeout(() => commentInputRef.current?.focus(), 350);
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      await aiService.reanalyze(id!);
      await fetchAnalysis(id!);
      Alert.alert("Done!", "AI analysis has been refreshed.");
    } catch {
      Alert.alert("Error", "Could not re-run analysis. Try again.");
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert("Delete Comment", "Remove this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try { await deleteComment(commentId); }
          catch (err: unknown) { Alert.alert("Error", err instanceof Error ? err.message : "Failed to delete"); }
        },
      },
    ]);
  };

  if (isLoadingPost || !activePost) return <LoadingSpinner fullScreen />;

  const visibleComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} bounces>
          {/* Hero Image */}
          <View style={styles.heroContainer}>
            <Image source={{ uri: activePost.imageUrl }} style={styles.hero} resizeMode="cover" />
            <LinearGradient colors={Colors.gradient.dark} style={styles.heroGrad} />

            <SafeAreaView edges={["top"]} style={styles.navOverlay}>
              <View style={styles.nav}>
                <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
                  <BlurView intensity={60} tint="dark" style={styles.navBtnBlur}>
                    <Ionicons name="arrow-back" size={20} color={Colors.white} />
                  </BlurView>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navBtn} onPress={handleOptions}>
                  <BlurView intensity={60} tint="dark" style={styles.navBtnBlur}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={Colors.white} />
                  </BlurView>
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            <View style={styles.heroBottom}>
              <TouchableOpacity
                style={styles.heroUserRow}
                onPress={() => router.push(`/profile/${activePost.user.id}`)}
                activeOpacity={0.85}
              >
                <Avatar uri={activePost.user.avatarUrl} name={activePost.user.username} size={36} />
                <View>
                  <Text style={styles.heroUsername}>{activePost.user.username}</Text>
                  <Text style={styles.heroTime}>{formatTimeAgo(activePost.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions Bar */}
          <View style={styles.actionsBar}>
            <TouchableOpacity style={styles.actionItem} onPress={handleLike} activeOpacity={0.75}>
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? Colors.accent : Colors.text.secondary} />
              <Text style={[styles.actionCount, isLiked && { color: Colors.accent }]}>{formatCount(likeCount)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={focusComment} activeOpacity={0.75}>
              <Ionicons name="chatbubble-outline" size={24} color={Colors.text.secondary} />
              <Text style={styles.actionCount}>{formatCount(activePost._count.comments)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleShare} activeOpacity={0.75}>
              <Ionicons name="share-social-outline" size={24} color={Colors.text.secondary} />
              <Text style={styles.actionCount}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionItem, { marginLeft: "auto" }]} onPress={handleSave} activeOpacity={0.75}>
              <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? Colors.primary : Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Caption */}
          {activePost.caption && (
            <View style={styles.captionBlock}>
              <Text style={styles.captionUser}>{activePost.user.username}</Text>
              <Text style={styles.captionText}> {activePost.caption}</Text>
            </View>
          )}

          {/* Tags */}
          {activePost.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {activePost.tags.map((tag, i) => (
                <Tag key={i} label={`#${tag}`} color={Colors.accentBlue} />
              ))}
            </View>
          )}

          <View style={styles.content}>
            {analysis && <OutfitAnalysisCard analysis={analysis} />}
            {activePost.userId === user?.id && (
              <TouchableOpacity
                style={styles.reanalyzeBtn}
                onPress={handleReanalyze}
                disabled={isReanalyzing}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles-outline" size={14} color={Colors.primary} />
                <Text style={styles.reanalyzeBtnText}>
                  {isReanalyzing ? "Re-analyzing…" : "Re-run AI Analysis"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Rating — always visible so users can rate */}
            <RatingWidget
              postId={id!}
              avgScore={rating.avgScore}
              totalRatings={rating.totalRatings}
              userScore={rating.userScore}
              onRated={(_, avg) =>
                setRating((prev) => ({ ...prev, avgScore: avg }))
              }
            />

            {/* Comments */}
            <View style={styles.commentsSection}>
              <Text style={styles.sectionTitle}>Comments</Text>
              <Text style={styles.sectionCount}>{activePost._count.comments}</Text>
            </View>

            {visibleComments.length === 0 ? (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsText}>Be first to comment</Text>
              </View>
            ) : (
              <View style={{ gap: 16, marginBottom: 16 }}>
                {visibleComments.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.commentRow}
                    onLongPress={() => {
                      if (c.userId === user?.id) handleDeleteComment(c.id);
                    }}
                    activeOpacity={0.85}
                  >
                    <Avatar uri={c.user.avatarUrl} name={c.user.username} size={34} />
                    <View style={styles.commentBubble}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUser}>{c.user.username}</Text>
                        <Text style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</Text>
                      </View>
                      <Text style={styles.commentText}>{c.content}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {comments.length > 3 && !showAllComments && (
                  <TouchableOpacity onPress={() => setShowAllComments(true)}>
                    <Text style={styles.loadMoreComments}>View all {comments.length} comments</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <SimilarOutfits posts={similar} />
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentBar}>
          <Avatar uri={user?.avatarUrl} name={user?.username} size={32} />
          <View style={styles.commentInputWrap}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.text.tertiary}
              returnKeyType="send"
              onSubmitEditing={handleComment}
            />
          </View>
          <TouchableOpacity
            onPress={handleComment}
            disabled={!commentText.trim() || isSubmitting}
            style={[styles.sendBtn, commentText.trim() && styles.sendBtnActive]}
          >
            <Ionicons name="send" size={18} color={commentText.trim() ? Colors.background : Colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // `aspectRatio` derives height from the element's own rendered width — unlike
  // `Dimensions.get("window").width`, it stays correct inside the PhoneFrame's
  // constrained container on web instead of using the full browser viewport.
  heroContainer: { aspectRatio: 1 / 1.2, position: "relative" },
  hero: { width: "100%", height: "100%" },
  heroGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: "50%" },
  navOverlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  nav: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  navBtn: { borderRadius: Radius.full, overflow: "hidden" },
  navBtnBlur: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  heroBottom: { position: "absolute", bottom: 0, left: 0, right: 0, padding: Spacing.lg },
  heroUserRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroUsername: { ...Typography.labelLarge, color: Colors.white },
  heroTime: { ...Typography.caption, color: "rgba(255,255,255,0.65)", marginTop: 1 },
  actionsBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.lg, paddingVertical: 12, gap: 20,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  actionItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { color: Colors.text.secondary, ...Typography.label },
  captionBlock: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  captionUser: { ...Typography.labelLarge, color: Colors.text.primary },
  captionText: { ...Typography.body, color: Colors.text.secondary, flex: 1 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  commentsSection: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: Spacing.md },
  sectionTitle: { ...Typography.title3, color: Colors.text.primary },
  sectionCount: {
    color: Colors.text.tertiary, ...Typography.label,
    backgroundColor: Colors.card, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full,
  },
  noComments: { paddingVertical: 20, alignItems: "center" },
  noCommentsText: { color: Colors.text.tertiary, ...Typography.body },
  commentRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  commentBubble: {
    flex: 1, backgroundColor: Colors.card,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: 12,
  },
  commentHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  commentUser: { ...Typography.label, color: Colors.text.primary },
  commentTime: { ...Typography.caption, color: Colors.text.tertiary },
  commentText: { ...Typography.body, color: Colors.text.secondary, lineHeight: 20 },
  loadMoreComments: { color: Colors.primary, ...Typography.label, textAlign: "center" },
  commentBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderTopWidth: 0.5, borderTopColor: Colors.border, backgroundColor: Colors.surface,
  },
  commentInputWrap: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 9,
  },
  commentInput: { color: Colors.text.primary, ...Typography.body },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.card,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border,
  },
  sendBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  reanalyzeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: Radius.full,
    borderWidth: 1, borderColor: `${Colors.primary}40`,
    backgroundColor: Colors.primarySubtle, marginTop: 8, marginBottom: 4,
  },
  reanalyzeBtnText: { ...Typography.caption, color: Colors.primary, fontWeight: "700" },
});
