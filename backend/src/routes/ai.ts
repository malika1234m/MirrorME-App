import { Router } from "express";
import {
  getAnalysis, reanalyzePost, getStylistAdvice, saveOutfit, getSavedOutfits,
} from "../controllers/aiController";
import { similar, trending } from "../controllers/recommendationController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/analysis/:postId", getAnalysis);
router.post("/analyze/:postId", reanalyzePost);
router.get("/stylist/:postId", getStylistAdvice);
router.post("/save/:postId", saveOutfit);
router.get("/saved", getSavedOutfits);
router.get("/similar/:postId", similar);
router.get("/trending", trending);

export default router;
