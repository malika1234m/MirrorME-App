import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";

const STORY_TTL_HOURS = 24;

export const getStories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const now = new Date();

  // People I follow + myself
  const following = await prisma.follow.findMany({
    where: { followerId: req.userId },
    select: { followingId: true },
  });
  const userIds = [req.userId!, ...following.map((f) => f.followingId)];

  const stories = await prisma.story.findMany({
    where: { userId: { in: userIds }, expiresAt: { gt: now } },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      views: { where: { userId: req.userId! }, select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by user, own stories first
  const byUser = new Map<string, typeof stories>();
  for (const s of stories) {
    if (!byUser.has(s.userId)) byUser.set(s.userId, []);
    byUser.get(s.userId)!.push(s);
  }

  // Own stories first, then by createdAt of first story
  const orderedIds = [req.userId!, ...userIds.filter((id) => id !== req.userId)];
  const groups = orderedIds
    .filter((id) => byUser.has(id))
    .map((id) => {
      const userStories = byUser.get(id)!;
      return {
        user: userStories[0].user,
        stories: userStories.map((s) => ({
          id: s.id,
          userId: s.userId,
          imageUrl: s.imageUrl,
          caption: s.caption,
          expiresAt: s.expiresAt,
          createdAt: s.createdAt,
          viewed: s.views.length > 0,
        })),
        hasUnviewed: userStories.some((s) => s.views.length === 0),
      };
    });

  sendSuccess(res, groups);
};

export const createStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const file = req.file as Express.Multer.File & { path: string; filename: string };
  if (!file) { sendError(res, "Image required", 400); return; }

  const { caption } = req.body;
  const expiresAt = new Date(Date.now() + STORY_TTL_HOURS * 60 * 60 * 1000);

  const story = await prisma.story.create({
    data: {
      userId: req.userId!,
      imageUrl: file.path,
      publicId: file.filename,
      caption: caption || null,
      expiresAt,
    },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  sendSuccess(res, { ...story, viewed: false }, "Story created", 201);
};

export const viewStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) { sendError(res, "Story not found", 404); return; }
  if (story.userId === req.userId) { sendSuccess(res, null); return; } // own story, no-op

  await prisma.storyView.upsert({
    where: { storyId_userId: { storyId: id, userId: req.userId! } },
    update: {},
    create: { storyId: id, userId: req.userId! },
  });

  sendSuccess(res, null);
};

export const getStoryViewers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) { sendError(res, "Story not found", 404); return; }
  if (story.userId !== req.userId) { sendError(res, "Forbidden", 403); return; }

  const views = await prisma.storyView.findMany({
    where: { storyId: id },
    include: { user: { select: { id: true, username: true, avatarUrl: true, displayName: true } } },
    orderBy: { createdAt: "desc" },
  });

  sendSuccess(res, { views: views.map((v) => v.user), count: views.length });
};

export const deleteStory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) { sendError(res, "Story not found", 404); return; }
  if (story.userId !== req.userId) { sendError(res, "Forbidden", 403); return; }

  await prisma.story.delete({ where: { id } });
  sendSuccess(res, null, "Story deleted");
};
