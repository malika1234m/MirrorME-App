import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";

export const toggleFollow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId: targetId } = req.params;

  if (targetId === req.userId) { sendError(res, "Cannot follow yourself", 400); return; }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) { sendError(res, "User not found", 404); return; }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.userId!, followingId: targetId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    sendSuccess(res, { following: false }, "Unfollowed");
  } else {
    await prisma.follow.create({ data: { followerId: req.userId!, followingId: targetId } });
    sendSuccess(res, { following: true }, "Following");
  }
};

export const getFollowers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  sendSuccess(res, followers.map((f) => f.follower));
};

export const getFollowing = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  sendSuccess(res, following.map((f) => f.following));
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, username: true, displayName: true, avatarUrl: true, bio: true,
      isVerified: true, createdAt: true,
      _count: { select: { posts: true, followers: true, following: true } },
    },
  });

  if (!user) { sendError(res, "User not found", 404); return; }

  const isFollowing = !!(await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.userId!, followingId: userId } },
  }));

  sendSuccess(res, { ...user, isFollowing });
};
