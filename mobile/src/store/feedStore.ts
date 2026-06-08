import { create } from "zustand";
import { Post } from "@models/index";
import { postService } from "@services/postService";

interface FeedStore {
  posts: Post[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  fetchFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  loadMore: () => Promise<void>;
  toggleLikeOptimistic: (postId: string) => void;
  addPost: (post: Post) => void;
  removePost: (postId: string) => void;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  posts: [],
  page: 1,
  hasMore: true,
  isLoading: false,
  isRefreshing: false,

  fetchFeed: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const res = await postService.getFeed(1);
      set({
        posts: res.data || [],
        page: 1,
        hasMore: res.meta?.hasMore ?? false,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false, hasMore: false });
    }
  },

  refreshFeed: async () => {
    set({ isRefreshing: true });
    try {
      const res = await postService.getFeed(1);
      set({
        posts: res.data || [],
        page: 1,
        hasMore: res.meta?.hasMore ?? false,
      });
    } finally {
      set({ isRefreshing: false });
    }
  },

  loadMore: async () => {
    const { page, hasMore, isLoading, posts } = get();
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    set({ isLoading: true });
    try {
      const res = await postService.getFeed(nextPage);
      set({
        posts: [...posts, ...(res.data || [])],
        page: nextPage,
        hasMore: res.meta?.hasMore ?? false,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  toggleLikeOptimistic: (postId) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              isLiked: !p.isLiked,
              _count: {
                ...p._count,
                likes: p.isLiked ? p._count.likes - 1 : p._count.likes + 1,
              },
            }
      ),
    }));
  },

  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),

  removePost: (postId) =>
    set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) })),
}));
