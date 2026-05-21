export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export const FASHION_STYLES = [
  "All",
  "Streetwear",
  "Minimalist",
  "Y2K",
  "Cottagecore",
  "Dark Academia",
  "Business Casual",
  "Athleisure",
  "Boho",
  "Preppy",
  "Grunge",
  "Old Money",
] as const;

export const RATING_LABELS: Record<number, string> = {
  1: "Needs Work",
  2: "Basic",
  3: "Okay",
  4: "Not Bad",
  5: "Average",
  6: "Decent",
  7: "Good",
  8: "Great",
  9: "Fire",
  10: "Iconic",
};

export const MAX_CAPTION_LENGTH = 300;
export const MAX_TAGS = 10;
export const FEED_PAGE_SIZE = 10;
export const GRID_PAGE_SIZE = 12;
