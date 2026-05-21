import OpenAI from "openai";
import { OutfitAnalysisResult } from "../types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ANALYSIS_PROMPT = `You are a professional fashion stylist and AI analyst. Analyze this outfit image and return a JSON object with these exact fields:

{
  "clothingTypes": ["string array of clothing items detected, e.g. 'crop top', 'wide-leg jeans', 'ankle boots'"],
  "colors": ["string array of main colors, e.g. 'sage green', 'off-white', 'camel brown'"],
  "fashionStyles": ["string array of style categories, e.g. 'streetwear', 'minimalist', 'Y2K', 'business casual'"],
  "stylistTips": ["3-5 specific, actionable styling suggestions to improve or complement this outfit"],
  "season": "best season for this outfit: Spring, Summer, Fall, Winter, or All-Season",
  "occasion": "best occasion: Casual, Date Night, Work, Party, Gym, Beach, etc.",
  "overallStyle": "one sentence describing the overall aesthetic of this outfit",
  "confidence": 0.95
}

Be specific, trendy, and helpful. Focus on Gen-Z and millennial fashion sensibilities. Return only valid JSON.`;

export const analyzeOutfit = async (
  imageUrl: string
): Promise<OutfitAnalysisResult> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: ANALYSIS_PROMPT },
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
        ],
      },
    ],
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No analysis returned from OpenAI");

  const parsed = JSON.parse(content) as OutfitAnalysisResult;
  return parsed;
};

export const generateStylistAdvice = async (
  outfitDescription: string
): Promise<string[]> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a top fashion stylist for Gen-Z. Give specific, trendy, actionable advice. Be encouraging and direct.",
      },
      {
        role: "user",
        content: `Give me 5 specific styling tips for this outfit: ${outfitDescription}. Return as a JSON array of strings.`,
      },
    ],
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  const parsed = JSON.parse(content) as { tips?: string[] };
  return parsed.tips || [];
};
