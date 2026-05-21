import React, { useState } from "react";
import {
  ScrollView, View, Text, TouchableOpacity,
  RefreshControl, StyleSheet, FlatList, Modal, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { useProfile } from "@hooks/useProfile";
import { useAuthStore } from "@store/authStore";
import { ProfileHeader } from "@components/profile/ProfileHeader";
import { PostGrid } from "@components/profile/PostGrid";
import { ProfileSkeleton } from "@components/ui/SkeletonCard";
import { Avatar } from "@components/ui/Avatar";
import { userService } from "@services/userService";
import { User } from "@types/index";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { profile, posts, isLoading, error, isFollowing, fetchProfile, toggleFollow } = useProfile(id!);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [followModal, setFollowModal] = useState<{ type: "followers" | "following"; users: User[] } | null>(null);
  const [followModalLoading, setFollowModalLoading] = useState(false);

  const isOwnProfile = currentUser?.id === id;

  const openFollowList = async (type: "followers" | "following") => {
    setFollowModalLoading(true);
    setFollowModal({ type, users: [] });
    try {
      const res = type === "followers"
        ? await userService.getFollowers(id!)
        : await userService.getFollowing(id!);
      setFollowModal({ type, users: res.data ?? [] });
    } finally {
      setFollowModalLoading(false);
    }
  };

  const handleOptions = () =>
    Alert.alert("Options", undefined, [
      { text: "Report User", style: "destructive", onPress: () => Alert.alert("Reported", "Thanks for keeping MirrorME safe.") },
      { text: "Cancel", style: "cancel" },
    ]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfile();
    setIsRefreshing(false);
  };

  if (isLoading) return <ProfileSkeleton />;

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.nav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Profile</Text>
          <View style={styles.navBtn} />
        </View>
        <View style={styles.errorWrap}>
          <Ionicons name="wifi-outline" size={48} color={Colors.text.tertiary} />
          <Text style={styles.errorTitle}>Couldn't load profile</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {profile?.username ? `@${profile.username}` : "Profile"}
        </Text>
        <TouchableOpacity style={styles.navBtn} onPress={handleOptions}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} progressBackgroundColor={Colors.card} />
        }
      >
        {profile && (
          <ProfileHeader
            user={profile}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onFollowToggle={toggleFollow}
            onFollowersPress={() => openFollowList("followers")}
            onFollowingPress={() => openFollowList("following")}
          />
        )}

        <View style={styles.tabRow}>
          <View style={styles.tabActive}>
            <Ionicons name="grid" size={18} color={Colors.primary} />
            <View style={styles.tabIndicator} />
          </View>
          <View style={styles.tabInactive}>
            <Ionicons name="play-circle-outline" size={18} color={Colors.text.tertiary} />
          </View>
        </View>

        {posts.length > 0 ? (
          <PostGrid posts={posts} />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={36} color={Colors.text.tertiary} />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Follow list modal */}
      <Modal
        visible={!!followModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFollowModal(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {followModal?.type === "followers" ? "Followers" : "Following"}
            </Text>
            <TouchableOpacity onPress={() => setFollowModal(null)}>
              <Ionicons name="close" size={22} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
          {followModalLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
          ) : (
            <FlatList
              data={followModal?.users ?? []}
              keyExtractor={(u) => u.id}
              contentContainerStyle={{ padding: Spacing.lg, gap: 16 }}
              ListEmptyComponent={<Text style={styles.emptyList}>No users here yet</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userRow}
                  onPress={() => { setFollowModal(null); router.push(`/profile/${item.id}`); }}
                  activeOpacity={0.8}
                >
                  <Avatar uri={item.avatarUrl} name={item.displayName ?? item.username} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userRowName}>{item.displayName ?? item.username}</Text>
                    <Text style={styles.userRowHandle}>@{item.username}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  nav: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  navTitle: { ...Typography.title3, color: Colors.text.primary, maxWidth: 200 },
  tabRow: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: Colors.border },
  tabActive: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, position: "relative" },
  tabInactive: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14 },
  tabIndicator: {
    position: "absolute", bottom: 0, left: "25%", right: "25%",
    height: 2, backgroundColor: Colors.primary, borderRadius: 1,
  },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { ...Typography.body, color: Colors.text.tertiary },
  errorWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 40 },
  errorTitle: { ...Typography.title3, color: Colors.text.primary, textAlign: "center" },
  errorSub: { ...Typography.body, color: Colors.text.tertiary, textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.primary, marginTop: 4,
  },
  retryBtnText: { color: Colors.primary, ...Typography.label, fontWeight: "700" },
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  modalTitle: { ...Typography.title3, color: Colors.text.primary },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  userRowName: { ...Typography.labelLarge, color: Colors.text.primary },
  userRowHandle: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
  emptyList: { color: Colors.text.tertiary, ...Typography.body, textAlign: "center", marginTop: 40 },
});
