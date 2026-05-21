import { Router } from "express";
import { getStories, createStory, viewStory, getStoryViewers, deleteStory } from "../controllers/storyController";
import { authenticate } from "../middleware/auth";
import { uploadStory } from "../middleware/upload";

const router = Router();

router.use(authenticate);

router.get("/", getStories);
router.post("/", uploadStory, createStory);
router.post("/:id/view", viewStory);
router.get("/:id/viewers", getStoryViewers);
router.delete("/:id", deleteStory);

export default router;
