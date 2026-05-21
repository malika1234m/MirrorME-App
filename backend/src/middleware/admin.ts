import { Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) {
    sendError(res, "Admin access required", 403);
    return;
  }
  next();
};
