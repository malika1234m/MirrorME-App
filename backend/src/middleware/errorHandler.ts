import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isProd = process.env.NODE_ENV === "production";
  const statusCode = err.statusCode || 500;

  // In production, never expose internal error details
  const message = isProd && !err.isOperational
    ? "Something went wrong. Please try again."
    : err.message || "Internal server error";

  if (!isProd) console.error("Error:", err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(!isProd && { stack: err.stack }),
  });
};

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: "Route not found" });
};
