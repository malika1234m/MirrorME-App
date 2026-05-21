import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";

const BUSINESS_SELECT = {
  id: true, brandName: true, slug: true, logoUrl: true, coverUrl: true,
  category: true, bio: true, website: true, instagram: true, location: true,
  isVerified: true, verificationStatus: true, tier: true, createdAt: true,
  user: { select: { id: true, username: true, avatarUrl: true } },
  _count: { select: { products: true, follows: true } },
};

export const registerBusiness = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const existing = await prisma.businessAccount.findUnique({ where: { userId: req.userId! } });
  if (existing) { sendError(res, "Business account already exists", 409); return; }

  const { brandName, category, bio, website, instagram, location, email } = req.body;
  if (!brandName || !category) { sendError(res, "Brand name and category are required", 400); return; }

  const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const existingSlug = await prisma.businessAccount.findFirst({ where: { slug: { startsWith: slug } } });
  const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

  const business = await prisma.businessAccount.create({
    data: { userId: req.userId!, brandName, slug: finalSlug, category, bio, website, instagram, location, email },
    select: BUSINESS_SELECT,
  });

  sendSuccess(res, business, "Business account created", 201);
};

export const getMyBusiness = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const business = await prisma.businessAccount.findUnique({
    where: { userId: req.userId! },
    select: BUSINESS_SELECT,
  });
  if (!business) { sendError(res, "No business account found", 404); return; }
  sendSuccess(res, business);
};

export const getBusiness = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const business = await prisma.businessAccount.findUnique({
    where: { id },
    select: BUSINESS_SELECT,
  });
  if (!business) { sendError(res, "Business not found", 404); return; }

  const isFollowing = !!(await prisma.businessFollow.findUnique({
    where: { userId_businessId: { userId: req.userId!, businessId: id } },
  }));

  sendSuccess(res, { ...business, isFollowing });
};

export const updateBusiness = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const business = await prisma.businessAccount.findUnique({ where: { userId: req.userId! } });
  if (!business) { sendError(res, "Business not found", 404); return; }

  const { brandName, bio, website, instagram, location, email, category } = req.body;
  const file = req.file as (Express.Multer.File & { path: string; filename: string }) | undefined;

  const data: Record<string, unknown> = {};
  if (brandName) data.brandName = brandName;
  if (bio !== undefined) data.bio = bio;
  if (website !== undefined) data.website = website;
  if (instagram !== undefined) data.instagram = instagram;
  if (location !== undefined) data.location = location;
  if (email !== undefined) data.email = email;
  if (category) data.category = category;
  if (file) { data.logoUrl = file.path; data.logoPublicId = file.filename; }

  const updated = await prisma.businessAccount.update({
    where: { id: business.id },
    data,
    select: BUSINESS_SELECT,
  });

  sendSuccess(res, updated, "Business updated");
};

export const requestVerification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const business = await prisma.businessAccount.findUnique({ where: { userId: req.userId! } });
  if (!business) { sendError(res, "Business not found", 404); return; }
  if (business.isVerified) { sendError(res, "Already verified", 400); return; }
  if (business.verificationStatus === "pending") { sendError(res, "Request already submitted", 400); return; }

  const updated = await prisma.businessAccount.update({
    where: { id: business.id },
    data: { verificationStatus: "pending" },
    select: BUSINESS_SELECT,
  });
  sendSuccess(res, updated, "Verification request submitted. The MirrorME team will review your brand.");
};

export const toggleFollow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const business = await prisma.businessAccount.findUnique({ where: { id } });
  if (!business) { sendError(res, "Business not found", 404); return; }

  const existing = await prisma.businessFollow.findUnique({
    where: { userId_businessId: { userId: req.userId!, businessId: id } },
  });

  if (existing) {
    await prisma.businessFollow.delete({ where: { id: existing.id } });
    sendSuccess(res, { following: false }, "Unfollowed");
  } else {
    await prisma.businessFollow.create({ data: { userId: req.userId!, businessId: id } });
    sendSuccess(res, { following: true }, "Following");
  }
};

export const listBusinesses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { category, search, page = "1" } = req.query;
  const take = 20;
  const skip = (parseInt(page as string) - 1) * take;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (search) where.brandName = { contains: search as string, mode: "insensitive" };

  const businesses = await prisma.businessAccount.findMany({
    where,
    select: BUSINESS_SELECT,
    orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
    skip,
    take,
  });

  const withFollow = await Promise.all(
    businesses.map(async (b) => {
      const isFollowing = !!(await prisma.businessFollow.findUnique({
        where: { userId_businessId: { userId: req.userId!, businessId: b.id } },
      }));
      return { ...b, isFollowing };
    })
  );

  sendSuccess(res, withFollow);
};

export const getFeaturedBusinesses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const businesses = await prisma.businessAccount.findMany({
    where: { isVerified: true },
    select: BUSINESS_SELECT,
    orderBy: { follows: { _count: "desc" } },
    take: 8,
  });

  sendSuccess(res, businesses);
};
