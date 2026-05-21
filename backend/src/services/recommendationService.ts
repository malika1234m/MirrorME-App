import { prisma } from "../config/database";

export const getSimilarOutfits = async (
  postId: string,
  userId: string,
  limit = 10
) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { outfitAnalysis: true },
  });

  if (!post?.outfitAnalysis) {
    return prisma.post.findMany({
      where: { isPublic: true, id: { not: postId }, userId: { not: userId } },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
        outfitAnalysis: true,
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  const { clothingTypes, fashionStyles, colors } = post.outfitAnalysis;

  // Score posts by overlapping tags using Prisma's array contains
  const similar = await prisma.post.findMany({
    where: {
      isPublic: true,
      id: { not: postId },
      userId: { not: userId },
      outfitAnalysis: {
        OR: [
          { fashionStyles: { hasSome: fashionStyles } },
          { clothingTypes: { hasSome: clothingTypes } },
          { colors: { hasSome: colors } },
        ],
      },
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
      outfitAnalysis: true,
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return similar;
};

export const getTrendingPosts = async (limit = 20) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return prisma.post.findMany({
    where: { isPublic: true, createdAt: { gte: oneDayAgo } },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
      outfitAnalysis: true,
      _count: { select: { likes: true, comments: true, ratings: true } },
    },
    orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
    take: limit,
  });
};
