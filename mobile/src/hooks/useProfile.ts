import { useState, useEffect, useCallback } from "react";
import { userService } from "@services/userService";
import { postService } from "@services/postService";
import { User, Post } from "@models/index";

export const useProfile = (userId: string) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [profileRes, postsRes] = await Promise.all([
        userService.getProfile(userId),
        postService.getUserPosts(userId),
      ]);
      if (profileRes.data) {
        setProfile(profileRes.data);
        setIsFollowing(profileRes.data.isFollowing ?? false);
      }
      if (postsRes.data) setPosts(postsRes.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const toggleFollow = async () => {
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      await userService.toggleFollow(userId);
    } catch {
      setIsFollowing(prev);
    }
  };

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return { profile, posts, isLoading, error, isFollowing, fetchProfile, toggleFollow };
};
