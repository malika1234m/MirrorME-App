import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import commentRoutes from "./routes/comments";
import ratingRoutes from "./routes/ratings";
import followRoutes from "./routes/follows";
import aiRoutes from "./routes/ai";
import storyRoutes from "./routes/stories";
import businessRoutes from "./routes/business";
import productRoutes from "./routes/products";
import matchRoutes from "./routes/match";
import adminRoutes from "./routes/admin";
import wardrobeRoutes from "./routes/wardrobe";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { prisma } from "./config/database";

const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = process.env.APP_VERSION || "1.0.0";
const MIN_CLIENT_VERSION = process.env.MIN_CLIENT_VERSION || "1.0.0";

// ── Security ──────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS === "*"
    ? "*"
    : process.env.ALLOWED_ORIGINS?.split(",") ?? "*",
  credentials: true,
}));

// ── Rate limiting ──────────────────────────────
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: "Too many requests" }));
app.use("/api",      rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// ── Parsing ────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Health & version ───────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", service: "MirrorME API" }));

// App version check — client calls this on startup to detect forced updates
app.get("/api/version", (_req, res) => {
  res.json({
    version: APP_VERSION,
    minClientVersion: MIN_CLIENT_VERSION,
    message: "Update available! Please update MirrorME for the best experience.",
  });
});

// ── Routes ─────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/posts",     postRoutes);
app.use("/api/comments",  commentRoutes);
app.use("/api/ratings",   ratingRoutes);
app.use("/api/users",     followRoutes);
app.use("/api/ai",        aiRoutes);
app.use("/api/stories",   storyRoutes);
app.use("/api/business",  businessRoutes);
app.use("/api/products",  productRoutes);
app.use("/api/match",     matchRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/wardrobe",  wardrobeRoutes);

// ── Error handling ──────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Startup tasks ───────────────────────────────
async function startup() {
  // Delete expired stories from the database (runs once at startup, then hourly)
  const cleanExpiredStories = async () => {
    try {
      const { count } = await prisma.story.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      if (count > 0) console.log(`🧹  Cleaned ${count} expired stories`);
    } catch (err) {
      console.error("Story cleanup failed:", err);
    }
  };

  await cleanExpiredStories();
  setInterval(cleanExpiredStories, 60 * 60 * 1000); // repeat hourly

  // Clean expired reset tokens hourly too
  const cleanExpiredTokens = async () => {
    try {
      await prisma.user.updateMany({
        where: { resetTokenExpiry: { lt: new Date() }, resetToken: { not: null } },
        data: { resetToken: null, resetTokenExpiry: null },
      });
    } catch {}
  };
  await cleanExpiredTokens();
  setInterval(cleanExpiredTokens, 60 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`MirrorME API running on port ${PORT} [${process.env.NODE_ENV ?? "development"}]`);
  });
}

startup().catch(console.error);

export default app;
