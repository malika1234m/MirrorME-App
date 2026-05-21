import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";

export const ratePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { postId } = req.params;
  const { score } = req.body;

  if (score < 1 || score > 10) { sendError(res, "Score must be between 1 and 10", 400); return; }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) { sendError(res, "Post not found", 404); return; }
  if (post.userId === req.userId) { sendError(res, "Cannot rate your own post", 400); return; }

  const rating = await prisma.rating.upsert({
    where: { postId_userId: { postId, userId: req.userId! } },
    update: { score },
    create: { postId, userId: req.userId!, score },
  });

  const agg = await prisma.rating.aggregate({
    where: { postId },
    _avg: { score: true },
    _count: { score: true },
  });

  sendSuccess(res, {
    rating,
    avgScore: Math.round((agg._avg.score || 0) * 10) / 10,
    totalRatings: agg._count.score,
  }, "Rated successfully");
};

export const getPostRating = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { postId } = req.params;

  const [agg, userRating] = await Promise.all([
    prisma.rating.aggregate({
      where: { postId },
      _avg: { score: true },
      _count: { score: true },
    }),
    prisma.rating.findUnique({
      where: { postId_userId: { postId, userId: req.userId! } },
    }),
  ]);

  sendSuccess(res, {
    avgScore: Math.round((agg._avg.score || 0) * 10) / 10,
    totalRatings: agg._count.score,
    userScore: userRating?.score || null,
  });
};
