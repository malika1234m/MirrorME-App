import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError, buildPaginationMeta } from "../utils/response";
import { AuthenticatedRequest } from "../types";

export const addComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { postId } = req.params;
  const { content } = req.body;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) { sendError(res, "Post not found", 404); return; }

  const comment = await prisma.comment.create({
    data: { postId, userId: req.userId!, content },
    include: { user: { select: { id: true, username: true, avatarUrl: true, displayName: true } } },
  });

  sendSuccess(res, comment, "Comment added", 201);
};

export const getComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { postId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      include: { user: { select: { id: true, username: true, avatarUrl: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where: { postId } }),
  ]);

  sendSuccess(res, comments, "Comments fetched", 200, buildPaginationMeta(total, page, limit));
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) { sendError(res, "Comment not found", 404); return; }
  if (comment.userId !== req.userId) { sendError(res, "Forbidden", 403); return; }

  await prisma.comment.delete({ where: { id } });
  sendSuccess(res, null, "Comment deleted");
};
