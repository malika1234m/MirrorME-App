export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  isAdmin?: boolean;
  createdAt: string;
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

export interface OutfitAnalysis {
  id: string;
  postId: string;
  clothingTypes: string[];
  colors: string[];
  fashionStyles: string[];
  stylistTips: string[];
  season: string | null;
  occasion: string | null;
  overallStyle: string | null;
  confidence: number;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string | null;
  tags: string[];
  viewCount: number;
  createdAt: string;
  user: Pick<User, "id" | "username" | "displayName" | "avatarUrl" | "isVerified">;
  outfitAnalysis: OutfitAnalysis | null;
  _count: {
    likes: number;
    comments: number;
    ratings: number;
  };
  isLiked?: boolean;
  isSaved?: boolean;
  avgRating?: number | null;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: Pick<User, "id" | "username" | "avatarUrl" | "displayName">;
}

export interface Rating {
  avgScore: number;
  totalRatings: number;
  userScore: number | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface Story {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string | null;
  expiresAt: string;
  createdAt: string;
  viewed: boolean;
  user: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
}

export interface StoryGroup {
  user: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
  stories: Story[];
  hasUnviewed: boolean;
}

export interface Business {
  id: string;
  brandName: string;
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
  category: string;
  bio: string | null;
  website: string | null;
  instagram: string | null;
  location: string | null;
  isVerified: boolean;
  verificationStatus: "none" | "pending" | "verified" | "rejected";
  tier: string;
  createdAt: string;
  isFollowing?: boolean;
  user: Pick<User, "id" | "username" | "avatarUrl">;
  _count: { products: number; follows: number };
}

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  imageUrl: string;
  shopLink: string | null;
  fashionStyles: string[];
  colors: string[];
  clothingTypes: string[];
  sizes: string[];
  inStock: boolean;
  season: string | null;
  occasion: string | null;
  createdAt: string;
  score?: number;
  business: {
    id: string;
    brandName: string;
    slug: string;
    logoUrl: string | null;
    isVerified: boolean;
    category?: string;
  };
}

export interface MatchResult {
  matches: Product[];
  total: number;
  imageUrl: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
