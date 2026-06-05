import { Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { sendError } from "../utils/response";
import { AuthenticatedRequest } from "../types";
import { prisma } from "../config/database";

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    sendError(res, "Unauthorized — no token provided", 401);
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);

    // Check tokenVersion to support server-side logout / revocation
    if (payload.tokenVersion !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { tokenVersion: true },
      });
      if (!user || user.tokenVersion !== payload.tokenVersion) {
        sendError(res, "Session expired — please sign in again", 401);
        return;
      }
    }

    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    sendError(res, "Unauthorized — invalid or expired token", 401);
  }
};
