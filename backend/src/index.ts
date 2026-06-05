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

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  })
);

// Rate limiting
app.use(
  "/api/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: "Too many requests" })
);
app.use(
  "/api",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 200 })
);

// Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Health
app.get("/health", (_req, res) => res.json({ status: "ok", service: "MirrorME API" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/users", followRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/products", productRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wardrobe", wardrobeRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`MirrorME API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

export default app;
