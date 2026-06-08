import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing } from "@constants/colors";
import { Avatar } from "@components/ui/Avatar";
import { storyService } from "@services/storyService";
import { useStoryStore } from "@store/storyStore";
import { useAuthStore } from "@store/authStore";
import { StoryGroup } from "@models/index";

export const StoriesBar: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { openViewer } = useStoryStore();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    try {
      const res = await storyService.getStories();
      setGroups(res.data ?? []);
    } catch {
      // silently fail — stories are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStories(); }, []);

  const openStory = (groupIndex: number) => {
    openViewer(groups, groupIndex);
    router.push("/stories/viewer");
  };

  const myGroupIndex = groups.findIndex((g) => g.user.id === user?.id);
  const hasMyStory = myGroupIndex !== -1;

  return (
    <FlatList
      data={groups}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      keyExtractor={(item) => item.user.id}
      ListHeaderComponent={
        <AddStoryButton
          hasStory={hasMyStory}
          onPress={() => {
            if (hasMyStory) openStory(myGroupIndex);
            else router.push("/stories/create");
          }}
        />
      }
      ListEmptyComponent={loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.text.tertiary} />
        </View>
      ) : null}
      renderItem={({ item, index }) => (
        <StoryItem
          group={item}
          onPress={() => openStory(index)}
        />
      )}
    />
  );
};

/* ─── Individual story bubble ──────────────────────────────── */
const StoryItem = ({ group, onPress }: { group: StoryGroup; onPress: () => void }) => (
  <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.8}>
    <Avatar
      uri={group.user.avatarUrl}
      name={group.user.displayName ?? group.user.username}
      size={58}
      hasStory={group.hasUnviewed}
    />
    {!group.hasUnviewed && <View style={styles.seenOverlay} />}
    <Text style={styles.storyName} numberOfLines={1}>
      {(group.user.username ?? "").split(".")[0]}
    </Text>
  </TouchableOpacity>
);

/* ─── "Your Story" / add button ───────────────────────────── */
const AddStoryButton = ({ hasStory, onPress }: { hasStory: boolean; onPress: () => void }) => (
  <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.addBtn}>
      <LinearGradient colors={Colors.gradient.dark} style={[StyleSheet.absoluteFill, { borderRadius: 31 }]} />
      {hasStory ? (
        /* Has a story — show gradient ring + "+" */
        <LinearGradient
          colors={Colors.gradient.primary}
          style={styles.addRing}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={styles.addRingInner}>
            <Ionicons name="add" size={20} color={Colors.primary} />
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.addIconCircle}>
          <Ionicons name="add" size={22} color={Colors.primary} />
        </View>
      )}
    </View>
    <Text style={styles.storyName}>Your Story</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  item: { alignItems: "center", gap: 6, width: 66 },
  addBtn: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: Colors.card,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  addRing: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: "center", justifyContent: "center",
  },
  addRingInner: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.background,
    alignItems: "center", justifyContent: "center",
  },
  addIconCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primarySubtle,
    borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  seenOverlay: {
    position: "absolute", top: 0,
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  storyName: {
    color: Colors.text.secondary,
    fontSize: 11, fontWeight: "500", textAlign: "center",
  },
  loadingWrap: { paddingHorizontal: Spacing.xl, justifyContent: "center", alignItems: "center" },
});
