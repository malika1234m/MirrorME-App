import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";
import { embedImage } from "../services/embeddingService";

const PRODUCT_SELECT = {
  id: true, title: true, description: true, price: true, currency: true,
  imageUrl: true, shopLink: true, fashionStyles: true, colors: true,
  clothingTypes: true, sizes: true, inStock: true, season: true, occasion: true,
  createdAt: true,
  business: { select: { id: true, brandName: true, slug: true, logoUrl: true, isVerified: true } },
};

export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const business = await prisma.businessAccount.findUnique({ where: { userId: req.userId! } });
  if (!business) { sendError(res, "Business account required", 403); return; }

  const file = req.file as Express.Multer.File & { path: string; filename: string };
  if (!file) { sendError(res, "Product image required", 400); return; }

  const {
    title, description, price, currency = "USD", shopLink,
    fashionStyles, colors, clothingTypes, sizes, season, occasion,
  } = req.body;

  if (!title) { sendError(res, "Title is required", 400); return; }

  const parsedStyles: string[] = fashionStyles ? JSON.parse(fashionStyles) : [];
  const parsedColors: string[] = colors ? JSON.parse(colors) : [];
  const parsedClothing: string[] = clothingTypes ? JSON.parse(clothingTypes) : [];
  const parsedSizes: string[] = sizes ? JSON.parse(sizes) : [];

  // Create product immediately, generate embedding async
  const product = await prisma.product.create({
    data: {
      businessId: business.id,
      title,
      description,
      price: price ? parseFloat(price) : null,
      currency,
      imageUrl: file.path,
      publicId: file.filename,
      shopLink,
      fashionStyles: parsedStyles,
      colors: parsedColors,
      clothingTypes: parsedClothing,
      sizes: parsedSizes,
      season,
      occasion,
      embedding: [],
    },
    select: PRODUCT_SELECT,
  });

  // Generate embedding in background
  embedImage(file.path)
    .then((embedding) => prisma.product.update({ where: { id: product.id }, data: { embedding } }))
    .catch(console.error);

  sendSuccess(res, product, "Product created", 201);
};

export const getBusinessProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id: businessId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;

  const products = await prisma.product.findMany({
    where: { businessId, inStock: true },
    select: PRODUCT_SELECT,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  sendSuccess(res, products);
};

export const getMyProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const business = await prisma.businessAccount.findUnique({ where: { userId: req.userId! } });
  if (!business) { sendError(res, "Business account required", 403); return; }

  const products = await prisma.product.findMany({
    where: { businessId: business.id },
    select: { ...PRODUCT_SELECT, inStock: true },
    orderBy: { createdAt: "desc" },
  });

  sendSuccess(res, products);
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const business = await prisma.businessAccount.findUnique({ where: { userId: req.userId! } });
  if (!business) { sendError(res, "Business account required", 403); return; }

  const product = await prisma.product.findFirst({ where: { id, businessId: business.id } });
  if (!product) { sendError(res, "Product not found", 404); return; }

  const { title, description, price, shopLink, inStock } = req.body;
  const data: Record<string, unknown> = {};
  if (title) data.title = title;
  if (description !== undefined) data.description = description;
  if (price !== undefined) data.price = parseFloat(price);
  if (shopLink !== undefined) data.shopLink = shopLink;
  if (inStock !== undefined) data.inStock = inStock === "true" || inStock === true;

  const updated = await prisma.product.update({ where: { id }, data, select: PRODUCT_SELECT });
  sendSuccess(res, updated, "Product updated");
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const business = await prisma.businessAccount.findUnique({ where: { userId: req.userId! } });
  if (!business) { sendError(res, "Business account required", 403); return; }

  const product = await prisma.product.findFirst({ where: { id, businessId: business.id } });
  if (!product) { sendError(res, "Product not found", 404); return; }

  await prisma.product.delete({ where: { id } });
  sendSuccess(res, null, "Product deleted");
};

export const toggleSaveProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const existing = await prisma.savedProduct.findUnique({
    where: { userId_productId: { userId: req.userId!, productId: id } },
  });

  if (existing) {
    await prisma.savedProduct.delete({ where: { id: existing.id } });
    sendSuccess(res, { saved: false });
  } else {
    await prisma.savedProduct.create({ data: { userId: req.userId!, productId: id } });
    sendSuccess(res, { saved: true });
  }
};
