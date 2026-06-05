import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface OutfitAnalysisResult {
  clothingTypes: string[];
  colors: string[];
  fashionStyles: string[];
  stylistTips: string[];
  season: string;
  occasion: string;
  overallStyle: string;
  confidence: number;
}
