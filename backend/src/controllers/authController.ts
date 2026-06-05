import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../config/database";
import { signToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";
import { emailService } from "../services/emailService";

/* ── helpers ── */
const userPublicSelect = {
  id: true, email: true, username: true, displayName: true,
  avatarUrl: true, bio: true, isVerified: true, isAdmin: true,
  height: true, weight: true, gender: true, createdAt: true,
  _count: { select: { posts: true, followers: true, following: true } },
};

/* ── register ── */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, username, password, displayName } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) { sendError(res, "Email or username already taken", 409); return; }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, username, password: hashedPassword, displayName },
    select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, bio: true, createdAt: true, tokenVersion: true },
  });

  const token = signToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion });

  // Send welcome email (non-blocking)
  emailService.sendWelcome(user.email, user.username).catch(() => {});

  sendSuccess(res, { user, token }, "Account created successfully", 201);
};

/* ── login ── */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    sendError(res, "Invalid email or password", 401);
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion });
  const { password: _, resetToken: __, resetTokenExpiry: ___, ...safeUser } = user;
  sendSuccess(res, { user: safeUser, token }, "Login successful");
};

/* ── get me ── */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: userPublicSelect,
  });
  if (!user) { sendError(res, "User not found", 404); return; }
  sendSuccess(res, user);
};

/* ── update profile ── */
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { displayName, bio, username, height, weight, gender } = req.body;
  const file = req.file as Express.Multer.File & { path: string; filename: string };

  if (username) {
    const taken = await prisma.user.findFirst({ where: { username, id: { not: req.userId } } });
    if (taken) { sendError(res, "Username already taken", 409); return; }
  }

  const data: Record<string, unknown> = {};
  if (displayName !== undefined) data.displayName = displayName;
  if (bio !== undefined) data.bio = bio;
  if (username) data.username = username;
  if (height !== undefined) data.height = parseFloat(height);
  if (weight !== undefined) data.weight = parseFloat(weight);
  if (gender !== undefined) data.gender = gender;
  if (file) { data.avatarUrl = file.path; data.avatarPublicId = file.filename; }

  const user = await prisma.user.update({ where: { id: req.userId }, data, select: userPublicSelect });
  sendSuccess(res, user, "Profile updated");
};

/* ── logout (invalidates all existing tokens) ── */
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await prisma.user.update({
    where: { id: req.userId! },
    data: { tokenVersion: { increment: 1 } },
  });
  sendSuccess(res, null, "Logged out successfully");
};

/* ── forgot password ── */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  // Always return success — never reveal whether email exists (security)
  const successMsg = "If that email is registered, a reset link has been sent.";

  if (!email) { sendSuccess(res, null, successMsg); return; }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    emailService.sendPasswordReset(email, token).catch(() => {});
  }

  sendSuccess(res, null, successMsg);
};

/* ── reset password ── */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) { sendError(res, "Token and new password are required", 400); return; }
  if (newPassword.length < 8) { sendError(res, "Password must be at least 8 characters", 400); return; }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) { sendError(res, "Invalid or expired reset link", 400); return; }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
      tokenVersion: { increment: 1 }, // invalidate all existing sessions
    },
  });

  sendSuccess(res, null, "Password reset successfully. Please sign in with your new password.");
};

/* ── delete account ── */
export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { password } = req.body;
  if (!password) { sendError(res, "Password required to delete account", 400); return; }

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) { sendError(res, "User not found", 404); return; }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) { sendError(res, "Incorrect password", 401); return; }

  // Cascade deletes everything (posts, stories, follows, etc.) via Prisma onDelete: Cascade
  await prisma.user.delete({ where: { id: req.userId! } });
  sendSuccess(res, null, "Account permanently deleted");
};
