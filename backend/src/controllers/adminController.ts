import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";

const BUSINESS_ADMIN_SELECT = {
  id: true, brandName: true, slug: true, category: true, bio: true,
  logoUrl: true, website: true, instagram: true, location: true,
  isVerified: true, verificationStatus: true, tier: true, createdAt: true,
  user: { select: { id: true, email: true, username: true, displayName: true } },
  _count: { select: { products: true, follows: true } },
};

// GET /admin/brands — all brands with verification status
export const listAllBrands = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const status = req.query.status as string | undefined;
  const where = status ? { verificationStatus: status } : {};

  const brands = await prisma.businessAccount.findMany({
    where,
    select: BUSINESS_ADMIN_SELECT,
    orderBy: { createdAt: "desc" },
  });
  sendSuccess(res, brands);
};

// POST /admin/brands/:id/verify — approve verification
export const verifyBrand = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const brand = await prisma.businessAccount.findUnique({ where: { id } });
  if (!brand) { sendError(res, "Brand not found", 404); return; }

  const updated = await prisma.businessAccount.update({
    where: { id },
    data: { isVerified: true, verificationStatus: "verified", tier: "pro" },
    select: BUSINESS_ADMIN_SELECT,
  });
  sendSuccess(res, updated, `${updated.brandName} is now verified ✓`);
};

// POST /admin/brands/:id/reject — reject verification
export const rejectBrand = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;
  const brand = await prisma.businessAccount.findUnique({ where: { id } });
  if (!brand) { sendError(res, "Brand not found", 404); return; }

  const updated = await prisma.businessAccount.update({
    where: { id },
    data: { isVerified: false, verificationStatus: "rejected" },
    select: BUSINESS_ADMIN_SELECT,
  });
  sendSuccess(res, updated, `Verification rejected${reason ? `: ${reason}` : ""}`);
};

// POST /admin/brands/:id/revoke — remove verification
export const revokeBrand = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updated = await prisma.businessAccount.update({
    where: { id },
    data: { isVerified: false, verificationStatus: "none", tier: "free" },
    select: BUSINESS_ADMIN_SELECT,
  });
  sendSuccess(res, updated, "Verification revoked");
};

// GET /admin/users — all users
export const listUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, username: true, displayName: true,
      isVerified: true, isAdmin: true, createdAt: true,
      _count: { select: { posts: true, followers: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  sendSuccess(res, users);
};

// POST /admin/users/:id/grant-admin — make someone an admin
export const grantAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await prisma.user.update({
    where: { id },
    data: { isAdmin: true },
    select: { id: true, email: true, username: true, isAdmin: true },
  });
  sendSuccess(res, user, `${user.username} is now an admin`);
};

// GET /admin/stats — dashboard summary numbers
export const getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const [users, brands, pendingVerification, products, posts] = await Promise.all([
    prisma.user.count(),
    prisma.businessAccount.count(),
    prisma.businessAccount.count({ where: { verificationStatus: "pending" } }),
    prisma.product.count(),
    prisma.post.count(),
  ]);
  sendSuccess(res, { users, brands, pendingVerification, products, posts });
};
