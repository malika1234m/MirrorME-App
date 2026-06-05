import { Router } from "express";
import { body } from "express-validator";
import {
  register, login, getMe, updateProfile,
  logout, forgotPassword, resetPassword, deleteAccount,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { uploadAvatar } from "../middleware/upload";

const router = Router();

const registerRules = [
  body("email").isEmail().normalizeEmail(),
  body("username").isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body("password").isLength({ min: 8 }),
];
const loginRules = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

router.post("/register", registerRules, register);
router.post("/login", loginRules, login);
router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, uploadAvatar, updateProfile);
router.post("/logout", authenticate, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.delete("/account", authenticate, deleteAccount);

export default router;
