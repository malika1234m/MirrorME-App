import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError, buildPaginationMeta } from "../utils/response";
import { analyzeOutfit } from "../services/openaiService";
import { deleteImage } from "../services/cloudinaryService";
import { AuthenticatedRequest } from "../types";

const POST_SELECT = {
  id: true, imageUrl: true, caption: true, tags: true, viewCount: true, createdAt: true,
  user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
  outfitAnalysis: true,
  _count: { select: { likes: true, comments: true, ratings: true } },
};

export const createPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const file = req.file as Express.Multer.File & { path: string; filename: string };

  if (!file) { sendError(res, "Image is required", 400); return; }

  const { caption, tags } = req.body;
  const parsedTags: string[] = tags ? JSON.parse(tags) : [];

  const post = await prisma.post.create({
    data: {
      userId: req.userId!,
      imageUrl: file.path,
      publicId: file.filename,
      caption,
      tags: parsedTags,
    },
    include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } } },
  });

  // Run AI analysis async — don't block response
  analyzeOutfit(file.path)
    .then((analysis) =>
      prisma.outfitAnalysis.create({
        data: {
          postId: post.id,
          clothingTypes: analysis.clothingTypes,
          colors: analysis.colors,
          fashionStyles: analysis.fashionStyles,
          stylistTips: analysis.stylistTips,
          season: analysis.season,
          occasion: analysis.occasion,
          overallStyle: analysis.overallStyle,
          confidence: analysis.confidence,
          rawResponse: analysis as object,
        },
      })
    )
    .catch(console.error);

  sendSuccess(res, post, "Post created — AI analysis running", 201);
};

export const getFeed = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const followingIds = await prisma.follow.findMany({
    where: { followerId: req.userId },
    select: { followingId: true },
  });

  const ids = followingIds.map((f) => f.followingId);
  ids.push(req.userId!);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { userId: { in: ids }, isPublic: true },
      select: POST_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.post.count({ where: { userId: { in: ids }, isPublic: true } }),
  ]);

  const postIds = posts.map((p) => p.id);

  const [likedPostIds, savedPostIds] = await Promise.all([
    prisma.like.findMany({
      where: { userId: req.userId, postId: { in: postIds } },
      select: { postId: true },
    }).then((r) => new Set(r.map((l) => l.postId))),
    prisma.savedOutfit.findMany({
      where: { userId: req.userId, postId: { in: postIds } },
      select: { postId: true },
    }).then((r) => new Set(r.map((s) => s.postId))),
  ]);

  const enriched = posts.map((p) => ({
    ...p,
    isLiked: likedPostIds.has(p.id),
    isSaved: savedPostIds.has(p.id),
  }));

  sendSuccess(res, enriched, "Feed fetched", 200, buildPaginationMeta(total, page, limit));
};

export const getPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
      outfitAnalysis: true,
      comments: {
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      ratings: { select: { score: true } },
      _count: { select: { likes: true, comments: true, ratings: true } },
    },
  });

  if (!post) { sendError(res, "Post not found", 404); return; }

  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  const avgRating = post.ratings.length
    ? post.ratings.reduce((sum, r) => sum + r.score, 0) / post.ratings.length
    : null;

  const isLiked = !!(await prisma.like.findUnique({
    where: { postId_userId: { postId: id, userId: req.userId! } },
  }));

  const { ratings, ...postData } = post;
  sendSuccess(res, { ...postData, avgRating, isLiked });
};

export const deletePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) { sendError(res, "Post not found", 404); return; }
  if (post.userId !== req.userId) { sendError(res, "Forbidden", 403); return; }

  await deleteImage(post.publicId);
  await prisma.post.delete({ where: { id } });

  sendSuccess(res, null, "Post deleted");
};

export const getUserPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { userId, isPublic: true },
      select: POST_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.post.count({ where: { userId, isPublic: true } }),
  ]);

  sendSuccess(res, posts, "Posts fetched", 200, buildPaginationMeta(total, page, limit));
};

export const explorePosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;
  const style = req.query.style as string | undefined;

  const where = {
    isPublic: true,
    ...(style && { outfitAnalysis: { fashionStyles: { has: style } } }),
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: POST_SELECT,
      orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  sendSuccess(res, posts, "Explore posts", 200, buildPaginationMeta(total, page, limit));
};
