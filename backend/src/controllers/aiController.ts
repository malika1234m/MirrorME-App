import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { analyzeOutfit, generateStylistAdvice } from "../services/openaiService";
import { AuthenticatedRequest } from "../types";

export const getAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { postId } = req.params;

  const analysis = await prisma.outfitAnalysis.findUnique({ where: { postId } });

  if (!analysis) { sendError(res, "Analysis not ready yet", 404); return; }
  sendSuccess(res, analysis);
};

export const reanalyzePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { postId } = req.params;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) { sendError(res, "Post not found", 404); return; }
  if (post.userId !== req.userId) { sendError(res, "Forbidden", 403); return; }

  const result = await analyzeOutfit(post.imageUrl);

  const analysis = await prisma.outfitAnalysis.upsert({
    where: { postId },
    update: {
      clothingTypes: result.clothingTypes,
      colors: result.colors,
      fashionStyles: result.fashionStyles,
      stylistTips: result.stylistTips,
      season: result.season,
      occasion: result.occasion,
      overallStyle: result.overallStyle,
      confidence: result.confidence,
      rawResponse: result as object,
    },
    create: {
      postId,
      clothingTypes: result.clothingTypes,
      colors: result.colors,
      fashionStyles: result.fashionStyles,
      stylistTips: result.stylistTips,
      season: result.season,
      occasion: result.occasion,
      overallStyle: result.overallStyle,
      confidence: result.confidence,
      rawResponse: result as object,
    },
  });

  sendSuccess(res, analysis, "Analysis updated");
};

export const getStylistAdvice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { postId } = req.params;

  const analysis = await prisma.outfitAnalysis.findUnique({ where: { postId } });
  if (!analysis) { sendError(res, "No analysis found for this post", 404); return; }

  const description = `${analysis.overallStyle}. Clothing: ${analysis.clothingTypes.join(", ")}. Colors: ${analysis.colors.join(", ")}. Style: ${analysis.fashionStyles.join(", ")}.`;

  const tips = await generateStylistAdvice(description);
  sendSuccess(res, { tips, analysis });
};

export const saveOutfit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { postId } = req.params;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) { sendError(res, "Post not found", 404); return; }

  const existing = await prisma.savedOutfit.findUnique({
    where: { userId_postId: { userId: req.userId!, postId } },
  });

  if (existing) {
    await prisma.savedOutfit.delete({ where: { id: existing.id } });
    sendSuccess(res, { saved: false }, "Removed from saved");
  } else {
    await prisma.savedOutfit.create({ data: { userId: req.userId!, postId } });
    sendSuccess(res, { saved: true }, "Outfit saved");
  }
};

export const getSavedOutfits = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const saved = await prisma.savedOutfit.findMany({
    where: { userId: req.userId },
    include: {
      post: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          outfitAnalysis: true,
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  sendSuccess(res, saved.map((s) => s.post));
};
