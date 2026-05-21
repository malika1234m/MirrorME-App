import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { User } from "@types/index";
import { Colors, Typography, Radius, Spacing } from "@constants/colors";
import { Avatar } from "@components/ui/Avatar";
import { Button } from "@components/ui/Button";
import { formatCount } from "@utils/formatters";

interface Props {
  user: User;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollowToggle: () => void;
  onEditPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

export const ProfileHeader: React.FC<Props> = ({
  user, isOwnProfile, isFollowing, onFollowToggle,
  onEditPress, onFollowersPress, onFollowingPress,
}) => {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out @${user.username} on MirrorME — ${user.bio ?? "fashion creator"}`,
      });
    } catch {}
  };

  return (
    <View style={styles.container}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          <Avatar uri={user.avatarUrl} name={user.displayName || user.username} size={84} />
          {user.isVerified && (
            <View style={styles.verifiedBadge}>
              <LinearGradient colors={Colors.gradient.primary} style={styles.verifiedGradient}>
                <Ionicons name="checkmark" size={10} color={Colors.background} />
              </LinearGradient>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          <StatItem value={user._count?.posts || 0} label="Posts" />
          <View style={styles.statDivider} />
          <StatItem value={user._count?.followers || 0} label="Followers" onPress={onFollowersPress} />
          <View style={styles.statDivider} />
          <StatItem value={user._count?.following || 0} label="Following" onPress={onFollowingPress} />
        </View>
      </View>

      {/* Name + bio */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{user.displayName || user.username}</Text>
          {user.isVerified && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />}
        </View>
        <Text style={styles.username}>@{user.username}</Text>
        {user.bio ? (
          <Text style={styles.bio}>{user.bio}</Text>
        ) : isOwnProfile ? (
          <TouchableOpacity onPress={onEditPress}>
            <Text style={styles.addBio}>+ Add bio</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {isOwnProfile ? (
          <View style={styles.ownActions}>
            <Button title="Edit Profile" variant="secondary" onPress={onEditPress} style={{ flex: 1 }} />
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.otherActions}>
            <Button
              title={isFollowing ? "Following" : "Follow"}
              variant={isFollowing ? "secondary" : "primary"}
              gradient={!isFollowing}
              onPress={onFollowToggle}
              style={{ flex: 1 }}
            />
            <Button
              title="Message"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => Alert.alert("Messaging", "Direct messages coming soon!")}
            />
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
              <Ionicons name="ellipsis-horizontal" size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const StatItem = ({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.statItem} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
    <Text style={styles.statValue}>{formatCount(value)}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, paddingTop: Spacing.md },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md, gap: Spacing.lg },
  avatarWrapper: { position: "relative" },
  verifiedBadge: {
    position: "absolute", bottom: 2, right: 2,
    borderRadius: Radius.full, overflow: "hidden", borderWidth: 2, borderColor: Colors.background,
  },
  verifiedGradient: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  stats: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  statItem: { alignItems: "center", gap: 3 },
  statValue: { ...Typography.title3, color: Colors.text.primary },
  statLabel: { ...Typography.caption, color: Colors.text.tertiary },
  info: { marginBottom: Spacing.lg, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  displayName: { ...Typography.title3, color: Colors.text.primary },
  username: { ...Typography.body, color: Colors.text.tertiary },
  bio: { ...Typography.body, color: Colors.text.secondary, lineHeight: 22, marginTop: 4 },
  addBio: { color: Colors.primary, ...Typography.body, marginTop: 4 },
  actions: {},
  ownActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  otherActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconBtn: {
    width: 44, height: 44, borderRadius: Radius.lg,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
});
