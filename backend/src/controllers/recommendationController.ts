import { Response } from "express";
import { sendSuccess } from "../utils/response";
import { getSimilarOutfits, getTrendingPosts } from "../services/recommendationService";
import { AuthenticatedRequest } from "../types";

export const similar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { postId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  const posts = await getSimilarOutfits(postId, req.userId!, limit);
  sendSuccess(res, posts, "Similar outfits fetched");
};

export const trending = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const posts = await getTrendingPosts(20);
  sendSuccess(res, posts, "Trending outfits");
};
