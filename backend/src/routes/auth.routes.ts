import { Router } from "express";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "../controllers/auth.controller.js";
import { requireAuthentication } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get(
  "/me",
  requireAuthentication,
  getCurrentUser,
);

export default router;