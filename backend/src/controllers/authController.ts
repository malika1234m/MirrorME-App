import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database";
import { signToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, username, password, displayName } = req.body;

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    sendError(res, "Email or username already taken", 409);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, username, password: hashedPassword, displayName },
    select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, bio: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email });
  sendSuccess(res, { user, token }, "Account created successfully", 201);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    sendError(res, "Invalid email or password", 401);
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });
  const { password: _, ...safeUser } = user;

  sendSuccess(res, { user: safeUser, token }, "Login successful");
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true, email: true, username: true, displayName: true,
      avatarUrl: true, bio: true, isVerified: true, isAdmin: true,
      height: true, weight: true, gender: true,
      createdAt: true,
      _count: { select: { posts: true, followers: true, following: true } },
    },
  });

  if (!user) { sendError(res, "User not found", 404); return; }
  sendSuccess(res, user);
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { displayName, bio, username } = req.body;
  const file = req.file as Express.Multer.File & { path: string; filename: string };

  if (username) {
    const existing = await prisma.user.findFirst({
      where: { username, id: { not: req.userId } },
    });
    if (existing) { sendError(res, "Username already taken", 409); return; }
  }

  const updateData: Record<string, string> = {};
  if (displayName) updateData.displayName = displayName;
  if (bio !== undefined) updateData.bio = bio;
  if (username) updateData.username = username;
  if (file) {
    updateData.avatarUrl = file.path;
    updateData.avatarPublicId = file.filename;
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: updateData,
    select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, bio: true },
  });

  sendSuccess(res, user, "Profile updated");
};
