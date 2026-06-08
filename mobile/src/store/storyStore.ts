import { create } from "zustand";
import { StoryGroup } from "@models/index";

interface StoryStore {
  groups: StoryGroup[];
  activeGroupIndex: number;
  openViewer: (groups: StoryGroup[], groupIndex: number) => void;
  markViewed: (groupIndex: number, storyIndex: number) => void;
  reset: () => void;
}

export const useStoryStore = create<StoryStore>((set) => ({
  groups: [],
  activeGroupIndex: 0,

  openViewer: (groups, groupIndex) =>
    set({ groups, activeGroupIndex: groupIndex }),

  markViewed: (groupIndex, storyIndex) =>
    set((state) => {
      const groups = [...state.groups];
      const group = { ...groups[groupIndex] };
      const stories = [...group.stories];
      stories[storyIndex] = { ...stories[storyIndex], viewed: true };
      group.stories = stories;
      group.hasUnviewed = stories.some((s) => !s.viewed);
      groups[groupIndex] = group;
      return { groups };
    }),

  reset: () => set({ groups: [], activeGroupIndex: 0 }),
}));
