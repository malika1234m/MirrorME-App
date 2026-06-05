import { create } from "zustand";
import { wardrobeService } from "@services/wardrobeService";
import { Product } from "@types/index";

interface WardrobeStore {
  items: Product[];
  itemIds: Set<string>;
  isLoading: boolean;
  load: () => Promise<void>;
  toggle: (productId: string) => Promise<boolean>;
  isInWardrobe: (productId: string) => boolean;
}

export const useWardrobeStore = create<WardrobeStore>((set, get) => ({
  items: [],
  itemIds: new Set(),
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const res = await wardrobeService.getItems();
      if (res.data) {
        set({ items: res.data, itemIds: new Set(res.data.map((p) => p.id)) });
      }
    } catch {
      // silent
    } finally {
      set({ isLoading: false });
    }
  },

  toggle: async (productId: string) => {
    const { itemIds, items } = get();
    const wasIn = itemIds.has(productId);

    // Snapshot for revert — must be taken BEFORE mutating state
    const snapshotIds = new Set(itemIds);
    const snapshotItems = items;

    // Optimistic update
    const newIds = new Set(itemIds);
    if (wasIn) {
      newIds.delete(productId);
      set({ itemIds: newIds, items: items.filter((p) => p.id !== productId) });
    } else {
      newIds.add(productId);
      set({ itemIds: newIds });
    }

    try {
      const res = await wardrobeService.toggleItem(productId);
      return res.data?.inWardrobe ?? !wasIn;
    } catch {
      // Revert both itemIds AND items to pre-optimistic state
      set({ itemIds: snapshotIds, items: snapshotItems });
      return wasIn;
    }
  },

  isInWardrobe: (productId: string) => get().itemIds.has(productId),
}));
