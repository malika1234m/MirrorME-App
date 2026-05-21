import { api } from "./api";
import { ApiResponse, Post, Comment, Rating } from "@types/index";

export const postService = {
  getFeed: (page = 1) =>
    api.get<ApiResponse<Post[]>>(`/posts/feed?page=${page}&limit=10`),

  getExplore: (page = 1, style?: string) =>
    api.get<ApiResponse<Post[]>>(`/posts/explore?page=${page}&limit=12${style ? `&style=${style}` : ""}`),

  getPost: (id: string) => api.get<ApiResponse<Post>>(`/posts/${id}`),

  getUserPosts: (userId: string, page = 1) =>
    api.get<ApiResponse<Post[]>>(`/posts/user/${userId}?page=${page}&limit=12`),

  createPost: (formData: FormData) =>
    api.post<ApiResponse<Post>>("/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deletePost: (id: string) => api.delete<ApiResponse<null>>(`/posts/${id}`),

  toggleLike: (postId: string) =>
    api.post<ApiResponse<{ liked: boolean; count: number }>>(`/posts/${postId}/like`),

  getComments: (postId: string, page = 1) =>
    api.get<ApiResponse<Comment[]>>(`/comments/${postId}?page=${page}`),

  addComment: (postId: string, content: string) =>
    api.post<ApiResponse<Comment>>(`/comments/${postId}`, { content }),

  deleteComment: (id: string) => api.delete<ApiResponse<null>>(`/comments/${id}`),

  ratePost: (postId: string, score: number) =>
    api.post<ApiResponse<{ rating: Rating; avgScore: number; totalRatings: number }>>(
      `/ratings/${postId}`,
      { score }
    ),

  getRating: (postId: string) =>
    api.get<ApiResponse<Rating>>(`/ratings/${postId}`),
};
