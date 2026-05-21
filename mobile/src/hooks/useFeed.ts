import { useEffect } from "react";
import { useFeedStore } from "@store/feedStore";

export const useFeed = () => {
  const store = useFeedStore();

  useEffect(() => {
    if (store.posts.length === 0) store.fetchFeed();
  }, []);

  return store;
};
