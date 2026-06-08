import { create } from "zustand";
import { Post, Comment, OutfitAnalysis } from "@models/index";
import { postService } from "@services/postService";
import { aiService } from "@services/aiService";

interface PostStore {
  activePost: Post | null;
  comments: Comment[];
  analysis: OutfitAnalysis | null;
  similar: Post[];
  isLoadingPost: boolean;
  isLoadingComments: boolean;
  fetchPost: (id: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  fetchAnalysis: (postId: string) => Promise<void>;
  fetchSimilar: (postId: string) => Promise<void>;
  reset: () => void;
}

export const usePostStore = create<PostStore>((set) => ({
  activePost: null,
  comments: [],
  analysis: null,
  similar: [],
  isLoadingPost: false,
  isLoadingComments: false,

  fetchPost: async (id) => {
    set({ isLoadingPost: true });
    try {
      const res = await postService.getPost(id);
      if (res.data) set({ activePost: res.data });
    } finally {
      set({ isLoadingPost: false });
    }
  },

  fetchComments: async (postId) => {
    set({ isLoadingComments: true });
    try {
      const res = await postService.getComments(postId);
      set({ comments: res.data || [] });
    } finally {
      set({ isLoadingComments: false });
    }
  },

  addComment: async (postId, content) => {
    const res = await postService.addComment(postId, content);
    if (res.data) {
      set((state) => ({ comments: [res.data!, ...state.comments] }));
    }
  },

  deleteComment: async (commentId) => {
    await postService.deleteComment(commentId);
    set((state) => ({ comments: state.comments.filter((c) => c.id !== commentId) }));
  },

  fetchAnalysis: async (postId) => {
    const res = await aiService.getAnalysis(postId);
    if (res.data) set({ analysis: res.data });
  },

  fetchSimilar: async (postId) => {
    const res = await aiService.getSimilar(postId);
    if (res.data) set({ similar: res.data });
  },

  reset: () => set({ activePost: null, comments: [], analysis: null, similar: [] }),
}));
