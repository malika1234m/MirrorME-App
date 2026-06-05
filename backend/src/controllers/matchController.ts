import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";
import { embedImage, cosineSimilarity } from "../services/embeddingService";

export const matchByPhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const file = req.file;
  if (!file || !file.buffer) { sendError(res, "Image required", 400); return; }

  // Convert buffer to base64 data URL — no Cloudinary needed for match queries
  const base64 = file.buffer.toString("base64");
  const dataUrl = `data:${file.mimetype};base64,${base64}`;

  // Fetch all in-stock products
  const allProducts = await prisma.product.findMany({
    where: { inStock: true },
    select: {
      id: true, title: true, description: true, price: true, currency: true,
      imageUrl: true, shopLink: true, fashionStyles: true, colors: true,
      clothingTypes: true, sizes: true, season: true, occasion: true,
      embedding: true,
      business: {
        select: { id: true, brandName: true, slug: true, logoUrl: true, isVerified: true, category: true },
      },
    },
  });

  if (allProducts.length === 0) {
    sendSuccess(res, { matches: [], total: 0, imageUrl: "" }, "No products available yet");
    return;
  }

  // Try AI embedding match first
  const productsWithEmbeddings = allProducts.filter((p) => p.embedding && p.embedding.length > 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let results: any[];
  let matchMethod = "ai";

  if (productsWithEmbeddings.length > 0) {
    try {
      const queryEmbedding = await embedImage(dataUrl);
      results = productsWithEmbeddings.map(({ embedding, ...rest }) => ({
        ...rest,
        score: cosineSimilarity(queryEmbedding, embedding),
      })).sort((a, b) => b.score - a.score).slice(0, 20);
    } catch (aiErr) {
      console.warn("AI embedding failed, falling back to catalog:", aiErr instanceof Error ? aiErr.message : aiErr);
      matchMethod = "catalog";
      results = fallbackMatch(allProducts);
    }
  } else {
    matchMethod = "catalog";
    results = fallbackMatch(allProducts);
  }

  // Save search history (non-blocking)
  prisma.matchSearch.create({
    data: {
      userId: req.userId!,
      imageUrl: "",
      publicId: "",
      embedding: [],
      results: JSON.stringify(results.slice(0, 5).map((r) => r.id)),
    },
  }).catch(() => {});

  sendSuccess(res, {
    matches: results,
    total: results.length,
    imageUrl: "",
    matchMethod,
  }, matchMethod === "catalog" ? "Showing full catalog — AI matching unavailable" : "AI match complete");
};

function fallbackMatch(
  products: Array<{ embedding: number[]; [key: string]: unknown }>
): Array<Record<string, unknown> & { score: number }> {
  return products.map(({ embedding: _e, ...rest }, i) => ({
    ...rest,
    score: 1 - i * 0.01,
  }));
}

export const getMatchHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const searches = await prisma.matchSearch.findMany({
    where: { userId: req.userId! },
    select: { id: true, imageUrl: true, createdAt: true, results: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  sendSuccess(res, searches);
};
