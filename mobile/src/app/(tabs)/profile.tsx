import React, { useState, useCallback, useEffect } from "react";
import {
  ScrollView, View, Text, TouchableOpacity, Alert,
  RefreshControl, StyleSheet, FlatList, Modal, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuthStore } from "@store/authStore";
import { useProfile } from "@hooks/useProfile";
import { ProfileHeader } from "@components/profile/ProfileHeader";
import { PostGrid } from "@components/profile/PostGrid";
import { ProfileSkeleton } from "@components/ui/SkeletonCard";
import { Avatar } from "@components/ui/Avatar";
import { Colors, Typography, Spacing, Radius } from "@constants/colors";
import { aiService } from "@services/aiService";
import { userService } from "@services/userService";
import { StyleDNA } from "@components/profile/StyleDNA";
import { Post, User, Business } from "@types/index";
import { businessService } from "@services/businessService";

type Tab = "posts" | "saved";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [followModal, setFollowModal] = useState<{ type: "followers" | "following"; users: User[] } | null>(null);
  const [followModalLoading, setFollowModalLoading] = useState(false);
  const [myBusiness, setMyBusiness] = useState<Business | null | "none">("none");

  const { profile, posts, isLoading, error, fetchProfile } = useProfile(user?.id ?? "");

  useEffect(() => {
    businessService.getMe()
      .then((res) => setMyBusiness(res.data ?? null))
      .catch(() => setMyBusiness(null));
  }, []);

  const handleTabChange = async (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "saved" && !savedLoaded) {
      setSavedLoading(true);
      try {
        const res = await aiService.getSaved();
        setSavedPosts(res.data ?? []);
        setSavedLoaded(true);
      } finally {
        setSavedLoading(false);
      }
    }
  };

  const openFollowList = async (type: "followers" | "following") => {
    setFollowModalLoading(true);
    setFollowModal({ type, users: [] });
    try {
      const res = type === "followers"
        ? await userService.getFollowers(user!.id)
        : await userService.getFollowing(user!.id);
      setFollowModal({ type, users: res.data ?? [] });
    } finally {
      setFollowModalLoading(false);
    }
  };

  const handleLogout = () =>
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfile();
    if (activeTab === "saved") {
      const res = await aiService.getSaved().catch(() => ({ data: savedPosts }));
      setSavedPosts(res.data ?? []);
    }
    setIsRefreshing(false);
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header Bar */}
      <View style={styles.navBar}>
        <Text style={styles.navUsername}>@{user?.username}</Text>
        <View style={styles.navActions}>
          {user?.isAdmin && (
            <TouchableOpacity style={[styles.navBtn, styles.adminBtn]} onPress={() => router.push("/admin")}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push("/stories/create")}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
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
            isOwnProfile
            isFollowing={false}
            onFollowToggle={() => {}}
            onEditPress={() => router.push("/profile/edit")}
            onFollowersPress={() => openFollowList("followers")}
            onFollowingPress={() => openFollowList("following")}
          />
        )}

        {/* Style DNA */}
        {posts.length > 0 && <StyleDNA posts={posts} />}

        {/* My Brand */}
        {myBusiness !== "none" && (
          myBusiness ? (
            <View style={styles.brandSection}>
              <View style={styles.brandSectionHeader}>
                <Ionicons name="storefront" size={16} color={Colors.primary} />
                <Text style={styles.brandSectionTitle}>My Brand</Text>
              </View>
              <TouchableOpacity
                style={styles.brandCard}
                onPress={() => router.push(`/business/${myBusiness.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.brandCardLeft}>
                  <View style={styles.brandInitial}>
                    <Text style={styles.brandInitialText}>{myBusiness.brandName[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.brandCardName}>{myBusiness.brandName}</Text>
                      {myBusiness.isVerified && (
                        <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
                      )}
                    </View>
                    <Text style={styles.brandCardCategory}>{myBusiness.category}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.editBrandBtn}
                  onPress={() => router.push("/business/edit")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={14} color={Colors.background} />
                  <Text style={styles.editBrandText}>Edit</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.createBrandCta}
              onPress={() => router.push("/business/register")}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[Colors.primarySubtle, "transparent"]} style={StyleSheet.absoluteFill} />
              <Ionicons name="storefront-outline" size={20} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.createBrandTitle}>List Your Brand on MirrorME</Text>
                <Text style={styles.createBrandSub}>Get discovered by users who match your style</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )
        )}

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {(["posts", "saved"] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => handleTabChange(tab)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab === "posts" ? "grid-outline" : "bookmark-outline"}
                size={20}
                color={activeTab === tab ? Colors.primary : Colors.text.tertiary}
              />
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "posts" ? (
          posts.length > 0 ? <PostGrid posts={posts} /> : <EmptyPosts />
        ) : savedLoading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : savedPosts.length > 0 ? (
          <PostGrid posts={savedPosts} />
        ) : (
          <EmptySaved />
        )}
      </ScrollView>

      {/* Followers / Following modal */}
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
              ListEmptyComponent={
                <Text style={styles.emptyList}>No users here yet</Text>
              }
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

const EmptyPosts = () => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}><Ionicons name="camera-outline" size={34} color={Colors.primary} /></View>
    <Text style={styles.emptyTitle}>No Posts Yet</Text>
    <Text style={styles.emptySubtext}>Share your first outfit to get AI style analysis and community ratings</Text>
  </View>
);

const EmptySaved = () => (
  <View style={styles.empty}>
    <View style={[styles.emptyIcon, { backgroundColor: Colors.accentBlueSubtle }]}>
      <Ionicons name="bookmark-outline" size={34} color={Colors.accentBlue} />
    </View>
    <Text style={styles.emptyTitle}>No Saved Outfits</Text>
    <Text style={styles.emptySubtext}>Bookmark outfits you love and find them here</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  navUsername: { ...Typography.title3, color: Colors.text.primary },
  navActions: { flexDirection: "row", gap: 4 },
  adminBtn: { backgroundColor: Colors.primarySubtle, borderColor: `${Colors.primary}40` },
  navBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  tabBar: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: Colors.border },
  tab: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 14, position: "relative",
  },
  tabActive: {},
  tabIndicator: {
    position: "absolute", bottom: 0, left: "25%", right: "25%",
    height: 2, backgroundColor: Colors.primary, borderRadius: 1,
  },
  empty: { alignItems: "center", paddingTop: 56, paddingHorizontal: 40, gap: 12, paddingBottom: 40 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.primarySubtle,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { ...Typography.title3, color: Colors.text.primary, textAlign: "center" },
  emptySubtext: { ...Typography.body, color: Colors.text.secondary, textAlign: "center", lineHeight: 22 },
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
  // Brand section
  brandSection: { paddingHorizontal: Spacing.lg, paddingVertical: 12 },
  brandSectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  brandSectionTitle: { ...Typography.caption, color: Colors.text.tertiary, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "700" },
  brandCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
  },
  brandCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  brandInitial: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primarySubtle, borderWidth: 1, borderColor: `${Colors.primary}30`,
    alignItems: "center", justifyContent: "center",
  },
  brandInitialText: { color: Colors.primary, fontSize: 18, fontWeight: "900" },
  brandCardName: { ...Typography.labelLarge, color: Colors.text.primary },
  brandCardCategory: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
  editBrandBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  editBrandText: { color: Colors.background, fontSize: 12, fontWeight: "700" },
  createBrandCta: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: Spacing.lg, marginVertical: 12,
    padding: Spacing.lg, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: `${Colors.primary}30`,
    overflow: "hidden",
  },
  createBrandTitle: { ...Typography.labelLarge, color: Colors.primary },
  createBrandSub: { ...Typography.caption, color: Colors.text.tertiary, marginTop: 2 },
});
