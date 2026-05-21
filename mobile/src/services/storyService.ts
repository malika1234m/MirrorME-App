import { api } from "./api";
import { ApiResponse, Story, StoryGroup } from "@types/index";

export const storyService = {
  getStories: () =>
    api.get<ApiResponse<StoryGroup[]>>("/stories"),

  createStory: (formData: FormData) =>
    api.post<ApiResponse<Story>>("/stories", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  viewStory: (storyId: string) =>
    api.post<ApiResponse<null>>(`/stories/${storyId}/view`),

  getViewers: (storyId: string) =>
    api.get<ApiResponse<{ views: Pick<import("@types/index").User, "id" | "username" | "avatarUrl" | "displayName">[]; count: number }>>(`/stories/${storyId}/viewers`),

  deleteStory: (storyId: string) =>
    api.delete<ApiResponse<null>>(`/stories/${storyId}`),
};
