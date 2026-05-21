import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";

export const toggleLike = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { postId } = req.params;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) { sendError(res, "Post not found", 404); return; }

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId: req.userId! } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    const count = await prisma.like.count({ where: { postId } });
    sendSuccess(res, { liked: false, count }, "Unliked");
  } else {
    await prisma.like.create({ data: { postId, userId: req.userId! } });
    const count = await prisma.like.count({ where: { postId } });
    sendSuccess(res, { liked: true, count }, "Liked");
  }
};
