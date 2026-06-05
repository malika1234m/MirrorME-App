import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";

const PRODUCT_SELECT = {
  id: true, title: true, description: true, price: true, currency: true,
  imageUrl: true, shopLink: true, fashionStyles: true, colors: true,
  clothingTypes: true, sizes: true, inStock: true, season: true, occasion: true,
  createdAt: true,
  business: { select: { id: true, brandName: true, slug: true, logoUrl: true, isVerified: true } },
};

export const getWardrobeItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const items = await prisma.wardrobeItem.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    include: { product: { select: PRODUCT_SELECT } },
  });
  sendSuccess(res, items.map((i) => i.product));
};

export const toggleWardrobeItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) { sendError(res, "Product not found", 404); return; }

  const existing = await prisma.wardrobeItem.findUnique({
    where: { userId_productId: { userId: req.userId!, productId } },
  });

  if (existing) {
    await prisma.wardrobeItem.delete({ where: { id: existing.id } });
    sendSuccess(res, { inWardrobe: false }, "Removed from wardrobe");
  } else {
    await prisma.wardrobeItem.create({ data: { userId: req.userId!, productId } });
    sendSuccess(res, { inWardrobe: true }, "Added to wardrobe");
  }
};

export const getBrowseCatalog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { category, gender, search, page } = req.query as Record<string, string>;
  const limit = 20;
  const pageNum = Math.max(1, parseInt(page ?? "1") || 1);
  const skip = (pageNum - 1) * limit;

  const where: Record<string, unknown> = { inStock: true };
  if (category) where.clothingTypes = { has: category };
  if (gender) where.fashionStyles = { has: gender };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, select: PRODUCT_SELECT, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.product.count({ where }),
  ]);

  sendSuccess(res, products, "ok", 200);
};

export const recommendSize = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { height, weight, gender = "unisex", clothingType = "top", availableSizes = [] } = req.body;

  if (!height || !weight) { sendError(res, "Height and weight required", 400); return; }

  const h = parseFloat(height);
  const w = parseFloat(weight);
  const bmi = w / Math.pow(h / 100, 2);

  const isFemale = gender === "female";
  const chest = isFemale ? 78 + (bmi - 20) * 1.8 + (h - 160) * 0.1 : 88 + (bmi - 22) * 2.0 + (h - 170) * 0.15;
  const waist = isFemale ? 62 + (bmi - 20) * 2.2 : 74 + (bmi - 22) * 2.5;

  const type = (clothingType as string).toLowerCase();
  const isBottom = type.includes("bottom") || type.includes("pant") || type.includes("jean") ||
                   type.includes("skirt") || type.includes("short") || type.includes("trouser");
  const measurement = isBottom ? waist : chest;

  const SIZE_BOUNDS: Array<[string, number, number]> = [
    ["XS", 76, 82], ["S", 82, 88], ["M", 88, 94],
    ["L", 94, 100], ["XL", 100, 107], ["XXL", 107, 117], ["XXXL", 117, 130],
  ];

  let recommended = "M";
  let confidence = 0.7;

  for (const [size, min, max] of SIZE_BOUNDS) {
    if (measurement >= min && measurement < max) {
      recommended = size;
      const pos = (measurement - min) / (max - min);
      confidence = pos > 0.2 && pos < 0.8 ? 0.9 : 0.75;
      break;
    }
  }

  if (measurement < 76) { recommended = "XS"; confidence = 0.85; }
  if (measurement >= 130) { recommended = "XXXL"; confidence = 0.85; }

  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const sizes = availableSizes as string[];
  if (sizes.length > 0 && !sizes.includes(recommended)) {
    const recIdx = sizeOrder.indexOf(recommended);
    let best = recommended;
    let minDist = Infinity;
    for (const s of sizes) {
      const d = Math.abs(sizeOrder.indexOf(s) - recIdx);
      if (d < minDist) { minDist = d; best = s; }
    }
    recommended = best;
    confidence = Math.max(0.45, confidence - minDist * 0.1);
  }

  const allSizes = SIZE_BOUNDS.map(([size, min, max]) => {
    let fit: string;
    if (measurement < min - 6) fit = "too_large";
    else if (measurement < min) fit = "loose";
    else if (measurement >= max + 6) fit = "too_small";
    else if (measurement >= max) fit = "snug";
    else fit = "perfect";
    return { size, fit };
  });

  sendSuccess(res, {
    recommended,
    confidence: Math.round(confidence * 100),
    chest: Math.round(chest),
    waist: Math.round(waist),
    bmi: Math.round(bmi * 10) / 10,
    allSizes,
    note: confidence < 0.6 ? "Consider sizing up for a relaxed fit" : null,
  });
};

export const updateMeasurements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { height, weight, gender } = req.body;
  const data: Record<string, unknown> = {};
  if (height !== undefined) data.height = parseFloat(height);
  if (weight !== undefined) data.weight = parseFloat(weight);
  if (gender !== undefined) data.gender = gender;

  const user = await prisma.user.update({ where: { id: req.userId! }, data });
  sendSuccess(res, { height: user.height, weight: user.weight, gender: user.gender }, "Measurements updated");
};
