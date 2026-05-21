import { Router } from "express";
import { body } from "express-validator";
import { register, login, getMe, updateProfile } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { uploadAvatar } from "../middleware/upload";

const router = Router();

const registerRules = [
  body("email").isEmail().normalizeEmail(),
  body("username").isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body("password").isLength({ min: 6 }),
];

const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

router.post("/register", registerRules, register);
router.post("/login", loginRules, login);
router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, uploadAvatar, updateProfile);

export default router;
